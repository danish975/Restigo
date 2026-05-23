"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function UserBookingsPage() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/user/overview');
        if (data.success) {
          setStats(data.data.stats);
          setRecent(data.data.recentBookings);
        }
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse flex space-x-4">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Manage your past and upcoming stays.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Stays", value: stats?.activeBookings || 0 },
          { label: "Completed", value: stats?.completedBookings || 0 },
          { label: "Total Spent", value: formatPrice(stats?.totalSpent || 0) },
          { label: "Cancelled", value: stats?.cancelledBookings || 0 },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recent.map((booking) => (
            <div key={booking._id} className="flex items-center gap-6 p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] transition-colors">
              <div className="w-24 h-24 rounded-lg bg-[hsl(var(--secondary))] overflow-hidden shrink-0">
                {booking.propertyId?.images?.[0] ? (
                  <img src={booking.propertyId.images[0]} alt="Property" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[hsl(var(--primary)/0.1)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                    booking.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{booking.bookingCode}</span>
                </div>
                <h3 className="font-semibold text-lg truncate">{booking.propertyId?.name || 'Unknown Property'}</h3>
                <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(booking.checkIn.date), 'MMM d, yyyy')}</span>
                  <span>{booking.totalDurationMinutes / 60} Hours</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{formatPrice(booking.pricing.totalAmount)}</div>
                <button className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1 mt-2">
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
              No bookings found. Time to explore!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
