import { BaseEntity } from './api';

export type SlotStatus = 'available' | 'held' | 'booked' | 'blocked' | 'expired';
export type BookingStatus = 'pending_hold' | 'held' | 'pending_payment' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'no_show';

export interface InventorySlot extends BaseEntity {
  roomId: string;
  propertyId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SlotStatus;
  basePrice: number;
  dynamicPrice?: number;
  currency: string;
  holdExpiresAt?: string;
}

export interface Booking extends BaseEntity {
  bookingCode: string;
  userId: string;
  propertyId: any; // Can be string or populated Property
  roomId: any; // Can be string or populated Room
  slotIds: string[];
  status: BookingStatus;
  checkIn: {
    date: string;
    time: string;
  };
  checkOut: {
    date: string;
    time: string;
  };
  totalDurationMinutes: number;
  pricing: {
    baseAmount: number;
    dynamicAmount: number;
    discount: number;
    taxes: number;
    totalAmount: number;
    currency: string;
  };
  guests: {
    adults: number;
    children: number;
  };
  holdExpiresAt?: string;
  paymentProvider?: string;
}
