import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: 'stripe' | 'razorpay';
  externalId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
  method?: string;
  idempotencyKey: string;
  refund?: { amount: number; externalId: string; reason: string; processedAt: Date };
  webhookEvents: Array<{ event: string; receivedAt: Date; data: Record<string, unknown> }>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['stripe', 'razorpay'], required: true },
    externalId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending', index: true,
    },
    method: { type: String },
    idempotencyKey: { type: String, unique: true, required: true },
    refund: {
      amount: { type: Number, min: 0 },
      externalId: { type: String },
      reason: { type: String },
      processedAt: { type: Date },
    },
    webhookEvents: [{
      event: { type: String },
      receivedAt: { type: Date, default: Date.now },
      data: { type: Schema.Types.Mixed },
    }],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ idempotencyKey: 1 }, { unique: true });
paymentSchema.index({ externalId: 1 });
paymentSchema.index({ userId: 1, status: 1 });

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
