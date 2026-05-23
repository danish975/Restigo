"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_model_1 = require("../auth/auth.model");
const property_model_1 = require("../property/property.model");
const booking_model_1 = require("../booking/booking.model");
const payment_model_1 = require("../payment/payment.model");
const auth_1 = require("../../core/middleware/auth");
const router = (0, express_1.Router)();
router.get('/overview', auth_1.authenticate, (0, auth_1.authorize)('admin'), async (req, res, next) => {
    try {
        const [totalUsers, totalProviders, totalProperties, totalBookings, revenueData, recentBookings] = await Promise.all([
            auth_model_1.User.countDocuments({ role: 'user' }),
            auth_model_1.User.countDocuments({ role: 'provider' }),
            property_model_1.Property.countDocuments(),
            booking_model_1.Booking.countDocuments(),
            payment_model_1.Payment.aggregate([
                { $match: { status: 'succeeded' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            booking_model_1.Booking.find()
                .populate('userId', 'firstName lastName')
                .populate('propertyId', 'name')
                .sort({ createdAt: -1 })
                .limit(10),
        ]);
        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalProviders,
                    totalProperties,
                    totalBookings,
                    totalRevenue: revenueData[0]?.total || 0,
                },
                recentBookings,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=admin-dashboard.routes.js.map