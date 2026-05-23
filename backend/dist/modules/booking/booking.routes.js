"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const booking_service_1 = require("./booking.service");
const auth_1 = require("../../core/middleware/auth");
const validate_1 = require("../../core/middleware/validate");
const http_status_codes_1 = require("http-status-codes");
const router = (0, express_1.Router)();
const createHoldDto = zod_1.z.object({
    slotIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one slot required'),
    guests: zod_1.z.object({
        adults: zod_1.z.number().int().min(1).default(1),
        children: zod_1.z.number().int().min(0).default(0),
    }).default({ adults: 1, children: 0 }),
});
const confirmBookingDto = zod_1.z.object({
    provider: zod_1.z.enum(['stripe', 'razorpay']),
    externalPaymentId: zod_1.z.string().min(1),
});
const cancelBookingDto = zod_1.z.object({
    reason: zod_1.z.string().min(1).max(500),
});
// POST /bookings/hold — Create temporary reservation hold
router.post('/hold', auth_1.authenticate, (0, validate_1.validate)(createHoldDto), async (req, res, next) => {
    try {
        const result = await booking_service_1.bookingService.createHold(req.user.userId, req.body.slotIds, req.body.guests);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
// POST /bookings/:id/confirm — Confirm booking after payment
router.post('/:id/confirm', auth_1.authenticate, (0, validate_1.validate)(confirmBookingDto), async (req, res, next) => {
    try {
        const booking = await booking_service_1.bookingService.confirmBooking(req.params.id, req.user.userId, req.body);
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { booking } });
    }
    catch (error) {
        next(error);
    }
});
// POST /bookings/:id/cancel — Cancel booking
router.post('/:id/cancel', auth_1.authenticate, (0, validate_1.validate)(cancelBookingDto), async (req, res, next) => {
    try {
        const booking = await booking_service_1.bookingService.cancelBooking(req.params.id, req.user.userId, req.body.reason);
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { booking } });
    }
    catch (error) {
        next(error);
    }
});
// GET /bookings — Get user's bookings
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const result = await booking_service_1.bookingService.getUserBookings(req.user.userId, page, limit, status);
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
// GET /bookings/:id — Get booking details
router.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const booking = await booking_service_1.bookingService.getBookingById(req.params.id, req.user.userId);
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { booking } });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=booking.routes.js.map