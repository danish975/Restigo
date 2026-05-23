"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  Search, Clock, MapPin, Star, Zap, Shield, ArrowRight, Building2,
  Laptop, BedDouble, Coffee, Users, ChevronRight, Sparkles, Timer,
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
  { value: "4.8★", label: "Avg Rating" },
];

const FEATURES = [
  { icon: Zap, title: "Instant Booking", desc: "Book spaces in under 60 seconds with real-time availability.", color: "text-amber-400" },
  { icon: Sparkles, title: "AI-Powered Pricing", desc: "Get the best rates with our ML-driven dynamic pricing engine.", color: "text-violet-400" },
  { icon: Shield, title: "Secure Payments", desc: "Enterprise-grade payment processing with Stripe & Razorpay.", color: "text-emerald-400" },
  { icon: Timer, title: "Flexible Duration", desc: "Book from 1 hour to 24 hours. Pay only for the time you use.", color: "text-cyan-400" },
  { icon: MapPin, title: "Nearby Discovery", desc: "Find spaces near you with GPS-powered geolocation search.", color: "text-rose-400" },
  { icon: Clock, title: "Real-Time Updates", desc: "Live inventory sync. Slots update instantly across all devices.", color: "text-blue-400" },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[hsl(174,72%,46%)] opacity-[0.07] blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(253,63%,58%)] opacity-[0.07] blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[hsl(var(--primary))] opacity-[0.03] blur-[100px]" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-sm font-medium mb-8"
            >
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
              AI-Powered Pricing Engine
              <ChevronRight className="h-3 w-3" />
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Book Spaces
              <br />
              <span className="gradient-text">By the Hour</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-[hsl(var(--muted-foreground))] mb-10 leading-relaxed">
              Hotels, workspaces, rest pods, and lounges — book from 1 hour.
              AI-optimized pricing. Real-time availability. Instant confirmation.
            </p>

            {/* Search Bar */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto max-w-2xl"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity" />
                <div className="relative flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-2">
                  <Search className="ml-3 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hotels, coworking, pods near you..."
                    className="flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[hsl(var(--muted-foreground)/0.6)]"
                    id="hero-search"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white font-semibold shadow-lg shadow-[hsl(174,72%,46%)]/20 hover:shadow-[hsl(174,72%,46%)]/40 transition-all hover:scale-105"
                  >
                    Search
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-2 mt-6 text-sm"
            >
              <span className="text-[hsl(var(--muted-foreground))]">Popular:</span>
              {["Mumbai Hotels", "Delhi Coworking", "Airport Lounges", "Nap Pods"].map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.5)] transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {STATS.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
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
