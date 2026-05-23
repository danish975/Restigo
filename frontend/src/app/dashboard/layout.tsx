"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Calendar, Settings, PieChart, Users, Building, LogOut } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const getLinks = () => {
    if (user?.role === "admin") {
      return [
        { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
        { name: "Providers", href: "/dashboard/admin/providers", icon: Users },
      ];
    }
    if (user?.role === "provider") {
      return [
        { name: "Overview", href: "/dashboard/provider", icon: LayoutDashboard },
        { name: "Properties", href: "/dashboard/provider/properties", icon: Building },
        { name: "Earnings", href: "/dashboard/provider/earnings", icon: PieChart },
      ];
    }
    return [
      { name: "My Bookings", href: "/dashboard/bookings", icon: Calendar },
      { name: "Profile", href: "/dashboard/profile", icon: Settings },
    ];
  };

  const links = getLinks();

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--secondary)/0.3)]">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto w-full pt-20 px-4 sm:px-6 lg:px-8 gap-8">
        
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block py-8">
          <div className="sticky top-28 p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-bold uppercase">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div>
                <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{user?.role}</div>
              </div>
            </div>

            <nav className="space-y-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium" 
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-4 border-t border-[hsl(var(--border))]">
              <button
                onClick={() => logout()}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-8 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
