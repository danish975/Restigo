import { Document, Model, Types } from 'mongoose';
export type BookingStatus = 'pending_hold' | 'held' | 'pending_payment' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'no_show';
export interface IBooking extends Document {
    bookingCode: string;
    userId: Types.ObjectId;
    propertyId: Types.ObjectId;
    roomId: Types.ObjectId;
    slotIds: Types.ObjectId[];
    status: BookingStatus;
    checkIn: {
        date: Date;
        time: string;
    };
    checkOut: {
        date: Date;
        time: string;
    };
    totalDurationMinutes: number;
    pricing: {
        baseAmount: number;
        dynamicAmount: number;
        discount: number;
        taxes: number;
        totalAmount: number;
        currency: string;
    };
    paymentId?: Types.ObjectId;
    paymentProvider?: 'stripe' | 'razorpay';
    externalPaymentId?: string;
    holdExpiresAt?: Date;
    guests: {
        adults: number;
        children: number;
    };
    specialRequests?: string;
    cancellation?: {
        reason: string;
        cancelledAt: Date;
        refundAmount: number;
        refundStatus: 'pending' | 'processed' | 'failed';
    };
    idempotencyKey: string;
    version: number;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Booking: Model<IBooking>;
export default Booking;
//# sourceMappingURL=booking.model.d.ts.map