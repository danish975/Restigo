import { Document, Model, Types } from 'mongoose';
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'pod' | 'capsule' | 'desk' | 'meeting_room' | 'private_office' | 'lounge_seat';
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
export declare const Room: Model<IRoom>;
export default Room;
//# sourceMappingURL=room.model.d.ts.map