import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type SlotStatus = 'available' | 'held' | 'booked' | 'blocked' | 'expired';

export interface IInventorySlot extends Document {
  roomId: Types.ObjectId;
  propertyId: Types.ObjectId;
  date: Date;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  durationMinutes: number;
  status: SlotStatus;
  basePrice: number;
  dynamicPrice?: number;
  currency: string;
  holdExpiresAt?: Date;
  heldBy?: Types.ObjectId;
  bookedBy?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  lockId?: string;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySlotSchema = new Schema<IInventorySlot>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 30,
      max: 1440, // 24 hours
    },
    status: {
      type: String,
      enum: ['available', 'held', 'booked', 'blocked', 'expired'],
      default: 'available',
      index: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0,
    },
    dynamicPrice: {
      type: Number,
      min: 0,
    },
    currency: { type: String, default: 'INR' },
    holdExpiresAt: {
      type: Date,
      index: true,
    },
    heldBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    bookedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    lockId: { type: String },
    version: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Enables __v based optimistic locking
  }
);

// CRITICAL: Unique compound index prevents double-booking at database level
inventorySlotSchema.index(
  { roomId: 1, date: 1, startTime: 1 },
  { unique: true }
);

// TTL index: auto-delete expired hold marker documents
// Note: We don't auto-delete slots, but we use this to find and clean expired holds
inventorySlotSchema.index(
  { holdExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'held' } }
);

// Compound indexes for search queries
inventorySlotSchema.index({ propertyId: 1, date: 1, status: 1 });
inventorySlotSchema.index({ roomId: 1, date: 1, status: 1, startTime: 1 });
inventorySlotSchema.index({ status: 1, date: 1 });
inventorySlotSchema.index({ bookedBy: 1, status: 1 });

// Get effective price (dynamic or base)
inventorySlotSchema.virtual('effectivePrice').get(function () {
  return this.dynamicPrice ?? this.basePrice;
});

export const InventorySlot: Model<IInventorySlot> = mongoose.model<IInventorySlot>(
  'InventorySlot',
  inventorySlotSchema
);
export default InventorySlot;
