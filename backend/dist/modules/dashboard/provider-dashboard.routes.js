"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const property_model_1 = require("../property/property.model");
const booking_model_1 = require("../booking/booking.model");
const room_model_1 = require("../room/room.model");
const auth_1 = require("../../core/middleware/auth");
const router = (0, express_1.Router)();
// ─── Provider Dashboard Overview ───
router.get('/overview', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), async (req, res, next) => {
    try {
        const providerId = req.user.userId;
        const properties = await property_model_1.Property.find({ providerId });
        const propertyIds = properties.map((p) => p._id);
        const [totalRevenue, activeBookings, totalProperties, totalRooms, upcomingCheckins] = await Promise.all([
            booking_model_1.Booking.aggregate([
                { $match: { propertyId: { $in: propertyIds }, status: { $in: ['confirmed', 'completed'] } } },
                { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
            ]),
            booking_model_1.Booking.countDocuments({ propertyId: { $in: propertyIds }, status: { $in: ['held', 'confirmed', 'checked_in'] } }),
            property_model_1.Property.countDocuments({ providerId }),
            room_model_1.Room.countDocuments({ propertyId: { $in: propertyIds } }),
            booking_model_1.Booking.find({ propertyId: { $in: propertyIds }, status: 'confirmed', 'checkIn.date': { $gte: new Date() } })
                .populate('userId', 'firstName lastName avatar')
                .populate('roomId', 'name')
                .sort({ 'checkIn.date': 1, 'checkIn.time': 1 })
                .limit(5),
        ]);
        res.json({
            success: true,
            data: {
                stats: {
                    totalRevenue: totalRevenue[0]?.total || 0,
                    activeBookings,
                    totalProperties,
                    totalRooms,
                },
                upcomingCheckins,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// ─── Earnings Analytics ───
router.get('/earnings', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), async (req, res, next) => {
    try {
        const providerId = req.user.userId;
        const properties = await property_model_1.Property.find({ providerId });
        const propertyIds = properties.map((p) => p._id);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const earnings = await booking_model_1.Booking.aggregate([
            {
                $match: {
                    propertyId: { $in: propertyIds },
                    status: { $in: ['confirmed', 'completed'] },
                    createdAt: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$pricing.totalAmount' },
                    bookings: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json({ success: true, data: earnings });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=provider-dashboard.routes.js.map