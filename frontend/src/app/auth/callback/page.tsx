"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Save the access token directly to localStorage as expected by the store
      localStorage.setItem("accessToken", token);
      
      // Fetch user profile to complete login
      loadUser().then(() => {
        router.push("/search");
      }).catch((err) => {
        console.error("Failed to fetch user after Google login", err);
        router.push("/login?error=auth_failed");
      });
    } else {
      router.push("/login?error=no_token");
    }
  }, [searchParams, router, loadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
        <p className="text-[hsl(var(--muted-foreground))]">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
