import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)]">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">REST<span className="gradient-text">IGO</span></span>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              AI-powered hourly booking platform for hotels, workspaces, rest pods, and flexible hospitality spaces.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              {[
                { label: "Search Spaces", href: "/search" },
                { label: "Hotels", href: "/search?type=hotel" },
                { label: "Coworking", href: "/search?type=coworking" },
                { label: "Rest Pods", href: "/search?type=nap_pod" },
                { label: "Meeting Rooms", href: "/search?type=meeting_room" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              {["About Us", "Careers", "Press", "Blog", "Partners"].map((label) => (
                <li key={label}>
                  <Link href="#" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[hsl(var(--primary))]" /> hello@restigo.app</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[hsl(var(--primary))]" /> +91 800 RESTIGO</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[hsl(var(--primary))]" /> Mumbai, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">© {new Date().getFullYear()} RESTIGO. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-[hsl(var(--muted-foreground))]">
            <Link href="#" className="hover:text-[hsl(var(--foreground))]">Privacy</Link>
            <Link href="#" className="hover:text-[hsl(var(--foreground))]">Terms</Link>
            <Link href="#" className="hover:text-[hsl(var(--foreground))]">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
