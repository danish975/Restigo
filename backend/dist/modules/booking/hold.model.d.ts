import { Document, Model, Types } from 'mongoose';
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
export declare const ReservationHold: Model<IReservationHold>;
export default ReservationHold;
//# sourceMappingURL=hold.model.d.ts.map