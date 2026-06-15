"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import {
  Clock, Search, Menu, X, Moon, Sun, User, LogOut, LayoutDashboard, Building2,
  ChevronDown,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/search", label: "Explore", isAnchor: false },
  { href: "/search?type=hotel", label: "Hotels", isAnchor: false },
  { href: "/search?type=coworking", label: "Workspaces", isAnchor: false },
  { href: "/search?type=nap_pod", label: "Rest Pods", isAnchor: false },
  { href: "#how-it-works", label: "How It Works", isAnchor: true },
  { href: "#host-marketplace", label: "For Hosts", isAnchor: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    if (href === "/search" && pathname === "/search") return true;
    if (href.includes("?") && pathname === "/search") {
      const type = new URL(href, "http://x").searchParams.get("type");
      return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("type") === type;
    }
    return false;
  };

  const handleNavClick = (href: string, isAnchor: boolean) => {
    if (isAnchor && pathname === "/") {
      setMobileOpen(false);
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      setMobileOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[hsl(var(--card)/0.55)] backdrop-blur-3xl border-b border-[hsl(var(--border)/0.3)] shadow-[0_4px_30px_-4px_rgba(0,0,0,0.2)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] shadow-lg shadow-[#22D3EE]/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[#22D3EE]/30">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              REST<span className="gradient-text-brand">IGO</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((item) => {
              const active = isActive(item.href);
              const LinkOrAnchor = item.isAnchor ? 'a' : Link;
              return (
                <LinkOrAnchor
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => handleNavClick(item.href, item.isAnchor)}
                  className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? "text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  } hover:bg-[hsl(var(--secondary)/0.6)]`}
                >
                  {item.label}
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </LinkOrAnchor>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.6)] transition-all duration-200"
                aria-label="Toggle theme"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </motion.div>
              </button>
            )}

            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-1">
                <Link
                  href={user?.role === 'provider' ? '/dashboard/provider' : user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-[hsl(var(--secondary)/0.6)] transition-all duration-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="relative group px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-white shadow-lg shadow-[#22D3EE]/20 hover:shadow-[#22D3EE]/40 transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--secondary)/0.6)] transition-all duration-200"
              aria-label="Toggle menu"
            >
              <motion.div
                key={mobileOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
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
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden bg-[hsl(var(--card)/0.9)] backdrop-blur-3xl border-t border-[hsl(var(--border)/0.3)] max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((item) => {
                const LinkOrAnchor = item.isAnchor ? 'a' : Link;
                return (
                  <LinkOrAnchor
                    key={item.href + item.label}
                    href={item.href}
                    className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-[hsl(var(--secondary)/0.6)] transition-all duration-200"
                    onClick={() => handleNavClick(item.href, item.isAnchor)}
                  >
                    {item.label}
                  </LinkOrAnchor>
                );
              })}
              <div className="border-t border-[hsl(var(--border)/0.3)] pt-3 mt-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard/user" className="block px-4 py-3 text-sm rounded-xl hover:bg-[hsl(var(--secondary)/0.6)] transition-all duration-200" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-[hsl(var(--destructive))] rounded-xl hover:bg-[hsl(var(--secondary)/0.6)] transition-all duration-200">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-3 text-sm rounded-xl hover:bg-[hsl(var(--secondary)/0.6)] transition-all duration-200" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                    <Link href="/register" className="block px-4 py-3 text-sm font-semibold text-center rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-white mt-2" onClick={() => setMobileOpen(false)}>
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
