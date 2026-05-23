"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = exports.BookingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const inventory_slot_model_1 = require("../inventory/inventory-slot.model");
const booking_model_1 = require("./booking.model");
const hold_model_1 = require("./hold.model");
const lock_service_1 = require("./lock.service");
const socket_1 = require("../../config/socket");
const bull_1 = require("../../config/bull");
const errors_1 = require("../../core/errors");
const logger_1 = require("../../core/utils/logger");
const environment_1 = __importDefault(require("../../config/environment"));
class BookingService {
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
    async createHold(userId, slotIds, guests) {
        // Acquire locks for all requested slots
        const lockIds = new Map();
        try {
            for (const slotId of slotIds) {
                const lockId = await lock_service_1.lockService.acquireLock(slotId);
                if (!lockId) {
                    // Release any locks we already acquired
                    for (const [sid, lid] of lockIds) {
                        await lock_service_1.lockService.releaseLock(sid, lid);
                    }
                    throw new errors_1.ResourceLockedError('One or more slots are being reserved by another user. Please try again.');
                }
                lockIds.set(slotId, lockId);
            }
            // Start MongoDB session for transaction
            const session = await mongoose_1.default.startSession();
            session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
            });
            try {
                // Verify all slots are available
                const slots = await inventory_slot_model_1.InventorySlot.find({
                    _id: { $in: slotIds },
                    status: 'available',
                }).session(session);
                if (slots.length !== slotIds.length) {
                    throw new errors_1.ConflictError('One or more slots are no longer available');
                }
                const holdExpiresAt = new Date(Date.now() + environment_1.default.HOLD_DURATION_MINUTES * 60 * 1000);
                const idempotencyKey = (0, uuid_1.v4)();
                // Calculate pricing
                const totalBase = slots.reduce((sum, s) => sum + s.basePrice, 0);
                const totalDynamic = slots.reduce((sum, s) => sum + (s.dynamicPrice || s.basePrice), 0);
                const taxes = Math.round(totalDynamic * 0.18 * 100) / 100; // 18% GST
                const totalAmount = totalDynamic + taxes;
                const firstSlot = slots[0];
                const lastSlot = slots[slots.length - 1];
                const totalDuration = slots.reduce((sum, s) => sum + s.durationMinutes, 0);
                // Create booking
                const booking = new booking_model_1.Booking({
                    bookingCode: `RST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                    userId,
                    propertyId: firstSlot.propertyId,
                    roomId: firstSlot.roomId,
                    slotIds: slotIds.map((id) => new mongoose_1.default.Types.ObjectId(id)),
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
                await inventory_slot_model_1.InventorySlot.updateMany({ _id: { $in: slotIds } }, {
                    $set: {
                        status: 'held',
                        heldBy: new mongoose_1.default.Types.ObjectId(userId),
                        holdExpiresAt,
                        bookingId: booking._id,
                    },
                    $inc: { version: 1 },
                }, { session });
                // Create hold records
                const holds = slotIds.map((slotId) => ({
                    slotId: new mongoose_1.default.Types.ObjectId(slotId),
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    bookingId: booking._id,
                    status: 'active',
                    lockId: lockIds.get(slotId),
                    expiresAt: holdExpiresAt,
                }));
                await hold_model_1.ReservationHold.insertMany(holds, { session });
                // Commit transaction
                await session.commitTransaction();
                session.endSession();
                // Schedule hold expiration job
                await bull_1.bookingExpirationQueue.add('expire-hold', { bookingId: booking._id.toString(), slotIds }, { delay: environment_1.default.HOLD_DURATION_MINUTES * 60 * 1000, jobId: `hold-${booking._id}` });
                // Broadcast inventory updates
                for (const slot of slots) {
                    await (0, socket_1.broadcastInventoryUpdate)(slot.propertyId.toString(), slot._id.toString(), 'held', { holdExpiresAt: holdExpiresAt.toISOString() });
                }
                logger_1.logger.info({ bookingId: booking._id, userId, slotIds }, 'Hold created successfully');
                return {
                    booking: booking.toJSON(),
                    holdExpiresAt,
                };
            }
            catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        }
        finally {
            // Always release locks
            for (const [slotId, lockId] of lockIds) {
                await lock_service_1.lockService.releaseLock(slotId, lockId);
            }
        }
    }
    /**
     * STEP 2: Confirm booking after payment
     */
    async confirmBooking(bookingId, userId, paymentData) {
        const booking = await booking_model_1.Booking.findOne({ _id: bookingId, userId, status: 'held' });
        if (!booking) {
            throw new errors_1.NotFoundError('Active booking hold');
        }
        // Verify hold hasn't expired
        if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
            throw new errors_1.BadRequestError('Booking hold has expired. Please create a new reservation.');
        }
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Update booking to confirmed
            booking.status = 'confirmed';
            booking.paymentProvider = paymentData.provider;
            booking.externalPaymentId = paymentData.externalPaymentId;
            booking.holdExpiresAt = undefined;
            await booking.save({ session });
            // Update slots to booked
            await inventory_slot_model_1.InventorySlot.updateMany({ _id: { $in: booking.slotIds } }, {
                $set: {
                    status: 'booked',
                    bookedBy: new mongoose_1.default.Types.ObjectId(userId),
                    holdExpiresAt: undefined,
                },
                $inc: { version: 1 },
            }, { session });
            // Update holds to confirmed
            await hold_model_1.ReservationHold.updateMany({ bookingId: booking._id, status: 'active' }, { $set: { status: 'confirmed' } }, { session });
            await session.commitTransaction();
            session.endSession();
            // Remove expiration job
            try {
                const job = await bull_1.bookingExpirationQueue.getJob(`hold-${booking._id}`);
                if (job)
                    await job.remove();
            }
            catch { /* job may have already been processed */ }
            // Broadcast updates
            for (const slotId of booking.slotIds) {
                await (0, socket_1.broadcastInventoryUpdate)(booking.propertyId.toString(), slotId.toString(), 'booked');
            }
            // Queue confirmation notification
            await bull_1.notificationQueue.add('booking-confirmed', {
                userId, bookingId: booking._id.toString(), bookingCode: booking.bookingCode,
            });
            await (0, socket_1.sendUserNotification)(userId, {
                type: 'booking_confirmed',
                title: 'Booking Confirmed!',
                message: `Your booking ${booking.bookingCode} has been confirmed.`,
                data: { bookingId: booking._id },
            });
            logger_1.logger.info({ bookingId: booking._id, userId }, 'Booking confirmed');
            return booking.toJSON();
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
    /**
     * Cancel a booking
     */
    async cancelBooking(bookingId, userId, reason) {
        const booking = await booking_model_1.Booking.findOne({
            _id: bookingId, userId,
            status: { $in: ['held', 'confirmed'] },
        });
        if (!booking)
            throw new errors_1.NotFoundError('Active booking');
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const originalStatus = booking.status;
            booking.status = 'cancelled';
            booking.cancellation = {
                reason,
                cancelledAt: new Date(),
                refundAmount: originalStatus === 'confirmed' ? booking.pricing.totalAmount : 0,
                refundStatus: originalStatus === 'confirmed' ? 'pending' : 'processed',
            };
            await booking.save({ session });
            // Release slots back to available
            await inventory_slot_model_1.InventorySlot.updateMany({ _id: { $in: booking.slotIds } }, {
                $set: { status: 'available', heldBy: undefined, bookedBy: undefined, holdExpiresAt: undefined, bookingId: undefined },
                $inc: { version: 1 },
            }, { session });
            await hold_model_1.ReservationHold.updateMany({ bookingId: booking._id }, { $set: { status: 'released' } }, { session });
            await session.commitTransaction();
            session.endSession();
            // Broadcast slot availability
            for (const slotId of booking.slotIds) {
                await (0, socket_1.broadcastInventoryUpdate)(booking.propertyId.toString(), slotId.toString(), 'available');
            }
            logger_1.logger.info({ bookingId: booking._id, userId }, 'Booking cancelled');
            return booking.toJSON();
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
    /**
     * Get user bookings with pagination
     */
    async getUserBookings(userId, page = 1, limit = 10, status) {
        const filter = { userId };
        if (status)
            filter.status = status;
        const [bookings, total] = await Promise.all([
            booking_model_1.Booking.find(filter)
                .populate('propertyId', 'name type images location')
                .populate('roomId', 'name type')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            booking_model_1.Booking.countDocuments(filter),
        ]);
        return {
            bookings,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }
    /**
     * Get booking by ID
     */
    async getBookingById(bookingId, userId) {
        const booking = await booking_model_1.Booking.findOne({ _id: bookingId, userId })
            .populate('propertyId')
            .populate('roomId')
            .populate('slotIds');
        if (!booking)
            throw new errors_1.NotFoundError('Booking');
        return booking;
    }
}
exports.BookingService = BookingService;
exports.bookingService = new BookingService();
//# sourceMappingURL=booking.service.js.map