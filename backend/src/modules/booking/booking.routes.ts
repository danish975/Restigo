import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService } from './booking.service';
import { authenticate } from '../../core/middleware/auth';
import { validate } from '../../core/middleware/validate';
import { StatusCodes } from 'http-status-codes';

const router = Router();

const createHoldDto = z.object({
  slotIds: z.array(z.string()).min(1, 'At least one slot required'),
  guests: z.object({
    adults: z.number().int().min(1).default(1),
    children: z.number().int().min(0).default(0),
  }).default({ adults: 1, children: 0 }),
});

const confirmBookingDto = z.object({
  provider: z.enum(['stripe', 'razorpay']),
  externalPaymentId: z.string().min(1),
});

const cancelBookingDto = z.object({
  reason: z.string().min(1).max(500),
});

// POST /bookings/hold — Create temporary reservation hold
router.post('/hold', authenticate, validate(createHoldDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await bookingService.createHold(req.user!.userId, req.body.slotIds, req.body.guests);
    res.status(StatusCodes.CREATED).json({ success: true, data: result });
  } catch (error) { next(error); }
});

// POST /bookings/:id/confirm — Confirm booking after payment
router.post('/:id/confirm', authenticate, validate(confirmBookingDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.confirmBooking(req.params.id as string, req.user!.userId, req.body);
    res.status(StatusCodes.OK).json({ success: true, data: { booking } });
  } catch (error) { next(error); }
});

// POST /bookings/:id/cancel — Cancel booking
router.post('/:id/cancel', authenticate, validate(cancelBookingDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id as string, req.user!.userId, req.body.reason);
    res.status(StatusCodes.OK).json({ success: true, data: { booking } });
  } catch (error) { next(error); }
});

// GET /bookings — Get user's bookings
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const result = await bookingService.getUserBookings(req.user!.userId, page, limit, status);
    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) { next(error); }
});

// GET /bookings/:id — Get booking details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id as string, req.user!.userId);
    res.status(StatusCodes.OK).json({ success: true, data: { booking } });
  } catch (error) { next(error); }
});

export default router;
