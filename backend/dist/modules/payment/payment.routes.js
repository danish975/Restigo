"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../core/middleware/auth");
const validate_1 = require("../../core/middleware/validate");
const booking_model_1 = require("../booking/booking.model");
const payment_model_1 = require("./payment.model");
const booking_service_1 = require("../booking/booking.service");
const errors_1 = require("../../core/errors");
const logger_1 = require("../../core/utils/logger");
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// Abstract payment provider — easily swap implementations
const createPaymentIntent = async (provider, amount, currency, metadata) => {
    // In production, integrate with actual SDK:
    // - Stripe: stripe.paymentIntents.create(...)
    // - Razorpay: razorpay.orders.create(...)
    //
    // For now, return mock intent for development
    const id = `${provider}_pi_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 24)}`;
    return {
        id,
        clientSecret: `${id}_secret_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 16)}`,
        amount,
        currency,
        status: 'requires_payment_method',
    };
};
const createPaymentDto = zod_1.z.object({
    bookingId: zod_1.z.string(),
    provider: zod_1.z.enum(['stripe', 'razorpay']),
});
// POST /payments/create-intent — Create payment intent for a held booking
router.post('/create-intent', auth_1.authenticate, (0, validate_1.validate)(createPaymentDto), async (req, res, next) => {
    try {
        const { bookingId, provider } = req.body;
        const booking = await booking_model_1.Booking.findOne({ _id: bookingId, userId: req.user.userId, status: 'held' });
        if (!booking)
            throw new errors_1.NotFoundError('Active booking hold');
        if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
            throw new errors_1.BadRequestError('Booking hold has expired');
        }
        const idempotencyKey = `pay_${bookingId}_${Date.now()}`;
        // Check for existing payment
        const existingPayment = await payment_model_1.Payment.findOne({ bookingId, status: { $in: ['pending', 'processing'] } });
        if (existingPayment) {
            res.status(http_status_codes_1.StatusCodes.OK).json({
                success: true,
                data: { paymentId: existingPayment._id, clientSecret: existingPayment.metadata?.clientSecret },
            });
            return;
        }
        const intent = await createPaymentIntent(provider, Math.round(booking.pricing.totalAmount * 100), // amount in smallest currency unit
        booking.pricing.currency, { bookingId: bookingId, userId: req.user.userId, bookingCode: booking.bookingCode });
        const payment = await payment_model_1.Payment.create({
            bookingId,
            userId: req.user.userId,
            provider,
            externalId: intent.id,
            amount: booking.pricing.totalAmount,
            currency: booking.pricing.currency,
            status: 'pending',
            idempotencyKey,
            metadata: { clientSecret: intent.clientSecret },
        });
        // Update booking status
        booking.status = 'pending_payment';
        booking.paymentProvider = provider;
        await booking.save();
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: { paymentId: payment._id, clientSecret: intent.clientSecret, externalId: intent.id },
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /payments/webhook/stripe — Stripe webhook handler
router.post('/webhook/stripe', async (req, res, next) => {
    try {
        // In production: verify webhook signature with stripe.webhooks.constructEvent
        const event = req.body;
        logger_1.logger.info({ type: event.type }, 'Stripe webhook received');
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntentId = event.data?.object?.id;
            const payment = await payment_model_1.Payment.findOne({ externalId: paymentIntentId });
            if (payment && payment.status !== 'succeeded') {
                payment.status = 'succeeded';
                payment.webhookEvents.push({ event: event.type, receivedAt: new Date(), data: event.data?.object });
                await payment.save();
                // Confirm the booking
                const booking = await booking_model_1.Booking.findById(payment.bookingId);
                if (booking && booking.status !== 'confirmed') {
                    await booking_service_1.bookingService.confirmBooking(booking._id.toString(), payment.userId.toString(), { provider: 'stripe', externalPaymentId: paymentIntentId });
                }
            }
        }
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntentId = event.data?.object?.id;
            const payment = await payment_model_1.Payment.findOne({ externalId: paymentIntentId });
            if (payment) {
                payment.status = 'failed';
                payment.webhookEvents.push({ event: event.type, receivedAt: new Date(), data: event.data?.object });
                await payment.save();
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        next(error);
    }
});
// POST /payments/webhook/razorpay — Razorpay webhook handler
router.post('/webhook/razorpay', async (req, res, next) => {
    try {
        const event = req.body;
        logger_1.logger.info({ event: event.event }, 'Razorpay webhook received');
        if (event.event === 'payment.captured') {
            const paymentId = event.payload?.payment?.entity?.id;
            const payment = await payment_model_1.Payment.findOne({ externalId: paymentId });
            if (payment && payment.status !== 'succeeded') {
                payment.status = 'succeeded';
                payment.webhookEvents.push({ event: event.event, receivedAt: new Date(), data: event.payload });
                await payment.save();
                const booking = await booking_model_1.Booking.findById(payment.bookingId);
                if (booking && booking.status !== 'confirmed') {
                    await booking_service_1.bookingService.confirmBooking(booking._id.toString(), payment.userId.toString(), { provider: 'razorpay', externalPaymentId: paymentId });
                }
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        next(error);
    }
});
// POST /payments/simulate-success — DEV ONLY: simulate payment success
if (process.env.NODE_ENV !== 'production') {
    router.post('/simulate-success', auth_1.authenticate, async (req, res, next) => {
        try {
            const { bookingId } = req.body;
            const payment = await payment_model_1.Payment.findOne({ bookingId, status: { $in: ['pending', 'processing'] } });
            if (!payment)
                throw new errors_1.NotFoundError('Pending payment');
            payment.status = 'succeeded';
            await payment.save();
            const booking = await booking_service_1.bookingService.confirmBooking(bookingId, req.user.userId, { provider: payment.provider, externalPaymentId: payment.externalId });
            res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { booking, payment } });
        }
        catch (error) {
            next(error);
        }
    });
}
exports.default = router;
//# sourceMappingURL=payment.routes.js.map