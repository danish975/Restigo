"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_model_1 = require("../booking/booking.model");
const notification_model_1 = require("../notification/notification.model");
const auth_1 = require("../../core/middleware/auth");
const router = (0, express_1.Router)();
router.get('/overview', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const [totalBookings, activeBookings, completedBookings, cancelledBookings, totalSpent, unreadNotifications, recentBookings] = await Promise.all([
            booking_model_1.Booking.countDocuments({ userId }),
            booking_model_1.Booking.countDocuments({ userId, status: { $in: ['held', 'confirmed', 'checked_in'] } }),
            booking_model_1.Booking.countDocuments({ userId, status: 'completed' }),
            booking_model_1.Booking.countDocuments({ userId, status: 'cancelled' }),
            booking_model_1.Booking.aggregate([
                { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), status: { $in: ['confirmed', 'completed'] } } },
                { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
            ]),
            notification_model_1.Notification.countDocuments({ userId, read: false }),
            booking_model_1.Booking.find({ userId }).populate('propertyId', 'name type images location').populate('roomId', 'name type').sort({ createdAt: -1 }).limit(5),
        ]);
        res.json({
            success: true,
            data: {
                stats: { totalBookings, activeBookings, completedBookings, cancelledBookings, totalSpent: totalSpent[0]?.total || 0, unreadNotifications },
                recentBookings,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/bookings', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const filter = { userId };
        if (status)
            filter.status = status;
        const [bookings, total] = await Promise.all([
            booking_model_1.Booking.find(filter).populate('propertyId', 'name type images location rating').populate('roomId', 'name type amenities').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            booking_model_1.Booking.countDocuments(filter),
        ]);
        res.json({ success: true, data: { bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
    }
    catch (error) {
        next(error);
    }
});
router.get('/spending', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const spending = await booking_model_1.Booking.aggregate([
            { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$pricing.totalAmount' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
        res.json({ success: true, data: spending });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=user-dashboard.routes.js.map