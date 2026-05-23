import { Document, Model, Types } from 'mongoose';
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
export declare const Notification: Model<INotification>;
export default Notification;
//# sourceMappingURL=notification.model.d.ts.map