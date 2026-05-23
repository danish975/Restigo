"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const review_model_1 = require("./review.model");
const booking_model_1 = require("../booking/booking.model");
const property_model_1 = require("../property/property.model");
const auth_1 = require("../../core/middleware/auth");
const validate_1 = require("../../core/middleware/validate");
const errors_1 = require("../../core/errors");
const router = (0, express_1.Router)();
// ─── DTOs ───
const createReviewDto = zod_1.z.object({
    bookingId: zod_1.z.string().min(1),
    rating: zod_1.z.number().min(1).max(5),
    title: zod_1.z.string().min(3).max(200),
    comment: zod_1.z.string().min(10).max(2000),
    images: zod_1.z.array(zod_1.z.string().url()).max(5).optional(),
});
const respondToReviewDto = zod_1.z.object({
    message: zod_1.z.string().min(5).max(1000),
});
// ─── Create Review ───
router.post('/', auth_1.authenticate, (0, validate_1.validate)(createReviewDto), async (req, res, next) => {
    try {
        const { bookingId, rating, title, comment, images } = req.body;
        const userId = req.user.userId;
        // Verify booking exists and belongs to user and is completed
        const booking = await booking_model_1.Booking.findOne({
            _id: bookingId,
            userId,
            status: { $in: ['completed', 'checked_in', 'confirmed'] },
        });
        if (!booking) {
            throw new errors_1.BadRequestError('You can only review completed bookings');
        }
        // Check if already reviewed
        const existing = await review_model_1.Review.findOne({
            userId,
            propertyId: booking.propertyId,
        });
        if (existing) {
            throw new errors_1.ConflictError('You have already reviewed this property');
        }
        const review = await review_model_1.Review.create({
            userId,
            propertyId: booking.propertyId,
            bookingId,
            rating,
            title,
            comment,
            images: images || [],
            isVerified: true, // Verified since we checked the booking
        });
        // Update property average rating
        const stats = await review_model_1.Review.aggregate([
            { $match: { propertyId: booking.propertyId } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        if (stats.length > 0) {
            await property_model_1.Property.findByIdAndUpdate(booking.propertyId, {
                'rating.average': Math.round(stats[0].avgRating * 10) / 10,
                'rating.count': stats[0].count,
            });
        }
        res.status(201).json({ success: true, data: review });
    }
    catch (error) {
        next(error);
    }
});
// ─── Get Reviews for Property ───
router.get('/property/:propertyId', async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || '-createdAt';
        const [reviews, total] = await Promise.all([
            review_model_1.Review.find({ propertyId })
                .populate('userId', 'firstName lastName avatar')
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit),
            review_model_1.Review.countDocuments({ propertyId }),
        ]);
        // Rating distribution
        const distribution = await review_model_1.Review.aggregate([
            { $match: { propertyId: new (require('mongoose').Types.ObjectId)(propertyId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
        ]);
        res.json({
            success: true,
            data: {
                reviews,
                distribution,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// ─── Provider: Respond to Review ───
router.patch('/:reviewId/respond', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), (0, validate_1.validate)(respondToReviewDto), async (req, res, next) => {
    try {
        const review = await review_model_1.Review.findById(req.params.reviewId);
        if (!review)
            throw new errors_1.NotFoundError('Review');
        // Verify provider owns the property
        const property = await property_model_1.Property.findOne({
            _id: review.propertyId,
            providerId: req.user.userId,
        });
        if (!property && req.user.role !== 'admin') {
            throw new errors_1.BadRequestError('You can only respond to reviews on your properties');
        }
        review.response = {
            message: req.body.message,
            respondedAt: new Date(),
        };
        await review.save();
        res.json({ success: true, data: review });
    }
    catch (error) {
        next(error);
    }
});
// ─── Mark Review Helpful ───
router.post('/:reviewId/helpful', auth_1.authenticate, async (req, res, next) => {
    try {
        const review = await review_model_1.Review.findByIdAndUpdate(req.params.reviewId, { $inc: { helpful: 1 } }, { new: true });
        if (!review)
            throw new errors_1.NotFoundError('Review');
        res.json({ success: true, data: { helpful: review.helpful } });
    }
    catch (error) {
        next(error);
    }
});
// ─── Delete Review (User or Admin) ───
router.delete('/:reviewId', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const filter = { _id: req.params.reviewId };
        if (role !== 'admin')
            filter.userId = userId;
        const review = await review_model_1.Review.findOneAndDelete(filter);
        if (!review)
            throw new errors_1.NotFoundError('Review');
        // Recalculate property rating
        const stats = await review_model_1.Review.aggregate([
            { $match: { propertyId: review.propertyId } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        await property_model_1.Property.findByIdAndUpdate(review.propertyId, {
            'rating.average': stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
            'rating.count': stats.length > 0 ? stats[0].count : 0,
        });
        res.json({ success: true, message: 'Review deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=review.routes.js.map