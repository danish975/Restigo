import { Document, Model, Types } from 'mongoose';
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
    refund?: {
        amount: number;
        externalId: string;
        reason: string;
        processedAt: Date;
    };
    webhookEvents: Array<{
        event: string;
        receivedAt: Date;
        data: Record<string, unknown>;
    }>;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payment: Model<IPayment>;
export default Payment;
//# sourceMappingURL=payment.model.d.ts.map