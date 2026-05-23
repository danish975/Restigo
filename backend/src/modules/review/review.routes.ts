import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Review } from './review.model';
import { Booking } from '../booking/booking.model';
import { Property } from '../property/property.model';
import { authenticate, authorize } from '../../core/middleware/auth';
import { validate } from '../../core/middleware/validate';
import { BadRequestError, NotFoundError, ConflictError } from '../../core/errors';

const router = Router();

// ─── DTOs ───
const createReviewDto = z.object({
  bookingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().min(3).max(200),
  comment: z.string().min(10).max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

const respondToReviewDto = z.object({
  message: z.string().min(5).max(1000),
});

// ─── Create Review ───
router.post(
  '/',
  authenticate,
  validate(createReviewDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId, rating, title, comment, images } = req.body;
      const userId = (req as any).user.userId;

      // Verify booking exists and belongs to user and is completed
      const booking = await Booking.findOne({
        _id: bookingId,
        userId,
        status: { $in: ['completed', 'checked_in', 'confirmed'] },
      });

      if (!booking) {
        throw new BadRequestError('You can only review completed bookings');
      }

      // Check if already reviewed
      const existing = await Review.findOne({
        userId,
        propertyId: booking.propertyId,
      });

      if (existing) {
        throw new ConflictError('You have already reviewed this property');
      }

      const review = await Review.create({
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
      const stats = await Review.aggregate([
        { $match: { propertyId: booking.propertyId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);

      if (stats.length > 0) {
        await Property.findByIdAndUpdate(booking.propertyId, {
          'rating.average': Math.round(stats[0].avgRating * 10) / 10,
          'rating.count': stats[0].count,
        });
      }

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Reviews for Property ───
router.get(
  '/property/:propertyId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sort = (req.query.sort as string) || '-createdAt';

      const [reviews, total] = await Promise.all([
        Review.find({ propertyId })
          .populate('userId', 'firstName lastName avatar')
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit),
        Review.countDocuments({ propertyId }),
      ]);

      // Rating distribution
      const distribution = await Review.aggregate([
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
    } catch (error) {
      next(error);
    }
  }
);

// ─── Provider: Respond to Review ───
router.patch(
  '/:reviewId/respond',
  authenticate,
  authorize('provider', 'admin'),
  validate(respondToReviewDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await Review.findById(req.params.reviewId);
      if (!review) throw new NotFoundError('Review');

      // Verify provider owns the property
      const property = await Property.findOne({
        _id: review.propertyId,
        providerId: (req as any).user.userId,
      });

      if (!property && (req as any).user.role !== 'admin') {
        throw new BadRequestError('You can only respond to reviews on your properties');
      }

      review.response = {
        message: req.body.message,
        respondedAt: new Date(),
      };
      await review.save();

      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Mark Review Helpful ───
router.post(
  '/:reviewId/helpful',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await Review.findByIdAndUpdate(
        req.params.reviewId,
        { $inc: { helpful: 1 } },
        { new: true }
      );
      if (!review) throw new NotFoundError('Review');
      res.json({ success: true, data: { helpful: review.helpful } });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Delete Review (User or Admin) ───
router.delete(
  '/:reviewId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const role = (req as any).user.role;

      const filter: any = { _id: req.params.reviewId };
      if (role !== 'admin') filter.userId = userId;

      const review = await Review.findOneAndDelete(filter);
      if (!review) throw new NotFoundError('Review');

      // Recalculate property rating
      const stats = await Review.aggregate([
        { $match: { propertyId: review.propertyId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);

      await Property.findByIdAndUpdate(review.propertyId, {
        'rating.average': stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        'rating.count': stats.length > 0 ? stats[0].count : 0,
      });

      res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
