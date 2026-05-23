import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReservationHold extends Document {
  slotId: Types.ObjectId;
  userId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  status: 'active' | 'confirmed' | 'expired' | 'released';
  lockId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reservationHoldSchema = new Schema<IReservationHold>(
  {
    slotId: { type: Schema.Types.ObjectId, ref: 'InventorySlot', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    status: {
      type: String,
      enum: ['active', 'confirmed', 'expired', 'released'],
      default: 'active', index: true,
    },
    lockId: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL index: auto-delete expired holds
reservationHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
reservationHoldSchema.index({ slotId: 1, status: 1 });

export const ReservationHold: Model<IReservationHold> = mongoose.model<IReservationHold>('ReservationHold', reservationHoldSchema);
export default ReservationHold;
