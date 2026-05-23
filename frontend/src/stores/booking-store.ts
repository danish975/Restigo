import { create } from 'zustand';
import { Booking, InventorySlot } from '@/types/booking';

interface BookingState {
  selectedSlots: InventorySlot[];
  holdData: { booking: Booking; holdExpiresAt: string } | null;
  paymentStatus: 'idle' | 'processing' | 'success' | 'error';
  
  // Actions
  addSlot: (slot: InventorySlot) => void;
  removeSlot: (slotId: string) => void;
  clearSlots: () => void;
  setHoldData: (data: { booking: Booking; holdExpiresAt: string } | null) => void;
  setPaymentStatus: (status: 'idle' | 'processing' | 'success' | 'error') => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedSlots: [],
  holdData: null,
  paymentStatus: 'idle',

  addSlot: (slot) => set((state) => ({ 
    selectedSlots: [...state.selectedSlots, slot].sort((a, b) => 
      `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
    )
  })),
  
  removeSlot: (slotId) => set((state) => ({
    selectedSlots: state.selectedSlots.filter((s) => s._id !== slotId)
  })),
  
  clearSlots: () => set({ selectedSlots: [] }),
  
  setHoldData: (data) => set({ holdData: data }),
  
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  
  reset: () => set({ selectedSlots: [], holdData: null, paymentStatus: 'idle' }),
}));
