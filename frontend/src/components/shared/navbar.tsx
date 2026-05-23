"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import {
  Clock, Search, Menu, X, Moon, Sun, User, LogOut, LayoutDashboard, Building2,
} from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass shadow-lg shadow-black/5"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] shadow-lg shadow-[hsl(174,72%,46%)]/20 transition-transform group-hover:scale-110">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              REST<span className="gradient-text">IGO</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/search", label: "Explore", icon: Search },
              { href: "/search?type=hotel", label: "Hotels" },
              { href: "/search?type=coworking", label: "Workspaces" },
              { href: "/search?type=nap_pod", label: "Rest Pods" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors rounded-lg hover:bg-[hsl(var(--secondary))]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href={user?.role === 'provider' ? '/dashboard/provider' : user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white shadow-lg shadow-[hsl(174,72%,46%)]/20 hover:shadow-[hsl(174,72%,46%)]/40 transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-[hsl(var(--border))]"
          >
            <div className="px-4 py-4 space-y-2">
              {["Explore", "Hotels", "Workspaces", "Rest Pods"].map((label) => (
                <Link
                  key={label}
                  href={`/search${label !== "Explore" ? `?type=${label.toLowerCase().replace(' ', '_')}` : ''}`}
                  className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-[hsl(var(--secondary))]"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-[hsl(var(--border))] pt-2 mt-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard/user" className="block px-3 py-2 text-sm rounded-lg hover:bg-[hsl(var(--secondary))]" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-[hsl(var(--destructive))] rounded-lg hover:bg-[hsl(var(--secondary))]">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-3 py-2 text-sm rounded-lg hover:bg-[hsl(var(--secondary))]" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                    <Link href="/register" className="block px-3 py-2 text-sm font-semibold text-center rounded-xl bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white mt-2" onClick={() => setMobileOpen(false)}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navbar;
