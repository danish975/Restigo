"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Shield, CreditCard, ChevronLeft, AlertCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { useBookingStore } from "@/stores/booking-store";
import { formatPrice } from "@/lib/utils";
import { bookingAPI, paymentAPI } from "@/lib/api";

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const { holdData, paymentStatus, setHoldData, setPaymentStatus } = useBookingStore();
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingBooking, setFetchingBooking] = useState(false);

  // If we don't have holdData in the store, try fetching from API
  useEffect(() => {
    if (holdData) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent(`/booking/${bookingId}`));
      return;
    }

    const fetchBooking = async () => {
      setFetchingBooking(true);
      try {
        const { data } = await bookingAPI.getById(bookingId);
        if (data.success && data.data.booking) {
          const booking = data.data.booking;
          if (booking.status === 'held' || booking.status === 'pending_payment') {
            setHoldData({
              booking,
              holdExpiresAt: booking.holdExpiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            });
          } else if (booking.status === 'confirmed') {
            setPaymentStatus('success');
          } else {
            setError('This booking is no longer available for payment.');
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch booking:", err);
        setError('Could not load booking details. Please try again.');
      } finally {
        setFetchingBooking(false);
      }
    };
    fetchBooking();
  }, [holdData, bookingId, router, setHoldData, setPaymentStatus]);

  // Countdown timer
  useEffect(() => {
    if (!holdData) return;

    const expiresAt = new Date(holdData.holdExpiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = Math.floor((expiresAt - now) / 1000);

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        setTimeLeft(difference);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdData]);

  const handlePayment = async () => {
    if (!holdData) return;

    setIsLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      // Step 1: Create payment intent
      const { data: intentData } = await paymentAPI.createIntent({
        bookingId: holdData.booking._id,
        provider: 'stripe',
      });

      if (!intentData.success) {
        throw new Error('Failed to create payment intent');
      }

      // Step 2: In development, simulate success immediately
      // In production, you'd use Stripe.js here
      const { data: confirmData } = await paymentAPI.simulateSuccess({
        bookingId: holdData.booking._id,
      });

      if (confirmData.success) {
        setPaymentStatus('success');
        setTimeout(() => {
          router.push("/dashboard/bookings");
        }, 3000);
      } else {
        setPaymentStatus('error');
        setError('Payment failed. Please try again.');
      }
    } catch (err: any) {
      setPaymentStatus('error');
      setError(err.response?.data?.error?.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Loading state
  if (fetchingBooking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--primary))] mb-4" />
            <p className="text-[hsl(var(--muted-foreground))]">Loading booking details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 max-w-md"
          >
            <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
            <p className="text-[hsl(var(--muted-foreground))] mb-8">
              Your payment was successful. We've sent the confirmation details to your email.
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">
              Redirecting to your dashboard...
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state (no hold data and error)
  if (!holdData && error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center p-8 max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Booking Unavailable</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">{error}</p>
            <button
              onClick={() => router.push("/search")}
              className="px-6 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium"
            >
              Back to Search
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // No hold data and no error — waiting
  if (!holdData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--primary))] mb-4" />
            <p className="text-[hsl(var(--muted-foreground))]">Loading booking...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete your booking</h1>
              <div className="flex items-center p-3 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Clock className="w-5 h-5 mr-3 animate-pulse" />
                <span className="font-medium">
                  {timeLeft > 0
                    ? `We're holding these slots for you. Complete payment in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} mins.`
                    : "Hold expired. Please restart the booking process."}
                </span>
              </div>
            </div>

            {/* Booking Details */}
            <div className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <h2 className="text-lg font-semibold mb-3">Booking Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Booking Code</span>
                  <p className="font-mono font-semibold">{holdData.booking.bookingCode}</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Check-in</span>
                  <p className="font-medium">{holdData.booking.checkIn?.date} at {holdData.booking.checkIn?.time}</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Check-out</span>
                  <p className="font-medium">{holdData.booking.checkOut?.date} at {holdData.booking.checkOut?.time}</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Duration</span>
                  <p className="font-medium">{holdData.booking.totalDurationMinutes ? `${Math.round(holdData.booking.totalDurationMinutes / 60)}h` : `${holdData.booking.slotIds?.length || 1}h`}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] flex items-center gap-4 cursor-pointer">
                  <CreditCard className="w-6 h-6 text-[hsl(var(--primary))]" />
                  <div>
                    <div className="font-medium">Credit / Debit Card</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Stripe Secure Processing</div>
                  </div>
                  <div className="ml-auto w-4 h-4 rounded-full border-[5px] border-[hsl(var(--primary))] bg-white" />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={timeLeft <= 0 || isLoading || paymentStatus === 'processing'}
                className="w-full mt-6 py-4 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold flex items-center justify-center disabled:opacity-50 transition-all"
              >
                {isLoading || paymentStatus === 'processing' ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Pay {formatPrice(holdData.booking.pricing.totalAmount)}</>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[hsl(var(--muted-foreground))]">
                <Shield className="w-4 h-4" />
                <span>Payments are secure and encrypted.</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] sticky top-24">
              <h3 className="font-semibold mb-4">Price Breakdown</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Base Price</span>
                  <span>{formatPrice(holdData.booking.pricing.baseAmount)}</span>
                </div>
                {holdData.booking.pricing.dynamicAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Dynamic Adj.</span>
                    <span>{formatPrice(holdData.booking.pricing.dynamicAmount)}</span>
                  </div>
                )}
                {holdData.booking.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Discount</span>
                    <span>-{formatPrice(holdData.booking.pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Taxes & Fees</span>
                  <span>{formatPrice(holdData.booking.pricing.taxes)}</span>
                </div>

                <div className="border-t border-[hsl(var(--border))] pt-3 mt-3 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(holdData.booking.pricing.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
