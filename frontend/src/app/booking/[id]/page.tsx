"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Shield, CreditCard, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { useBookingStore } from "@/stores/booking-store";
import { useBooking } from "@/hooks/use-booking";
import { formatPrice } from "@/lib/utils";

export default function BookingPage() {
  const router = useRouter();
  const { holdData, paymentStatus } = useBookingStore();
  const { confirmPayment, isLoading, error } = useBooking();
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  useEffect(() => {
    if (!holdData) {
      // If we land here without hold data in store, typically we'd fetch it.
      // For this demo, if it's missing, just go back.
      router.push("/search");
      return;
    }

    const expiresAt = new Date(holdData.holdExpiresAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = Math.floor((expiresAt - now) / 1000);

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        // Handle expiration (e.g., show modal, redirect)
      } else {
        setTimeLeft(difference);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdData, router]);

  const handlePayment = async () => {
    if (!holdData) return;
    const success = await confirmPayment(holdData.booking._id, "mock_pm_" + Date.now());
    if (success) {
      setTimeout(() => {
        router.push("/dashboard/bookings");
      }, 3000);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

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
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  {error}
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
                  <>Pay {holdData && formatPrice(holdData.booking.pricing.totalAmount)}</>
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
              
              {holdData && (
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
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Taxes & Fees</span>
                    <span>{formatPrice(holdData.booking.pricing.taxes)}</span>
                  </div>
                  
                  <div className="border-t border-[hsl(var(--border))] pt-3 mt-3 flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{formatPrice(holdData.booking.pricing.totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
