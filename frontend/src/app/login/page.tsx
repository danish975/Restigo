"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { Clock, Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/search");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[hsl(224,32%,8%)] to-[hsl(224,28%,15%)] items-center justify-center p-12">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(174,72%,46%,0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(174,72%,46%,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(174,72%,46%)] opacity-[0.08] blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-[hsl(253,63%,58%)] opacity-[0.08] blur-[100px]" />
        <div className="relative text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)]">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <span className="text-4xl font-bold text-white">REST<span className="gradient-text">IGO</span></span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">Welcome Back</h2>
          <p className="text-white/60 max-w-sm">Book hotels, workspaces, and rest pods by the hour. AI-optimized for the best experience.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)]">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">REST<span className="gradient-text">IGO</span></span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Sign in to your account</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[hsl(var(--primary))] font-medium hover:underline">Create one</Link>
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white font-semibold shadow-lg shadow-[hsl(174,72%,46%)]/20 hover:shadow-[hsl(174,72%,46%)]/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[hsl(var(--border))]" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]">Or continue with</span></div>
          </div>

          <button 
            onClick={() => window.location.href = "http://localhost:5000/api/v1/auth/google"}
            className="mt-6 w-full py-3 rounded-xl border border-[hsl(var(--border))] font-medium hover:bg-[hsl(var(--secondary))] transition-colors flex items-center justify-center gap-3 text-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </motion.div>
      </div>
    </div>
  );
}
