import { Document, Model, Types } from 'mongoose';
export type PropertyType = 'hotel' | 'transit_room' | 'coworking' | 'nap_pod' | 'lounge' | 'capsule_hotel' | 'meeting_room' | 'short_stay_apartment';
export interface IProperty extends Document {
    providerId: Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    type: PropertyType;
    images: string[];
    location: {
        type: 'Point';
        coordinates: [number, number];
        address: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
        landmark?: string;
    };
    amenities: string[];
    policies: {
        checkInTime: string;
        checkOutTime: string;
        cancellationPolicy: 'flexible' | 'moderate' | 'strict';
        minBookingHours: number;
        maxBookingHours: number;
        allowPets: boolean;
        smokingAllowed: boolean;
    };
    contact: {
        phone: string;
        email: string;
        website?: string;
    };
    rating: {
        average: number;
        count: number;
    };
    priceRange: {
        min: number;
        max: number;
        currency: string;
    };
    operatingHours: {
        open: string;
        close: string;
        is24Hours: boolean;
        closedDays: number[];
    };
    status: 'pending' | 'active' | 'suspended' | 'archived';
    isVerified: boolean;
    featured: boolean;
    totalRooms: number;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Property: Model<IProperty>;
export default Property;
//# sourceMappingURL=property.model.d.ts.map