"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingExpirationWorker = void 0;
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const inventory_slot_model_1 = require("../../modules/inventory/inventory-slot.model");
const booking_model_1 = require("../../modules/booking/booking.model");
const hold_model_1 = require("../../modules/booking/hold.model");
const socket_1 = require("../../config/socket");
const logger_1 = require("../../core/utils/logger");
const environment_1 = __importDefault(require("../../config/environment"));
const redisConnection = {
    host: environment_1.default.REDIS_HOST,
    port: environment_1.default.REDIS_PORT,
    password: environment_1.default.REDIS_PASSWORD || undefined,
};
exports.bookingExpirationWorker = new bullmq_1.Worker('booking-expiration', async (job) => {
    const { bookingId, slotIds } = job.data;
    logger_1.logger.info({ bookingId }, 'Processing hold expiration');
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const booking = await booking_model_1.Booking.findById(bookingId).session(session);
        // If booking is not held anymore (confirmed or cancelled), we don't need to expire
        if (!booking || booking.status !== 'held') {
            await session.abortTransaction();
            session.endSession();
            return { status: 'skipped', reason: 'booking_not_held' };
        }
        // Expire the hold
        booking.status = 'failed';
        await booking.save({ session });
        await inventory_slot_model_1.InventorySlot.updateMany({ _id: { $in: slotIds }, status: 'held' }, {
            $set: { status: 'available', holdExpiresAt: undefined, heldBy: undefined, bookingId: undefined },
            $inc: { version: 1 }
        }, { session });
        await hold_model_1.ReservationHold.updateMany({ bookingId, status: 'active' }, { $set: { status: 'expired' } }, { session });
        await session.commitTransaction();
        session.endSession();
        // Broadcast slot availability
        for (const slotId of slotIds) {
            await (0, socket_1.broadcastInventoryUpdate)(booking.propertyId.toString(), slotId.toString(), 'available');
        }
        // Notify user
        await (0, socket_1.sendUserNotification)(booking.userId.toString(), {
            type: 'hold_expiring',
            title: 'Booking Hold Expired',
            message: 'Your temporary reservation hold has expired.',
        });
        return { status: 'expired' };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger_1.logger.error({ error, bookingId }, 'Failed to process hold expiration');
        throw error;
    }
}, { connection: redisConnection, concurrency: 10 });
exports.bookingExpirationWorker.on('failed', (job, err) => {
    logger_1.logger.error({ jobId: job?.id, error: err }, 'Booking expiration job failed');
});
//# sourceMappingURL=booking-expiration.worker.js.map