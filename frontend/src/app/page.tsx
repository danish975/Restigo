"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  Search, Clock, MapPin, Star, Zap, Shield, ArrowRight, Building2,
  Laptop, BedDouble, Coffee, Users, ChevronRight, Sparkles, Timer,
  CheckCircle2, CalendarClock, CreditCard, Globe,
} from "lucide-react";

const SPACE_TYPES = [
  { icon: BedDouble, label: "Hotels", type: "hotel", desc: "Hourly hotel rooms", color: "from-blue-500 to-indigo-600" },
  { icon: Laptop, label: "Coworking", type: "coworking", desc: "Flexible desks & offices", color: "from-emerald-500 to-teal-600" },
  { icon: Clock, label: "Rest Pods", type: "nap_pod", desc: "Quick power naps", color: "from-violet-500 to-purple-600" },
  { icon: Coffee, label: "Lounges", type: "lounge", desc: "Premium lounges", color: "from-amber-500 to-orange-600" },
  { icon: Users, label: "Meeting Rooms", type: "meeting_room", desc: "Bookable meeting spaces", color: "from-rose-500 to-pink-600" },
  { icon: Building2, label: "Capsule Hotels", type: "capsule_hotel", desc: "Capsule stays", color: "from-cyan-500 to-blue-600" },
];

const STATS = [
  { value: "10K+", label: "Spaces Listed" },
  { value: "50K+", label: "Bookings Made" },
  { value: "25+", label: "Cities" },
  { value: "4.8★", label: "Average Rating" },
];

const TRUST_ITEMS = [
  { icon: Zap, label: "Instant Booking" },
  { icon: CalendarClock, label: "Real-Time Availability" },
  { icon: CreditCard, label: "Secure Payments" },
  { icon: Clock, label: "Flexible Hourly Stays" },
];

const FEATURES = [
  { icon: Zap, title: "Instant Booking", desc: "Book spaces in under 60 seconds with real-time availability.", color: "text-amber-400" },
  { icon: Sparkles, title: "AI-Powered Pricing", desc: "Get the best rates with our ML-driven dynamic pricing engine.", color: "text-violet-400" },
  { icon: Shield, title: "Secure Payments", desc: "Enterprise-grade payment processing with Stripe & Razorpay.", color: "text-emerald-400" },
  { icon: Timer, title: "Flexible Duration", desc: "Book from 1 hour to 24 hours. Pay only for the time you use.", color: "text-cyan-400" },
  { icon: MapPin, title: "Nearby Discovery", desc: "Find spaces near you with GPS-powered geolocation search.", color: "text-rose-400" },
  { icon: Clock, title: "Real-Time Updates", desc: "Live inventory sync. Slots update instantly across all devices.", color: "text-blue-400" },
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
  { value: "", label: "Any Duration" },
  { value: "1", label: "1 Hour" },
  { value: "2", label: "2 Hours" },
  { value: "3", label: "3 Hours" },
  { value: "4", label: "4 Hours" },
  { value: "6", label: "6 Hours" },
  { value: "8", label: "8 Hours" },
  { value: "12", label: "12 Hours" },
  { value: "24", label: "24 Hours" },
];

/* ─── Animation Variants ─── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [duration, setDuration] = useState("");

  /* Parallax ref */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

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
    <div className="min-h-screen">
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {/* Parallax Hero Background */}
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
            {/* Premium dark navy gradient overlay — left heavy, right transparent */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/[0.82] via-[#0d1f3c]/[0.55] to-[#0a1628]/[0.25]" />
            {/* Bottom gradient fade for smooth section transition (pushed to very bottom to preserve text readability) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_85%,hsl(var(--background))_100%)]" />
          </motion.div>
        </motion.div>

        {/* Grid pattern — reduced opacity */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(hsl(var(--foreground)/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start text-left w-full justify-center"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl pt-12"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl text-white text-sm font-medium mb-8 shadow-[0_0_20px_-4px_rgba(20,184,166,0.15)]">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span className="text-white/90">AI-Powered Pricing Engine</span>
                <ChevronRight className="h-3 w-3 text-white/50" />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 text-white"
            >
              Luxury Spaces.
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Flexible Hours.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl"
            >
              Book premium hotel rooms, workspaces, lounges, and meeting rooms
              exactly when you need them. Instant booking. Flexible durations.
              Smart pricing.
            </motion.p>

            {/* ─── Structured Search Bar (Airbnb-style) ─── */}
            <motion.form
              variants={fadeUp}
              onSubmit={handleSearch}
              className="max-w-3xl w-full"
            >
              <div className="relative group mb-8" id="hero-search-container">
                {/* Teal glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-emerald-500/10 to-teal-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400/25 to-emerald-500/25 rounded-2xl opacity-0 group-hover:opacity-60 blur transition-opacity duration-500" />

                <div className="relative flex flex-col sm:flex-row items-stretch bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
                  {/* Location */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 sm:border-r border-b sm:border-b-0 border-white/[0.08] group/field hover:bg-white/[0.04] transition-colors">
                    <MapPin className="h-5 w-5 text-teal-400 shrink-0" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where to?"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                      id="hero-search-location"
                    />
                  </div>

                  {/* Space Type */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 sm:border-r border-b sm:border-b-0 border-white/[0.08] group/field hover:bg-white/[0.04] transition-colors">
                    <Building2 className="h-5 w-5 text-teal-400 shrink-0" />
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
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 sm:border-r border-b sm:border-b-0 border-white/[0.08] group/field hover:bg-white/[0.04] transition-colors">
                    <Clock className="h-5 w-5 text-teal-400 shrink-0" />
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
                    className="flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-teal-500 to-teal-400 text-white font-semibold text-sm shadow-[0_4px_20px_-4px_rgba(20,184,166,0.5)] hover:from-teal-400 hover:to-emerald-400 transition-all hover:shadow-[0_4px_28px_-4px_rgba(20,184,166,0.6)] active:scale-[0.98] shrink-0"
                    id="hero-search-button"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>
            </motion.form>

            {/* ─── Trust Indicators ─── */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-10"
            >
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-white/60 text-sm"
                >
                  <item.icon className="h-4 w-4 text-teal-400/80" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4 text-sm"
            >
              <Link
                href="/search"
                className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-white font-semibold shadow-[0_4px_20px_-4px_rgba(20,184,166,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(20,184,166,0.5)] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden"
                id="cta-explore"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explore Spaces
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                {/* Shimmer */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </Link>
              <Link
                href="/how-it-works"
                className="px-8 py-3.5 rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] text-white font-semibold shadow-[0_4px_16px_0_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5"
                id="cta-how-it-works"
              >
                How It Works
              </Link>
            </motion.div>
          </motion.div>

          {/* ─── Stats with Dividers ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 flex flex-wrap items-center gap-0 text-left max-w-3xl w-full"
          >
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                <motion.div
                  className="group px-6 first:pl-0 cursor-default"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/50 mt-1 group-hover:text-white/70 transition-colors duration-300">
                    {stat.label}
                  </div>
                </motion.div>
                {/* Vertical divider — skip last */}
                {i < STATS.length - 1 && (
                  <div className="hidden md:block h-10 w-px bg-white/15" />
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Space Types ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Every Space, <span className="gradient-text">Every Need</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              From power naps to power meetings — find the perfect space for any duration.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SPACE_TYPES.map((space, i) => (
              <motion.div
                key={space.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/search?type=${space.type}`}
                  className="group block p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[hsl(var(--primary))/0.05]"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${space.color} mb-4`}>
                    <space.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{space.label}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{space.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--secondary)/0.3)]">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for <span className="gradient-text">Modern Travel</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Enterprise-grade technology powering seamless micro-stay experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] transition-all"
              >
                <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-12 sm:p-16"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] opacity-90" />
            <div className="absolute inset-0 bg-[linear-gradient(hsl(0,0%,100%,0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(0,0%,100%,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Start Monetizing Your Empty Hours
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                List your hotel rooms, pods, or workspaces on RESTIGO and start earning from unused inventory windows.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register?role=provider"
                  className="px-8 py-3 rounded-xl bg-white text-[hsl(224,32%,8%)] font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  List Your Space
                </Link>
                <Link
                  href="/search"
                  className="px-8 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  Explore Spaces <ArrowRight className="h-4 w-4" />
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
