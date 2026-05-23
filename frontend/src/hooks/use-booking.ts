import { useState } from 'react';
import api from '@/lib/api';
import { useBookingStore } from '@/stores/booking-store';
import { useRouter } from 'next/navigation';

export function useBooking() {
  const router = useRouter();
  const { selectedSlots, setHoldData, setPaymentStatus, reset } = useBookingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createHold = async (guests: { adults: number; children: number }) => {
    if (selectedSlots.length === 0) {
      setError('Please select at least one slot');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const slotIds = selectedSlots.map(slot => slot._id);
      const response = await api.post('/bookings/hold', { slotIds, guests });
      
      if (response.data.success) {
        setHoldData(response.data.data);
        router.push(`/booking/${response.data.data.booking._id}`);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create booking hold');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (bookingId: string, paymentMethodId: string) => {
    setIsLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      // In a real app, you'd use Stripe.js or Razorpay SDK here first.
      // This is a simplified backend call representing the confirmation step.
      const response = await api.post(`/payments/confirm`, {
        bookingId,
        provider: 'stripe',
        externalPaymentId: 'pi_mock_' + Math.random().toString(36).substr(2, 9),
        paymentMethodId,
      });

      if (response.data.success) {
        setPaymentStatus('success');
        return true;
      }
      
      setPaymentStatus('error');
      setError('Payment failed');
      return false;
    } catch (err: any) {
      setPaymentStatus('error');
      setError(err.response?.data?.error?.message || 'Payment confirmation failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createHold,
    confirmPayment,
    isLoading,
    error,
  };
}
