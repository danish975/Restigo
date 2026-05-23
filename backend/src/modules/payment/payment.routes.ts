import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../core/middleware/auth';
import { validate } from '../../core/middleware/validate';
import { Booking } from '../booking/booking.model';
import { Payment } from './payment.model';
import { bookingService } from '../booking/booking.service';
import { NotFoundError, BadRequestError } from '../../core/errors';
import { logger } from '../../core/utils/logger';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Payment Provider Abstraction
 * Supports both Stripe and Razorpay through a unified interface.
 */

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

// Abstract payment provider — easily swap implementations
const createPaymentIntent = async (
  provider: 'stripe' | 'razorpay',
  amount: number,
  currency: string,
  metadata: Record<string, string>
): Promise<PaymentIntent> => {
  // In production, integrate with actual SDK:
  // - Stripe: stripe.paymentIntents.create(...)
  // - Razorpay: razorpay.orders.create(...)
  //
  // For now, return mock intent for development
  const id = `${provider}_pi_${uuidv4().replace(/-/g, '').substring(0, 24)}`;
  return {
    id,
    clientSecret: `${id}_secret_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
    amount,
    currency,
    status: 'requires_payment_method',
  };
};

const createPaymentDto = z.object({
  bookingId: z.string(),
  provider: z.enum(['stripe', 'razorpay']),
});

// POST /payments/create-intent — Create payment intent for a held booking
router.post('/create-intent', authenticate, validate(createPaymentDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, provider } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, userId: req.user!.userId, status: 'held' });
    if (!booking) throw new NotFoundError('Active booking hold');

    if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
      throw new BadRequestError('Booking hold has expired');
    }

    const idempotencyKey = `pay_${bookingId}_${Date.now()}`;

    // Check for existing payment
    const existingPayment = await Payment.findOne({ bookingId, status: { $in: ['pending', 'processing'] } });
    if (existingPayment) {
      res.status(StatusCodes.OK).json({
        success: true,
        data: { paymentId: existingPayment._id, clientSecret: existingPayment.metadata?.clientSecret },
      });
      return;
    }

    const intent = await createPaymentIntent(
      provider,
      Math.round(booking.pricing.totalAmount * 100), // amount in smallest currency unit
      booking.pricing.currency,
      { bookingId: bookingId, userId: req.user!.userId, bookingCode: booking.bookingCode }
    );

    const payment = await Payment.create({
      bookingId,
      userId: req.user!.userId,
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

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { paymentId: payment._id, clientSecret: intent.clientSecret, externalId: intent.id },
    });
  } catch (error) { next(error); }
});

// POST /payments/webhook/stripe — Stripe webhook handler
router.post('/webhook/stripe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production: verify webhook signature with stripe.webhooks.constructEvent
    const event = req.body;
    logger.info({ type: event.type }, 'Stripe webhook received');

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntentId = event.data?.object?.id;
      const payment = await Payment.findOne({ externalId: paymentIntentId });
      if (payment && payment.status !== 'succeeded') {
        payment.status = 'succeeded';
        payment.webhookEvents.push({ event: event.type, receivedAt: new Date(), data: event.data?.object });
        await payment.save();

        // Confirm the booking
        const booking = await Booking.findById(payment.bookingId);
        if (booking && booking.status !== 'confirmed') {
          await bookingService.confirmBooking(
            booking._id.toString(),
            payment.userId.toString(),
            { provider: 'stripe', externalPaymentId: paymentIntentId }
          );
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntentId = event.data?.object?.id;
      const payment = await Payment.findOne({ externalId: paymentIntentId });
      if (payment) {
        payment.status = 'failed';
        payment.webhookEvents.push({ event: event.type, receivedAt: new Date(), data: event.data?.object });
        await payment.save();
      }
    }

    res.status(200).json({ received: true });
  } catch (error) { next(error); }
});

// POST /payments/webhook/razorpay — Razorpay webhook handler
router.post('/webhook/razorpay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.body;
    logger.info({ event: event.event }, 'Razorpay webhook received');

    if (event.event === 'payment.captured') {
      const paymentId = event.payload?.payment?.entity?.id;
      const payment = await Payment.findOne({ externalId: paymentId });
      if (payment && payment.status !== 'succeeded') {
        payment.status = 'succeeded';
        payment.webhookEvents.push({ event: event.event, receivedAt: new Date(), data: event.payload });
        await payment.save();

        const booking = await Booking.findById(payment.bookingId);
        if (booking && booking.status !== 'confirmed') {
          await bookingService.confirmBooking(
            booking._id.toString(),
            payment.userId.toString(),
            { provider: 'razorpay', externalPaymentId: paymentId }
          );
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) { next(error); }
});

// POST /payments/simulate-success — DEV ONLY: simulate payment success
if (process.env.NODE_ENV !== 'production') {
  router.post('/simulate-success', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.body;
      const payment = await Payment.findOne({ bookingId, status: { $in: ['pending', 'processing'] } });
      if (!payment) throw new NotFoundError('Pending payment');

      payment.status = 'succeeded';
      await payment.save();

      const booking = await bookingService.confirmBooking(
        bookingId, req.user!.userId,
        { provider: payment.provider, externalPaymentId: payment.externalId }
      );

      res.status(StatusCodes.OK).json({ success: true, data: { booking, payment } });
    } catch (error) { next(error); }
  });
}

export default router;
