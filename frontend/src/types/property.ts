import { BaseEntity } from './api';

export type PropertyType = 'hotel' | 'transit_room' | 'coworking' | 'nap_pod' | 'lounge' | 'capsule_hotel' | 'meeting_room';

export interface Property extends BaseEntity {
  providerId: string;
  name: string;
  description: string;
  type: PropertyType;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  amenities: string[];
  images: string[];
  rating: {
    average: number;
    count: number;
  };
  isActive: boolean;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface Room extends BaseEntity {
  propertyId: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  basePricePerHour: number;
  amenities: string[];
  images: string[];
  status: 'active' | 'maintenance' | 'inactive';
}
