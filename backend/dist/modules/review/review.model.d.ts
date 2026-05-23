import { Document, Model, Types } from 'mongoose';
export interface IReview extends Document {
    userId: Types.ObjectId;
    propertyId: Types.ObjectId;
    bookingId: Types.ObjectId;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
    response?: {
        message: string;
        respondedAt: Date;
    };
    isVerified: boolean;
    helpful: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: Model<IReview>;
export default Review;
//# sourceMappingURL=review.model.d.ts.map