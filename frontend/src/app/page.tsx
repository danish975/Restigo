"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView, Variants, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  Search, Clock, MapPin, Star, Zap, Shield, ArrowRight, Building2,
  Laptop, BedDouble, Coffee, Users, ChevronRight, Sparkles, Timer,
  CheckCircle2, CalendarClock, CreditCard, Globe, Wifi, Car, Wind,
  ChevronLeft, Quote, BadgeCheck, Calendar, TrendingUp, DollarSign,
  Smartphone, Lock, Navigation, Heart,
} from "lucide-react";

/* ─── Data Constants ─── */

const SPACE_TYPES = [
  { icon: BedDouble, label: "Hotels", type: "hotel", desc: "Premium hourly hotel rooms for rest and relaxation", color: "from-[#3B82F6] to-[#6366F1]", glow: "rgba(59, 130, 246, 0.3)" },
  { icon: Laptop, label: "Coworking", type: "coworking", desc: "Flexible desks, offices & creative spaces", color: "from-[#22D3EE] to-[#3B82F6]", glow: "rgba(34, 211, 238, 0.3)" },
  { icon: Clock, label: "Rest Pods", type: "nap_pod", desc: "Quick power naps in futuristic capsules", color: "from-[#8B5CF6] to-[#A855F7]", glow: "rgba(139, 92, 246, 0.3)" },
  { icon: Coffee, label: "Lounges", type: "lounge", desc: "Premium airport & city lounges", color: "from-[#F59E0B] to-[#EF4444]", glow: "rgba(245, 158, 11, 0.3)" },
  { icon: Users, label: "Meeting Rooms", type: "meeting_room", desc: "Bookable meeting & conference spaces", color: "from-[#EC4899] to-[#F43F5E]", glow: "rgba(236, 72, 153, 0.3)" },
  { icon: Building2, label: "Capsule Hotels", type: "capsule_hotel", desc: "Efficient capsule stays by the hour", color: "from-[#10B981] to-[#22D3EE]", glow: "rgba(16, 185, 129, 0.3)" },
];

const HERO_STATS = [
  { value: "500+", label: "Partner Properties" },
  { value: "50,000+", label: "Bookings Made" },
  { value: "20+", label: "Cities" },
  { value: "4.8/5", label: "Customer Rating" },
];

const TRUST_ITEMS = [
  { icon: Zap, label: "Instant Booking" },
  { icon: CalendarClock, label: "Real-Time Availability" },
  { icon: CreditCard, label: "Secure Payments" },
  { icon: Clock, label: "Flexible Hours" },
];

const FEATURED_LISTINGS = [
  {
    id: 1,
    image: "/featured-hotel.png",
    name: "The Grand Meridian Suite",
    location: "Bandra West, Mumbai",
    rating: 4.9,
    reviews: 284,
    pricePerHour: 1499,
    type: "Hotel",
    amenities: ["wifi", "ac", "parking"],
    instant: true,
    superhost: true,
  },
  {
    id: 2,
    image: "/featured-coworking.png",
    name: "Nexus Workspace Hub",
    location: "Koramangala, Bangalore",
    rating: 4.8,
    reviews: 156,
    pricePerHour: 349,
    type: "Coworking",
    amenities: ["wifi", "ac", "coffee"],
    instant: true,
    superhost: false,
  },
  {
    id: 3,
    image: "/featured-restpod.png",
    name: "DreamPod Transit Lounge",
    location: "Terminal 2, Delhi Airport",
    rating: 4.7,
    reviews: 412,
    pricePerHour: 599,
    type: "Rest Pod",
    amenities: ["wifi", "ac"],
    instant: true,
    superhost: true,
  },
  {
    id: 4,
    image: "/featured-lounge.png",
    name: "Velvet Sky Lounge",
    location: "Connaught Place, Delhi",
    rating: 4.9,
    reviews: 198,
    pricePerHour: 899,
    type: "Lounge",
    amenities: ["wifi", "ac", "coffee"],
    instant: true,
    superhost: false,
  },
  {
    id: 5,
    image: "/featured-meeting.png",
    name: "Pinnacle Boardroom",
    location: "BKC, Mumbai",
    rating: 4.8,
    reviews: 93,
    pricePerHour: 1999,
    type: "Meeting Room",
    amenities: ["wifi", "ac", "parking"],
    instant: true,
    superhost: true,
  },
  {
    id: 6,
    image: "/featured-boutique.png",
    name: "Bohemia Boutique Stay",
    location: "Indiranagar, Bangalore",
    rating: 4.7,
    reviews: 167,
    pricePerHour: 799,
    type: "Hotel",
    amenities: ["wifi", "ac", "parking", "coffee"],
    instant: false,
    superhost: false,
  },
];

const BENEFITS = [
  { icon: Zap, title: "Book in Under 60 Seconds", desc: "Lightning-fast booking with real-time availability and instant confirmation.", color: "#F59E0B" },
  { icon: Clock, title: "Pay Only for Hours Used", desc: "No more paying for full days. Book from 1 hour and pay proportionally.", color: "#22D3EE" },
  { icon: Navigation, title: "Find Nearby Spaces Instantly", desc: "GPS-powered search discovers the closest premium spaces around you.", color: "#10B981" },
  { icon: DollarSign, title: "Save Up to 70%", desc: "Hourly rates save you significantly compared to traditional full-day bookings.", color: "#8B5CF6" },
  { icon: Lock, title: "Secure Payments", desc: "Enterprise-grade encryption with Stripe & Razorpay. Your data is always safe.", color: "#3B82F6" },
  { icon: Smartphone, title: "Instant Confirmation", desc: "Get your booking confirmed instantly with digital access codes and directions.", color: "#EC4899" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Search Space", desc: "Enter your location and browse from hundreds of premium spaces near you.", icon: Search },
  { step: 2, title: "Choose Duration", desc: "Pick the hours that work for you — from 1 hour to a full day.", icon: Clock },
  { step: 3, title: "Book Instantly", desc: "Confirm your booking in seconds. Get instant access with digital keys.", icon: CheckCircle2 },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Freelance Designer",
    content: "RESTIGO changed how I work. I book coworking spaces hourly depending on my schedule. No commitments, no wasted money. The quality of spaces is incredible.",
    rating: 5,
    verified: true,
    avatar: "PS",
  },
  {
    id: 2,
    name: "Arjun Mehta",
    role: "Sales Director, TechVault",
    content: "Our team uses RESTIGO for client meetings in different cities. The meeting rooms are always professional, well-equipped, and the booking is seamless.",
    rating: 5,
    verified: true,
    avatar: "AM",
  },
  {
    id: 3,
    name: "Sarah Chen",
    role: "Digital Nomad",
    content: "As someone who travels constantly, RESTIGO is my go-to. Rest pods at airports and hourly hotel rooms near stations have saved me countless times.",
    rating: 5,
    verified: true,
    avatar: "SC",
  },
  {
    id: 4,
    name: "Rahul Gupta",
    role: "Hotel Owner, Mumbai",
    content: "Listing our unused room hours on RESTIGO increased our revenue by 40%. The platform handles everything — pricing, payments, and guest management.",
    rating: 5,
    verified: true,
    avatar: "RG",
  },
  {
    id: 5,
    name: "Ananya Iyer",
    role: "Startup Founder",
    content: "We don't have our own office yet. RESTIGO lets us book meeting rooms and desks exactly when needed. It's like having a flexible office everywhere.",
    rating: 5,
    verified: true,
    avatar: "AI",
  },
];

const HOST_STATS = [
  { value: "₹45K", label: "Avg Monthly Earnings" },
  { value: "85%", label: "Occupancy Increase" },
  { value: "24hr", label: "Fastest Payout" },
  { value: "0%", label: "Listing Fee" },
];

const ANIMATED_STATS = [
  { value: 50000, suffix: "+", label: "Bookings Completed" },
  { value: 500, suffix: "+", label: "Premium Spaces" },
  { value: 20, suffix: "+", label: "Cities Covered" },
  { value: 98, suffix: "%", label: "Satisfaction Rate" },
];

const SPACE_TYPE_OPTIONS = [
  { value: "", label: "Any Space" },
  { value: "hotel", label: "Hotel Room" },
  { value: "coworking", label: "Coworking" },
  { value: "nap_pod", label: "Rest Pod" },
  { value: "lounge", label: "Lounge" },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "capsule_hotel", label: "Capsule Hotel" },
];

const DURATION_OPTIONS = [
  { value: "", label: "Duration" },
  { value: "1", label: "1 Hour" },
  { value: "2", label: "2 Hours" },
  { value: "3", label: "3 Hours" },
  { value: "4", label: "4 Hours" },
  { value: "6", label: "6 Hours" },
  { value: "8", label: "8 Hours" },
  { value: "12", label: "12 Hours" },
  { value: "24", label: "24 Hours" },
];

const POPULAR_DESTINATIONS = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Goa"];

/* ─── Animation Variants ─── */
const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isInView, end, duration]);

  return { count, ref };
}

/* ─── Amenity Icon Helper ─── */
function AmenityIcon({ type }: { type: string }) {
  const icons: Record<string, typeof Wifi> = {
    wifi: Wifi,
    ac: Wind,
    parking: Car,
    coffee: Coffee,
  };
  const Icon = icons[type] || Wifi;
  return <Icon className="h-3.5 w-3.5" />;
}

/* ─── Star Rating Component ─── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= Math.floor(rating)
              ? "text-amber-400 fill-amber-400"
              : i - 0.5 <= rating
              ? "text-amber-400 fill-amber-400/50"
              : "text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOMEPAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [duration, setDuration] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  /* Parallax ref */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  /* Testimonial auto-rotate */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("q", location);
    if (spaceType) params.set("type", spaceType);
    if (duration) params.set("duration", duration);
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        id="hero"
      >
        {/* Parallax Background */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 pointer-events-none will-change-transform"
        >
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/hero-suite.png')" }}
            />
            {/* Premium dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/[0.92] via-[#0a1628]/[0.75] to-[#070b14]/[0.50]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(var(--background))]" />
          </motion.div>
        </motion.div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-40" />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`particle ${i % 3 === 0 ? 'particle-cyan' : i % 3 === 1 ? 'particle-purple' : 'particle-blue'}`}
              style={{
                width: `${4 + (i * 2)}px`,
                height: `${4 + (i * 2)}px`,
                left: `${10 + (i * 15)}%`,
                bottom: `-${5 + (i * 3)}%`,
                animationDuration: `${12 + (i * 3)}s`,
                animationDelay: `${i * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center w-full justify-between gap-12"
        >
          {/* Left Column */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl pt-8 lg:pt-0"
          >
            {/* Live Badge */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-xl text-white text-sm font-medium mb-8 shadow-[0_0_30px_-8px_rgba(34,211,238,0.15)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-white/80">Live — 2,847 spaces available now</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold tracking-tight leading-[1.08] mb-6 text-white"
            >
              Book Premium Spaces{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                By The Hour
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed max-w-xl"
            >
              Hotels, workspaces, lounges, meeting rooms, and rest pods
              available exactly when you need them.
            </motion.p>

            {/* ─── Search Bar ─── */}
            <motion.form
              variants={fadeUp}
              onSubmit={handleSearch}
              className="max-w-2xl w-full"
            >
              <div className="relative group mb-6" id="hero-search-container">
                {/* Glow on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#22D3EE]/20 via-[#3B82F6]/10 to-[#8B5CF6]/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#22D3EE]/25 to-[#8B5CF6]/25 rounded-2xl opacity-0 group-hover:opacity-60 blur transition-opacity duration-500" />

                <div className="relative flex flex-col sm:flex-row items-stretch bg-white/[0.06] backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
                  {/* Location */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 sm:border-r border-b sm:border-b-0 border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <MapPin className="h-5 w-5 text-[#22D3EE] shrink-0" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where to?"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                      id="hero-search-location"
                    />
                  </div>

                  {/* Space Type */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 sm:border-r border-b sm:border-b-0 border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <Building2 className="h-5 w-5 text-[#22D3EE] shrink-0" />
                    <select
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                      id="hero-search-type"
                    >
                      {SPACE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 sm:border-r border-b sm:border-b-0 border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <Clock className="h-5 w-5 text-[#22D3EE] shrink-0" />
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                      id="hero-search-duration"
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] text-white font-semibold text-sm shadow-[0_4px_20px_-4px_rgba(34,211,238,0.5)] hover:from-[#22D3EE] hover:to-[#8B5CF6] transition-all duration-300 hover:shadow-[0_4px_28px_-4px_rgba(34,211,238,0.6)] active:scale-[0.98] shrink-0"
                    id="hero-search-button"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Popular Destinations */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-xs text-white/40 mr-1">Popular:</span>
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  onClick={() => { setLocation(dest); }}
                  className="px-3 py-1 text-xs rounded-full bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12] hover:border-white/20 transition-all duration-200"
                >
                  {dest}
                </button>
              ))}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8"
            >
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-white/50 text-sm"
                >
                  <item.icon className="h-4 w-4 text-[#22D3EE]/70" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-0"
            >
              {HERO_STATS.map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  <motion.div
                    className="group px-5 first:pl-0 cursor-default"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#22D3EE] transition-colors duration-300">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5 group-hover:text-white/60 transition-colors duration-300">
                      {stat.label}
                    </div>
                  </motion.div>
                  {i < HERO_STATS.length - 1 && (
                    <div className="hidden sm:block h-8 w-px bg-white/10" />
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column — Floating Glass Cards */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative w-[380px] h-[420px]"
          >
            {/* Card 1 */}
            <div className="absolute top-0 right-0 w-[280px] animate-float-card">
              <div className="glass-card rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#3B82F6] flex items-center justify-center">
                    <BedDouble className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Grand Meridian</p>
                    <p className="text-xs text-white/50">Mumbai • 4.9★</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Starting from</span>
                  <span className="text-lg font-bold text-[#22D3EE]">₹1,499<span className="text-xs text-white/40 font-normal">/hr</span></span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="absolute bottom-8 left-0 w-[260px] animate-float-card-alt">
              <div className="glass-card rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center">
                    <Laptop className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Nexus Hub</p>
                    <p className="text-xs text-white/50">Bangalore • 4.8★</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Starting from</span>
                  <span className="text-lg font-bold text-[#8B5CF6]">₹349<span className="text-xs text-white/40 font-normal">/hr</span></span>
                </div>
              </div>
            </div>

            {/* Booking notification card */}
            <div className="absolute top-[55%] right-[-20px] w-[220px] animate-float-slow">
              <div className="glass-card rounded-xl p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Booking Confirmed!</p>
                    <p className="text-[10px] text-white/40">Just now • Mumbai</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: SPACE CATEGORIES
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative" id="categories">
        <div className="absolute inset-0 bg-grid-pattern-light pointer-events-none" />
        <div className="mx-auto max-w-7xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#22D3EE] mb-4">Browse by Category</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
              Every Space, <span className="gradient-text-brand">Every Need</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto text-lg">
              From power naps to power meetings — find the perfect space for any duration.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {SPACE_TYPES.map((space, i) => (
              <motion.div
                key={space.type}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={`/search?type=${space.type}`}
                  className="group block p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-transparent transition-all duration-400 card-hover-lift relative overflow-hidden"
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `0 0 50px -12px ${space.glow}, inset 0 0 50px -12px ${space.glow}` }}
                  />
                  <div className="relative">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${space.color} mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <space.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-1.5">{space.label}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{space.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: FEATURED LISTINGS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 section-gradient-1" id="featured">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#8B5CF6] mb-4">Featured</span>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Popular Spaces <span className="gradient-text-brand">Near You</span>
              </h2>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[#22D3EE] transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_LISTINGS.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/search?q=${encodeURIComponent(listing.location)}`}
                  className="group block rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] overflow-hidden card-hover-lift"
                  id={`featured-listing-${listing.id}`}
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={listing.image}
                      alt={listing.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {listing.instant && (
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-[#22D3EE] text-white shadow-lg">
                          ⚡ Instant Book
                        </span>
                      )}
                      {listing.superhost && (
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-white/90 text-gray-900 shadow-lg">
                          ★ Superhost
                        </span>
                      )}
                    </div>

                    {/* Type badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10">
                        {listing.type}
                      </span>
                    </div>

                    {/* Favorite */}
                    <button
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate group-hover:text-[#22D3EE] transition-colors">
                          {listing.name}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{listing.location}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-3 shrink-0">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold">{listing.rating}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">({listing.reviews})</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex items-center gap-3 mt-3 mb-4">
                      {listing.amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center justify-center h-7 w-7 rounded-lg bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))]"
                        >
                          <AmenityIcon type={amenity} />
                        </div>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border)/0.5)]">
                      <div>
                        <span className="text-xl font-bold">₹{listing.pricePerHour.toLocaleString()}</span>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]"> /hour</span>
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {listing.reviews} reviews
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile View All */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#22D3EE]"
            >
              View All Spaces <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: BENEFITS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative" id="benefits">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#22D3EE] mb-4">Why RESTIGO</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
              Built for <span className="gradient-text-brand">Modern Travelers</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto text-lg">
              Everything you need for seamless hourly space bookings.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-7 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-transparent transition-all duration-300 card-hover-lift relative overflow-hidden"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ boxShadow: `inset 0 0 60px -20px ${benefit.color}30` }}
                />
                <div className="relative">
                  <div
                    className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${benefit.color}15` }}
                  >
                    <benefit.icon className="h-7 w-7" style={{ color: benefit.color }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: HOW IT WORKS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 section-gradient-1" id="how-it-works">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#3B82F6] mb-4">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
              How It <span className="gradient-text-brand">Works</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto text-lg">
              Three simple steps to book your perfect space.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connector Line (desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-px">
              <div className="h-full bg-gradient-to-r from-[#22D3EE]/30 via-[#3B82F6]/30 to-[#8B5CF6]/30" />
              <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-[#22D3EE] to-[#3B82F6] opacity-50" style={{ animation: "shimmer 3s infinite" }} />
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  {/* Step Number */}
                  <div className="relative inline-flex mb-8">
                    <div className="h-[120px] w-[120px] rounded-3xl bg-gradient-to-br from-[#22D3EE]/10 via-[#3B82F6]/10 to-[#8B5CF6]/10 border border-[hsl(var(--border))] flex items-center justify-center group hover:border-[#22D3EE]/30 transition-all duration-300">
                      <step.icon className="h-12 w-12 text-[#22D3EE] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: TESTIMONIALS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" id="testimonials">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#8B5CF6] mb-4">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
              Loved by <span className="gradient-text-brand">Thousands</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto text-lg">
              See what our users and hosts are saying about RESTIGO.
            </p>
          </motion.div>

          {/* Testimonial Carousel */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="glass-card rounded-3xl p-8 sm:p-12"
                >
                  <div className="flex flex-col sm:flex-row gap-8 items-start">
                    {/* Avatar & Info */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 shrink-0">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {TESTIMONIALS[activeTestimonial].avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-base">
                          {TESTIMONIALS[activeTestimonial].name}
                        </p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {TESTIMONIALS[activeTestimonial].role}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <StarRating rating={TESTIMONIALS[activeTestimonial].rating} />
                          {TESTIMONIALS[activeTestimonial].verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="flex-1">
                      <Quote className="h-8 w-8 text-[#22D3EE]/20 mb-4" />
                      <p className="text-lg sm:text-xl leading-relaxed text-[hsl(var(--foreground)/0.85)]">
                        {TESTIMONIALS[activeTestimonial].content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setActiveTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--secondary)/0.8)] transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeTestimonial
                        ? "w-8 bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6]"
                        : "w-2 bg-[hsl(var(--muted-foreground)/0.3)] hover:bg-[hsl(var(--muted-foreground)/0.5)]"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)}
                className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--secondary)/0.8)] transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7: HOST MARKETPLACE
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 section-gradient-1" id="host-marketplace">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />

            {/* Accent glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#22D3EE]/10 rounded-full blur-[100px]" />

            <div className="relative p-8 sm:p-12 lg:p-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: Content */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-semibold mb-6">
                    <TrendingUp className="h-3.5 w-3.5" />
                    For Property Owners
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Turn Empty Hours{" "}
                    <span className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                      Into Revenue
                    </span>
                  </h2>
                  <p className="text-lg text-white/60 mb-8 leading-relaxed max-w-lg">
                    Hotels, workspaces, and lounges have unused hours every day.
                    List on RESTIGO and turn that idle inventory into a steady income stream.
                  </p>

                  {/* Host types */}
                  <div className="space-y-4 mb-10">
                    {[
                      { icon: BedDouble, label: "Hotel Owners", desc: "Monetize checkout-to-checkin hours" },
                      { icon: Laptop, label: "Workspace Operators", desc: "Fill empty desks during off-peak" },
                      { icon: Coffee, label: "Lounge Providers", desc: "Welcome new guests hourly" },
                    ].map((host) => (
                      <div key={host.label} className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                          <host.icon className="h-5 w-5 text-[#22D3EE]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{host.label}</p>
                          <p className="text-sm text-white/50">{host.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/register?role=provider"
                      className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-white font-semibold text-sm shadow-lg hover:shadow-[#22D3EE]/30 transition-all duration-300 hover:scale-105 overflow-hidden flex items-center gap-2"
                      id="host-cta-primary"
                    >
                      <span className="relative z-10">List Your Space</span>
                      <ArrowRight className="h-4 w-4 relative z-10" />
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    </Link>
                    <Link
                      href="#"
                      className="px-8 py-3.5 rounded-xl border border-white/15 text-white font-semibold text-sm hover:bg-white/[0.06] transition-all duration-300"
                      id="host-cta-secondary"
                    >
                      Learn More
                    </Link>
                  </div>
                </motion.div>

                {/* Right: Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-2 gap-5"
                >
                  {HOST_STATS.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-300"
                    >
                      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent mb-2">
                        {stat.value}
                      </div>
                      <p className="text-sm text-white/50">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 8: ANIMATED STATISTICS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" id="stats">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#22D3EE] mb-4">By The Numbers</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Trusted by <span className="gradient-text-brand">Everyone</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {ANIMATED_STATS.map((stat, i) => {
              const { count, ref } = useAnimatedCounter(stat.value);
              return (
                <motion.div
                  key={stat.label}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-8 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[#22D3EE]/20 transition-all duration-300"
                >
                  <div className="text-4xl sm:text-5xl font-bold gradient-text-brand mb-2">
                    {count.toLocaleString()}{stat.suffix}
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 9: FINAL CTA
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" id="cta">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-12 sm:p-16"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] opacity-90" />
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />

            {/* Floating elements */}
            <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-white/5 animate-float" />
            <div className="absolute bottom-8 right-12 w-16 h-16 rounded-full bg-white/5 animate-float-slow" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5">
                Ready to Book Your Space?
              </h2>
              <p className="text-white/75 max-w-xl mx-auto mb-10 text-lg leading-relaxed">
                Join 50,000+ users who save time and money by booking premium spaces by the hour.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/search"
                  className="group px-10 py-4 rounded-xl bg-white text-gray-900 font-bold text-sm shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
                  id="cta-explore-final"
                >
                  Start Exploring
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/register?role=provider"
                  className="px-10 py-4 rounded-xl border-2 border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                  id="cta-list-space-final"
                >
                  List Your Space
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
