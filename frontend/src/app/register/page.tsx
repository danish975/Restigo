"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { Clock, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "user" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      router.push("/search");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[hsl(224,32%,8%)] to-[hsl(224,28%,15%)] items-center justify-center p-12">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(253,63%,58%,0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(253,63%,58%,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(253,63%,58%)] opacity-[0.08] blur-[100px]" />
        <div className="relative text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)]">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <span className="text-4xl font-bold text-white">REST<span className="gradient-text">IGO</span></span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">Join RESTIGO</h2>
          <p className="text-white/60 max-w-sm">Create an account to start booking flexible spaces or list your property.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)]">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">REST<span className="gradient-text">IGO</span></span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">Sign in</Link>
          </p>

          {/* Role selector */}
          <div className="flex gap-2 mb-6">
            {[
              { value: "user", label: "I want to book" },
              { value: "provider", label: "I want to list" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update("role", option.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  form.role === option.value
                    ? "bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white shadow-lg"
                    : "bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))] text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" className="block text-sm font-medium mb-1.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input id="reg-first" type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required placeholder="John" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="reg-last" className="block text-sm font-medium mb-1.5">Last Name</label>
                <input id="reg-last" type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required placeholder="Doe" className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input id="reg-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="you@example.com" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium mb-1.5">Phone <span className="text-[hsl(var(--muted-foreground))]">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input id="reg-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input id="reg-password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} placeholder="Min 8 characters" className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white font-semibold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-xs text-center text-[hsl(var(--muted-foreground))] mt-6">
            By creating an account, you agree to our <Link href="#" className="text-[hsl(var(--primary))]">Terms</Link> and <Link href="#" className="text-[hsl(var(--primary))]">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
