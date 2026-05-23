import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { InventorySlot } from '../../modules/inventory/inventory-slot.model';
import { Booking } from '../../modules/booking/booking.model';
import { ReservationHold } from '../../modules/booking/hold.model';
import { broadcastInventoryUpdate, sendUserNotification } from '../../config/socket';
import { logger } from '../../core/utils/logger';
import env from '../../config/environment';

const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

export const bookingExpirationWorker = new Worker(
  'booking-expiration',
  async (job: Job) => {
    const { bookingId, slotIds } = job.data;
    logger.info({ bookingId }, 'Processing hold expiration');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId).session(session);
      
      // If booking is not held anymore (confirmed or cancelled), we don't need to expire
      if (!booking || booking.status !== 'held') {
        await session.abortTransaction();
        session.endSession();
        return { status: 'skipped', reason: 'booking_not_held' };
      }

      // Expire the hold
      booking.status = 'failed';
      await booking.save({ session });

      await InventorySlot.updateMany(
        { _id: { $in: slotIds }, status: 'held' },
        { 
          $set: { status: 'available', holdExpiresAt: undefined, heldBy: undefined, bookingId: undefined },
          $inc: { version: 1 }
        },
        { session }
      );

      await ReservationHold.updateMany(
        { bookingId, status: 'active' },
        { $set: { status: 'expired' } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Broadcast slot availability
      for (const slotId of slotIds) {
        await broadcastInventoryUpdate(booking.propertyId.toString(), slotId.toString(), 'available');
      }

      // Notify user
      await sendUserNotification(booking.userId.toString(), {
        type: 'hold_expiring',
        title: 'Booking Hold Expired',
        message: 'Your temporary reservation hold has expired.',
      });

      return { status: 'expired' };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error({ error, bookingId }, 'Failed to process hold expiration');
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 10 }
);

bookingExpirationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Booking expiration job failed');
});
