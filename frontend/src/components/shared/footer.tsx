"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone, ArrowRight, Globe, MessageCircle, Camera, Play } from "lucide-react";

const FOOTER_LINKS = {
  Products: [
    { label: "Hotels", href: "/search?type=hotel" },
    { label: "Workspaces", href: "/search?type=coworking" },
    { label: "Rest Pods", href: "/search?type=nap_pod" },
    { label: "Lounges", href: "/search?type=lounge" },
    { label: "Meeting Rooms", href: "/search?type=meeting_room" },
    { label: "Capsule Hotels", href: "/search?type=capsule_hotel" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Partners", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Resources: [
    { label: "Help Center", href: "#" },
    { label: "API Documentation", href: "#" },
    { label: "Community", href: "#" },
    { label: "Status Page", href: "#" },
    { label: "For Hosts", href: "#host-marketplace" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Refund Policy", href: "#" },
    { label: "Accessibility", href: "#" },
  ],
};

const SOCIAL_LINKS = [
  { icon: Globe, href: "#", label: "Twitter" },
  { icon: MessageCircle, href: "#", label: "LinkedIn" },
  { icon: Camera, href: "#", label: "Instagram" },
  { icon: Play, href: "#", label: "YouTube" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[hsl(var(--background)/0.5)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        <div className="mb-16 pb-12 border-b border-[hsl(var(--border)/0.5)]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-md">
              <h3 className="text-xl font-bold mb-2">
                Stay ahead of the curve
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                Get exclusive deals, new space alerts, and travel tips delivered to your inbox.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto gap-3">
              <div className="relative flex-1 lg:w-80">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.6)] outline-none focus:border-[#22D3EE]/50 focus:ring-2 focus:ring-[#22D3EE]/20 transition-all"
                  id="footer-newsletter-email"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#22D3EE]/20 transition-all duration-300 hover:scale-105 flex items-center gap-2 shrink-0"
                id="footer-newsletter-submit"
              >
                {subscribed ? (
                  "Subscribed ✓"
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6]">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">REST<span className="gradient-text-brand">IGO</span></span>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed max-w-xs">
              The premium marketplace for hourly spaces. Book hotels, workspaces, rest pods, and more — by the hour, instantly.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border)/0.5)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] hover:border-[#22D3EE]/30 transition-all duration-200"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            {/* Contact */}
            <div className="space-y-2.5 text-sm text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#22D3EE]" /> hello@restigo.app</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#22D3EE]" /> +91 800 RESTIGO</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#22D3EE]" /> Mumbai, India</div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[hsl(var(--foreground)/0.8)]">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[#22D3EE] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[hsl(var(--border)/0.5)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} RESTIGO. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
            <Link href="#" className="hover:text-[#22D3EE] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#22D3EE] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#22D3EE] transition-colors">Cookies</Link>
            <Link href="#" className="hover:text-[#22D3EE] transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
