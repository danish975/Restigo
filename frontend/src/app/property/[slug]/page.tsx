"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { formatPrice, getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/utils";
import { propertyAPI, searchAPI, bookingAPI } from "@/lib/api";
import { useBookingStore } from "@/stores/booking-store";
import {
  Star, MapPin, Clock, Shield, Check, ChevronRight,
  Timer, Zap, Loader2, AlertCircle,
  Phone, Mail, Globe, CreditCard,
} from "lucide-react";

interface SlotData {
  _id: string;
  roomId: string;
  startTime: string;
  endTime: string;
  status: string;
  basePrice: number;
  dynamicPrice?: number;
  date: string;
}

interface RoomData {
  _id: string;
  name: string;
  type: string;
  basePrice: number;
  currency: string;
  capacity: { adults: number };
  amenities: string[];
  size?: { value: number; unit: string };
}

interface PropertyData {
  _id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  images: string[];
  location: any;
  amenities: string[];
  policies: any;
  contact: any;
  rating: { average: number; count: number };
  priceRange: { min: number; max: number; currency: string };
  operatingHours: any;
  totalRooms?: number;
}

const REVIEWS = [
  { user: "Arjun M.", rating: 5, comment: "Fantastic hourly booking experience! The room was clean and check-in was seamless. Will definitely use RESTIGO again.", date: "2 days ago" },
  { user: "Priya S.", rating: 4, comment: "Great location. Perfect for a quick rest between meetings. WiFi was fast.", date: "1 week ago" },
  { user: "Rahul K.", rating: 5, comment: "Best value for an hourly stay. The suite was spacious and well-equipped.", date: "2 weeks ago" },
];

export default function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { setHoldData } = useBookingStore();

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Fetch property and rooms
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const { data } = await propertyAPI.getBySlug(slug);
        if (data.success) {
          setProperty(data.data.property);
          setRooms(data.data.rooms || []);
          if (data.data.rooms?.length > 0) {
            setSelectedRoom(data.data.rooms[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch property:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [slug]);

  // Fetch slots when room changes
  useEffect(() => {
    if (!property || !selectedRoom) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlots([]);
      try {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await searchAPI.searchSlots({
          propertyId: property._id,
          roomId: selectedRoom._id,
          date: today,
        });
        if (data.success) {
          setSlots(data.data.slots || []);
        }
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [property, selectedRoom]);

  const toggleSlot = (slotId: string, status: string) => {
    if (status !== "available") return;
    setSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
    setBookingError(null);
  };

  const selectedTotal = selectedSlots.reduce((sum, id) => {
    const slot = slots.find((s) => s._id === id);
    return sum + (slot?.dynamicPrice || slot?.basePrice || 0);
  }, 0);

  const handleReserve = async () => {
    if (selectedSlots.length === 0) return;

    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent(`/property/${slug}`));
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const { data } = await bookingAPI.createHold({
        slotIds: selectedSlots,
        guests: { adults: 1, children: 0 },
      });

      if (data.success) {
        setHoldData(data.data);
        router.push(`/booking/${data.data.booking._id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to create booking hold. Please try again.";
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <Navbar />
        <div className="pt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-72 rounded-2xl skeleton" />
            <div className="h-8 w-1/2 skeleton rounded" />
            <div className="h-4 w-3/4 skeleton rounded" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
            <h2 className="text-xl font-semibold mb-2">Property not found</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">The property you're looking for doesn't exist or has been removed.</p>
            <Link href="/search" className="px-6 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium">
              Back to Search
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const locationAddress = typeof property.location?.address === 'string'
    ? property.location.address
    : property.location?.address?.street || '';
  const locationCity = typeof property.location?.address === 'string'
    ? property.location?.city
    : property.location?.address?.city || property.location?.city || '';

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
            {/* Hero image */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--muted))] h-72 sm:h-96">
              {property.images?.[0] && !imgError ? (
                <img
                  src={property.images[0]}
                  alt={property.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-8xl opacity-20">{getPropertyTypeIcon(property.type)}</span>
                </div>
              )}
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
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {locationAddress}{locationCity ? `, ${locationCity}` : ''}</span>
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {property.rating.average} ({property.rating.count} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{property.description}</p>

              {/* Amenities */}
              {property.amenities?.length > 0 && (
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
              )}

              {/* Contact */}
              {property.contact && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Contact</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                    {property.contact.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {property.contact.phone}</span>
                    )}
                    {property.contact.email && (
                      <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {property.contact.email}</span>
                    )}
                    {property.contact.website && (
                      <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> {property.contact.website}</span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Room Selection */}
            {rooms.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="font-semibold text-lg mb-4">Choose a Room</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {rooms.map((room) => (
                    <button
                      key={room._id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRoom?._id === room._id
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] ring-2 ring-[hsl(var(--primary)/0.2)]"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)]"
                      }`}
                    >
                      <h4 className="font-semibold text-sm">{room.name}</h4>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {room.size ? `${room.size.value} ${room.size.unit} · ` : ''}{room.capacity?.adults || 2} guests
                      </p>
                      <p className="text-lg font-bold mt-2 gradient-text">
                        {formatPrice(room.basePrice)}<span className="text-xs text-[hsl(var(--muted-foreground))] font-normal">/hr</span>
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Time Slot Picker */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="font-semibold text-lg mb-4">Select Time Slots — Today</h3>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
                  <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">Loading slots...</span>
                </div>
              ) : slots.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {slots.map((slot) => (
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
                          {slot.status === "available" ? formatPrice(slot.dynamicPrice || slot.basePrice) : slot.status === "held" ? "⏳ Held" : "✕ Booked"}
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
                </>
              ) : (
                <div className="py-12 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                  <Clock className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))] mb-3" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {rooms.length === 0 ? "No rooms available for this property." : "No slots available for today. Try checking back later."}
                  </p>
                </div>
              )}
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
                    <span className="text-2xl font-bold gradient-text">{formatPrice(selectedRoom?.basePrice || property.priceRange.min)}</span>
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
                    <div className="font-medium text-sm">{selectedRoom?.name || "Select a room"}</div>
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

                {bookingError && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <button
                  onClick={handleReserve}
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
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Clock className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Free cancellation ({property.policies?.cancellationPolicy || 'moderate'})</div>
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
