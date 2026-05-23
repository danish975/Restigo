import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'booking_confirmed' | 'booking_cancelled' | 'payment_received' | 'hold_expiring' | 'review_request' | 'system' | 'promotion';
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'sms' | 'push';
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['booking_confirmed', 'booking_cancelled', 'payment_received', 'hold_expiring', 'review_request', 'system', 'promotion'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ['in_app', 'email', 'sms', 'push'], default: 'in_app' },
    read: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
