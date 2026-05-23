import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type RoomType =
  | 'standard'
  | 'deluxe'
  | 'suite'
  | 'pod'
  | 'capsule'
  | 'desk'
  | 'meeting_room'
  | 'private_office'
  | 'lounge_seat';

export interface IRoom extends Document {
  propertyId: Types.ObjectId;
  name: string;
  type: RoomType;
  description: string;
  images: string[];
  floor: number;
  roomNumber: string;
  capacity: {
    adults: number;
    children: number;
  };
  basePrice: number;
  currency: string;
  amenities: string[];
  size: {
    value: number;
    unit: 'sqft' | 'sqm';
  };
  bedConfiguration?: string;
  status: 'available' | 'maintenance' | 'archived';
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      required: true,
      enum: ['standard', 'deluxe', 'suite', 'pod', 'capsule', 'desk', 'meeting_room', 'private_office', 'lounge_seat'],
      index: true,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    images: {
      type: [String],
      validate: [(val: string[]) => val.length <= 10, 'Maximum 10 images per room'],
    },
    floor: { type: Number, default: 1 },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      adults: { type: Number, required: true, min: 1, default: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: { type: String, default: 'INR' },
    amenities: {
      type: [String],
      default: [],
    },
    size: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' },
    },
    bedConfiguration: { type: String },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'archived'],
      default: 'available',
      index: true,
    },
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
roomSchema.index({ propertyId: 1, status: 1, type: 1 });
roomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ basePrice: 1, type: 1 });

// Virtual: inventory slots
roomSchema.virtual('slots', {
  ref: 'InventorySlot',
  localField: '_id',
  foreignField: 'roomId',
});

export const Room: Model<IRoom> = mongoose.model<IRoom>('Room', roomSchema);
export default Room;
