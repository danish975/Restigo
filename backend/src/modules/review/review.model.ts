import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReview extends Document {
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  bookingId: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  response?: { message: string; respondedAt: Date };
  isVerified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 200 },
    comment: { type: String, required: true, maxlength: 2000 },
    images: { type: [String], default: [] },
    response: {
      message: { type: String },
      respondedAt: { type: Date },
    },
    isVerified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
reviewSchema.index({ propertyId: 1, rating: -1 });

export const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);
export default Review;
