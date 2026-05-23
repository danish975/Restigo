import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type BookingStatus =
  | 'pending_hold' | 'held' | 'pending_payment' | 'confirmed'
  | 'checked_in' | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'no_show';

export interface IBooking extends Document {
  bookingCode: string;
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  roomId: Types.ObjectId;
  slotIds: Types.ObjectId[];
  status: BookingStatus;
  checkIn: { date: Date; time: string };
  checkOut: { date: Date; time: string };
  totalDurationMinutes: number;
  pricing: {
    baseAmount: number; dynamicAmount: number; discount: number;
    taxes: number; totalAmount: number; currency: string;
  };
  paymentId?: Types.ObjectId;
  paymentProvider?: 'stripe' | 'razorpay';
  externalPaymentId?: string;
  holdExpiresAt?: Date;
  guests: { adults: number; children: number };
  specialRequests?: string;
  cancellation?: {
    reason: string; cancelledAt: Date;
    refundAmount: number; refundStatus: 'pending' | 'processed' | 'failed';
  };
  idempotencyKey: string;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingCode: { type: String, unique: true, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    slotIds: [{ type: Schema.Types.ObjectId, ref: 'InventorySlot', required: true }],
    status: {
      type: String,
      enum: ['pending_hold','held','pending_payment','confirmed','checked_in','completed','cancelled','refunded','failed','no_show'],
      default: 'pending_hold', index: true,
    },
    checkIn: { date: { type: Date, required: true }, time: { type: String, required: true } },
    checkOut: { date: { type: Date, required: true }, time: { type: String, required: true } },
    totalDurationMinutes: { type: Number, required: true, min: 30 },
    pricing: {
      baseAmount: { type: Number, required: true, min: 0 },
      dynamicAmount: { type: Number, default: 0 },
      discount: { type: Number, default: 0, min: 0 },
      taxes: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentProvider: { type: String, enum: ['stripe', 'razorpay'] },
    externalPaymentId: { type: String },
    holdExpiresAt: { type: Date },
    guests: {
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    specialRequests: { type: String, maxlength: 1000 },
    cancellation: {
      reason: { type: String },
      cancelledAt: { type: Date },
      refundAmount: { type: Number, min: 0 },
      refundStatus: { type: String, enum: ['pending', 'processed', 'failed'] },
    },
    idempotencyKey: { type: String, unique: true, required: true },
    version: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, optimisticConcurrency: true }
);

bookingSchema.index({ userId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ status: 1, holdExpiresAt: 1 });
bookingSchema.index({ idempotencyKey: 1 }, { unique: true });
bookingSchema.index({ externalPaymentId: 1 }, { sparse: true });

bookingSchema.pre('save', function (next) {
  if (!this.bookingCode) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingCode = `RST-${ts}-${rand}`;
  }
  next();
});

export const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;
