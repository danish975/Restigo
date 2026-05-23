"use client";

import { useEffect, useState } from "react";
import { Users, Building, FileCheck, DollarSign } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/admin/overview');
        if (data.success) {
          setStats(data.data.stats);
          setRecent(data.data.recentBookings);
        }
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Platform Overview</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Global statistics and recent platform activity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: DollarSign, label: "Platform Volume", value: formatPrice(stats?.totalRevenue || 0) },
          { icon: Users, label: "Users", value: stats?.totalUsers || 0 },
          { icon: Building, label: "Providers", value: stats?.totalProviders || 0 },
          { icon: Building, label: "Properties", value: stats?.totalProperties || 0 },
          { icon: FileCheck, label: "Total Bookings", value: stats?.totalBookings || 0 },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-2">
              <stat.icon className="w-4 h-4" />
              {stat.label}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Bookings (Global)</h2>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Booking ID</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Property</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {recent.map((booking) => (
                <tr key={booking._id} className="hover:bg-[hsl(var(--secondary)/0.5)] transition-colors">
                  <td className="p-4 font-mono text-xs">{booking.bookingCode}</td>
                  <td className="p-4">{booking.userId?.firstName || 'Unknown'}</td>
                  <td className="p-4">{booking.propertyId?.name || 'Unknown'}</td>
                  <td className="p-4 font-medium">{formatPrice(booking.pricing.totalAmount)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                      booking.status === 'confirmed' || booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      booking.status === 'cancelled' || booking.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                      'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
