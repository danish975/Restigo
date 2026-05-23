import { Document, Model, Types } from 'mongoose';
export type SlotStatus = 'available' | 'held' | 'booked' | 'blocked' | 'expired';
export interface IInventorySlot extends Document {
    roomId: Types.ObjectId;
    propertyId: Types.ObjectId;
    date: Date;
    startTime: string;
    endTime: string;
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
export declare const InventorySlot: Model<IInventorySlot>;
export default InventorySlot;
//# sourceMappingURL=inventory-slot.model.d.ts.map