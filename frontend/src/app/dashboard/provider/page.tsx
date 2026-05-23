"use client";

import { useEffect, useState } from "react";
import { PieChart, Building, CreditCard, CalendarCheck, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function ProviderDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/provider/overview');
        if (data.success) {
          setStats(data.data.stats);
          setRecent(data.data.upcomingCheckins);
        }
      } catch (error) {
        console.error("Failed to load provider dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Provider Overview</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Monitor your properties, revenue, and upcoming guests.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CreditCard, label: "Total Revenue", value: formatPrice(stats?.totalRevenue || 0), color: "text-emerald-500" },
          { icon: CalendarCheck, label: "Active Bookings", value: stats?.activeBookings || 0, color: "text-blue-500" },
          { icon: Building, label: "Properties", value: stats?.totalProperties || 0, color: "text-violet-500" },
          { icon: PieChart, label: "Total Rooms", value: stats?.totalRooms || 0, color: "text-amber-500" },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-[hsl(var(--secondary))] ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Check-ins</h2>
          <button className="text-sm text-[hsl(var(--primary))] hover:underline">View All</button>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Guest</th>
                <th className="p-4 font-medium">Room</th>
                <th className="p-4 font-medium">Check In</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {recent.map((booking) => (
                <tr key={booking._id} className="hover:bg-[hsl(var(--secondary)/0.5)] transition-colors">
                  <td className="p-4">
                    <div className="font-medium">{booking.userId?.firstName} {booking.userId?.lastName}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{booking.bookingCode}</div>
                  </td>
                  <td className="p-4">{booking.roomId?.name || 'Unknown Room'}</td>
                  <td className="p-4">
                    <div className="font-medium">{format(new Date(booking.checkIn.date), 'MMM d')}</div>
                    <div className="text-[hsl(var(--muted-foreground))]">{booking.checkIn.time}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium uppercase">
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-[hsl(var(--secondary))] rounded-lg transition-colors">
                      <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    </button>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                    No upcoming check-ins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
