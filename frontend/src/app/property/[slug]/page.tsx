"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { formatPrice, getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/utils";
import {
  Star, MapPin, Clock, Shield, Wifi, Car, Wind, Coffee, Users, ChevronRight,
  Calendar, Timer, Check, ArrowRight, Zap, Phone, Mail, Globe, Loader2,
} from "lucide-react";

// Demo property for SSR/initial display
const DEMO_PROPERTY = {
  _id: "1", name: "FlexStay Business Suites", slug: "flexstay-business-suites",
  type: "hotel", description: "Premium business hotel offering flexible hourly bookings in the heart of Bangalore's CBD. Modern rooms with high-speed WiFi, ergonomic workspace, and premium amenities. Perfect for business travelers, digital nomads, and anyone needing a private space for a few hours. 24/7 front desk, room service, and contactless check-in available.",
  images: [],
  location: { type: "Point", coordinates: [77.5946, 12.9716], address: "42 MG Road, CBD", city: "Bangalore", state: "Karnataka", country: "India", zipCode: "560001" },
  amenities: ["wifi", "ac", "tv", "minibar", "room_service", "parking", "gym", "safe", "power_outlets", "coffee_machine"],
  policies: { cancellationPolicy: "moderate", minBookingHours: 1, maxBookingHours: 12, allowPets: false, smokingAllowed: false },
  contact: { phone: "+91 9000000004", email: "info@flexstay.com", website: "https://flexstay.com" },
  rating: { average: 4.7, count: 342 },
  priceRange: { min: 599, max: 1799, currency: "INR" },
  operatingHours: { open: "00:00", close: "23:59", is24Hours: true, closedDays: [] },
  totalRooms: 12,
};

const DEMO_ROOMS = [
  { _id: "r1", name: "Standard Room", type: "standard", basePrice: 599, currency: "INR", capacity: { adults: 2 }, amenities: ["wifi", "ac", "tv"], size: { value: 250, unit: "sqft" } },
  { _id: "r2", name: "Deluxe Room", type: "deluxe", basePrice: 899, currency: "INR", capacity: { adults: 2 }, amenities: ["wifi", "ac", "tv", "minibar"], size: { value: 350, unit: "sqft" } },
  { _id: "r3", name: "Business Suite", type: "suite", basePrice: 1499, currency: "INR", capacity: { adults: 3 }, amenities: ["wifi", "ac", "tv", "minibar", "room_service", "safe"], size: { value: 500, unit: "sqft" } },
];

const DEMO_SLOTS = [
  { _id: "s1", roomId: "r1", startTime: "09:00", endTime: "10:00", status: "available", basePrice: 599 },
  { _id: "s2", roomId: "r1", startTime: "10:00", endTime: "11:00", status: "available", basePrice: 599 },
  { _id: "s3", roomId: "r1", startTime: "11:00", endTime: "12:00", status: "held", basePrice: 649 },
  { _id: "s4", roomId: "r1", startTime: "12:00", endTime: "13:00", status: "available", basePrice: 699 },
  { _id: "s5", roomId: "r1", startTime: "13:00", endTime: "14:00", status: "available", basePrice: 649 },
  { _id: "s6", roomId: "r1", startTime: "14:00", endTime: "15:00", status: "booked", basePrice: 699 },
  { _id: "s7", roomId: "r1", startTime: "15:00", endTime: "16:00", status: "available", basePrice: 599 },
  { _id: "s8", roomId: "r1", startTime: "16:00", endTime: "17:00", status: "available", basePrice: 649 },
  { _id: "s9", roomId: "r1", startTime: "17:00", endTime: "18:00", status: "available", basePrice: 749 },
];

const REVIEWS = [
  { user: "Arjun M.", rating: 5, comment: "Fantastic hourly booking experience! The room was clean and check-in was seamless. Will definitely use RESTIGO again.", date: "2 days ago" },
  { user: "Priya S.", rating: 4, comment: "Great location near MG Road metro. Perfect for a quick rest between meetings. WiFi was fast.", date: "1 week ago" },
  { user: "Rahul K.", rating: 5, comment: "Best value for an hourly hotel stay in Bangalore. The business suite was spacious and well-equipped.", date: "2 weeks ago" },
];

export default function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const property = DEMO_PROPERTY;
  const rooms = DEMO_ROOMS;

  const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const toggleSlot = (slotId: string, status: string) => {
    if (status !== "available") return;
    setSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const selectedTotal = selectedSlots.reduce((sum, id) => {
    const slot = DEMO_SLOTS.find((s) => s._id === id);
    return sum + (slot?.basePrice || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />

      <div className="pt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-6">
          <Link href="/search" className="hover:text-[hsl(var(--foreground))]">Search</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[hsl(var(--foreground))]">{property.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero image placeholder */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--muted))] h-72 sm:h-96 flex items-center justify-center">
              <span className="text-8xl opacity-20">{getPropertyTypeIcon(property.type)}</span>
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white text-sm font-semibold">
                {getPropertyTypeLabel(property.type)}
              </div>
            </motion.div>

            {/* Property info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{property.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {property.location.address}, {property.location.city}</span>
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {property.rating.average} ({property.rating.count} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{property.description}</p>

              {/* Amenities */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {property.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 p-2.5 rounded-xl bg-[hsl(var(--secondary))] text-sm">
                      <Check className="h-4 w-4 text-[hsl(var(--primary))]" />
                      <span className="capitalize">{a.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Room Selection */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-semibold text-lg mb-4">Choose a Room</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {rooms.map((room) => (
                  <button
                    key={room._id}
                    onClick={() => { setSelectedRoom(room); setSelectedSlots([]); }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedRoom._id === room._id
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] ring-2 ring-[hsl(var(--primary)/0.2)]"
                        : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)]"
                    }`}
                  >
                    <h4 className="font-semibold text-sm">{room.name}</h4>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{room.size.value} {room.size.unit} · {room.capacity.adults} guests</p>
                    <p className="text-lg font-bold mt-2 gradient-text">{formatPrice(room.basePrice)}<span className="text-xs text-[hsl(var(--muted-foreground))] font-normal">/hr</span></p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Time Slot Picker */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="font-semibold text-lg mb-4">Select Time Slots — Today</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {DEMO_SLOTS.map((slot) => (
                  <button
                    key={slot._id}
                    onClick={() => toggleSlot(slot._id, slot.status)}
                    disabled={slot.status !== "available"}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedSlots.includes(slot._id)
                        ? "bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white border-transparent shadow-lg"
                        : slot.status === "available"
                          ? "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] cursor-pointer"
                          : slot.status === "held"
                            ? "border-amber-500/30 bg-amber-500/5 cursor-not-allowed opacity-60"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] cursor-not-allowed opacity-40"
                    }`}
                  >
                    <div className="text-xs font-semibold">{slot.startTime} - {slot.endTime}</div>
                    <div className={`text-xs mt-1 ${selectedSlots.includes(slot._id) ? "text-white/80" : "text-[hsl(var(--muted-foreground))]"}`}>
                      {slot.status === "available" ? formatPrice(slot.basePrice) : slot.status === "held" ? "⏳ Held" : "✕ Booked"}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/10 border border-amber-500/30" /> Held</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[hsl(var(--muted)/0.5)]" /> Booked</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)]" /> Selected</span>
              </div>
            </motion.div>

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="font-semibold text-lg mb-4">Reviews</h3>
              <div className="space-y-4">
                {REVIEWS.map((review, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] flex items-center justify-center text-white text-sm font-bold">{review.user[0]}</div>
                        <span className="font-medium text-sm">{review.user}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                      </div>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{review.comment}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{review.date}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sticky Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold gradient-text">{formatPrice(selectedRoom.basePrice)}</span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">/hour</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-sm">{property.rating.average}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-3 rounded-xl bg-[hsl(var(--secondary))]">
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Room</div>
                    <div className="font-medium text-sm">{selectedRoom.name}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--secondary))]">
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Selected Slots</div>
                    <div className="font-medium text-sm">
                      {selectedSlots.length > 0
                        ? `${selectedSlots.length} slot(s) · ${selectedSlots.length}h`
                        : "No slots selected"}
                    </div>
                  </div>
                </div>

                {selectedSlots.length > 0 && (
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Subtotal</span><span>{formatPrice(selectedTotal)}</span></div>
                    <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">GST (18%)</span><span>{formatPrice(Math.round(selectedTotal * 0.18))}</span></div>
                    <div className="border-t border-[hsl(var(--border))] pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="gradient-text">{formatPrice(Math.round(selectedTotal * 1.18))}</span>
                    </div>
                  </div>
                )}

                <button
                  disabled={selectedSlots.length === 0 || bookingLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bookingLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                    <Zap className="h-4 w-4" /> Reserve Now
                  </>}
                </button>

                <p className="text-xs text-center text-[hsl(var(--muted-foreground))] mt-3 flex items-center justify-center gap-1">
                  <Timer className="h-3 w-3" /> 5-minute hold · Pay within hold period
                </p>

                <div className="mt-6 pt-4 border-t border-[hsl(var(--border))] space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Shield className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Instant confirmation</div>
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Clock className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Free cancellation (moderate)</div>
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Zap className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> AI-optimized pricing</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
