import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { InventorySlot } from '../inventory/inventory-slot.model';
import { Booking } from './booking.model';
import { ReservationHold } from './hold.model';
import { lockService } from './lock.service';
import { broadcastInventoryUpdate, sendUserNotification } from '../../config/socket';
import { bookingExpirationQueue, notificationQueue } from '../../config/bull';
import { BadRequestError, ResourceLockedError, NotFoundError, ConflictError } from '../../core/errors';
import { logger } from '../../core/utils/logger';
import env from '../../config/environment';

export class BookingService {
  /**
   * STEP 1: Create a temporary hold on slot(s)
   * 
   * Flow:
   * 1. Acquire Redis distributed lock (prevents concurrent access)
   * 2. Start MongoDB transaction
   * 3. Verify slot is AVAILABLE
   * 4. Update slot to HELD
   * 5. Create ReservationHold document
   * 6. Create Booking in pending_hold status
   * 7. Commit transaction
   * 8. Schedule expiration job
   * 9. Broadcast inventory update
   * 10. Release lock
   */
  async createHold(
    userId: string,
    slotIds: string[],
    guests: { adults: number; children: number }
  ): Promise<{ booking: any; holdExpiresAt: Date }> {
    // Acquire locks for all requested slots
    const lockIds: Map<string, string> = new Map();

    try {
      for (const slotId of slotIds) {
        const lockId = await lockService.acquireLock(slotId);
        if (!lockId) {
          // Release any locks we already acquired
          for (const [sid, lid] of lockIds) {
            await lockService.releaseLock(sid, lid);
          }
          throw new ResourceLockedError('One or more slots are being reserved by another user. Please try again.');
        }
        lockIds.set(slotId, lockId);
      }

      // Start MongoDB session for transaction
      const session = await mongoose.startSession();
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      try {
        // Verify all slots are available
        const slots = await InventorySlot.find({
          _id: { $in: slotIds },
          status: 'available',
        }).session(session);

        if (slots.length !== slotIds.length) {
          throw new ConflictError('One or more slots are no longer available');
        }

        const holdExpiresAt = new Date(Date.now() + env.HOLD_DURATION_MINUTES * 60 * 1000);
        const idempotencyKey = uuidv4();

        // Calculate pricing
        const totalBase = slots.reduce((sum, s) => sum + s.basePrice, 0);
        const totalDynamic = slots.reduce((sum, s) => sum + (s.dynamicPrice || s.basePrice), 0);
        const taxes = Math.round(totalDynamic * 0.18 * 100) / 100; // 18% GST
        const totalAmount = totalDynamic + taxes;

        const firstSlot = slots[0];
        const lastSlot = slots[slots.length - 1];
        const totalDuration = slots.reduce((sum, s) => sum + s.durationMinutes, 0);

        // Create booking
        const booking = new Booking({
          bookingCode: `RST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          userId,
          propertyId: firstSlot.propertyId,
          roomId: firstSlot.roomId,
          slotIds: slotIds.map((id) => new mongoose.Types.ObjectId(id)),
          status: 'held',
          checkIn: { date: firstSlot.date, time: firstSlot.startTime },
          checkOut: { date: lastSlot.date, time: lastSlot.endTime },
          totalDurationMinutes: totalDuration,
          pricing: {
            baseAmount: totalBase,
            dynamicAmount: totalDynamic - totalBase,
            discount: 0,
            taxes,
            totalAmount,
            currency: firstSlot.currency,
          },
          holdExpiresAt,
          guests,
          idempotencyKey,
        });

        await booking.save({ session });

        // Update all slots to HELD
        await InventorySlot.updateMany(
          { _id: { $in: slotIds } },
          {
            $set: {
              status: 'held',
              heldBy: new mongoose.Types.ObjectId(userId),
              holdExpiresAt,
              bookingId: booking._id,
            },
            $inc: { version: 1 },
          },
          { session }
        );

        // Create hold records
        const holds = slotIds.map((slotId) => ({
          slotId: new mongoose.Types.ObjectId(slotId),
          userId: new mongoose.Types.ObjectId(userId),
          bookingId: booking._id,
          status: 'active' as const,
          lockId: lockIds.get(slotId)!,
          expiresAt: holdExpiresAt,
        }));

        await ReservationHold.insertMany(holds, { session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Schedule hold expiration job
        await bookingExpirationQueue.add(
          'expire-hold',
          { bookingId: booking._id.toString(), slotIds },
          { delay: env.HOLD_DURATION_MINUTES * 60 * 1000, jobId: `hold-${booking._id}` }
        );

        // Broadcast inventory updates
        for (const slot of slots) {
          await broadcastInventoryUpdate(
            slot.propertyId.toString(),
            slot._id.toString(),
            'held',
            { holdExpiresAt: holdExpiresAt.toISOString() }
          );
        }

        logger.info({ bookingId: booking._id, userId, slotIds }, 'Hold created successfully');

        return {
          booking: booking.toJSON(),
          holdExpiresAt,
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } finally {
      // Always release locks
      for (const [slotId, lockId] of lockIds) {
        await lockService.releaseLock(slotId, lockId);
      }
    }
  }

  /**
   * STEP 2: Confirm booking after payment
   */
  async confirmBooking(
    bookingId: string,
    userId: string,
    paymentData: { provider: 'stripe' | 'razorpay'; externalPaymentId: string }
  ): Promise<any> {
    const booking = await Booking.findOne({ _id: bookingId, userId, status: 'held' });
    if (!booking) {
      throw new NotFoundError('Active booking hold');
    }

    // Verify hold hasn't expired
    if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
      throw new BadRequestError('Booking hold has expired. Please create a new reservation.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update booking to confirmed
      booking.status = 'confirmed';
      booking.paymentProvider = paymentData.provider;
      booking.externalPaymentId = paymentData.externalPaymentId;
      booking.holdExpiresAt = undefined;
      await booking.save({ session });

      // Update slots to booked
      await InventorySlot.updateMany(
        { _id: { $in: booking.slotIds } },
        {
          $set: {
            status: 'booked',
            bookedBy: new mongoose.Types.ObjectId(userId),
            holdExpiresAt: undefined,
          },
          $inc: { version: 1 },
        },
        { session }
      );

      // Update holds to confirmed
      await ReservationHold.updateMany(
        { bookingId: booking._id, status: 'active' },
        { $set: { status: 'confirmed' } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Remove expiration job
      try {
        const job = await bookingExpirationQueue.getJob(`hold-${booking._id}`);
        if (job) await job.remove();
      } catch { /* job may have already been processed */ }

      // Broadcast updates
      for (const slotId of booking.slotIds) {
        await broadcastInventoryUpdate(
          booking.propertyId.toString(),
          slotId.toString(),
          'booked'
        );
      }

      // Queue confirmation notification
      await notificationQueue.add('booking-confirmed', {
        userId, bookingId: booking._id.toString(), bookingCode: booking.bookingCode,
      });

      await sendUserNotification(userId, {
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        message: `Your booking ${booking.bookingCode} has been confirmed.`,
        data: { bookingId: booking._id },
      });

      logger.info({ bookingId: booking._id, userId }, 'Booking confirmed');
      return booking.toJSON();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, userId: string, reason: string): Promise<any> {
    const booking = await Booking.findOne({
      _id: bookingId, userId,
      status: { $in: ['held', 'confirmed'] },
    });
    if (!booking) throw new NotFoundError('Active booking');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const originalStatus = booking.status;
      booking.status = 'cancelled';
      booking.cancellation = {
        reason,
        cancelledAt: new Date(),
        refundAmount: originalStatus === 'confirmed' ? booking.pricing.totalAmount : 0,
        refundStatus: originalStatus === 'confirmed' ? 'pending' : ('processed' as any),
      };
      await booking.save({ session });

      // Release slots back to available
      await InventorySlot.updateMany(
        { _id: { $in: booking.slotIds } },
        {
          $set: { status: 'available', heldBy: undefined, bookedBy: undefined, holdExpiresAt: undefined, bookingId: undefined },
          $inc: { version: 1 },
        },
        { session }
      );

      await ReservationHold.updateMany(
        { bookingId: booking._id },
        { $set: { status: 'released' } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Broadcast slot availability
      for (const slotId of booking.slotIds) {
        await broadcastInventoryUpdate(booking.propertyId.toString(), slotId.toString(), 'available');
      }

      logger.info({ bookingId: booking._id, userId }, 'Booking cancelled');
      return booking.toJSON();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get user bookings with pagination
   */
  async getUserBookings(userId: string, page: number = 1, limit: number = 10, status?: string) {
    const filter: any = { userId };
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('propertyId', 'name type images location')
        .populate('roomId', 'name type')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string, userId: string) {
    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate('propertyId')
      .populate('roomId')
      .populate('slotIds');
    if (!booking) throw new NotFoundError('Booking');
    return booking;
  }
}

export const bookingService = new BookingService();
