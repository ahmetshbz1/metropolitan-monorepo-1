"use client";

import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait for auth store to hydrate
    if (!_hasHydrated) return;

    // If user is already authenticated, redirect to home
    if (user && accessToken) {
      router.replace("/");
      return;
    }

    // Auth check complete, allow rendering
    setChecking(false);
  }, [user, accessToken, _hasHydrated, router]);

  // Show nothing while hydrating, checking auth or redirecting
  if (!_hasHydrated || checking || (user && accessToken)) {
    return null;
  }

  return <>{children}</>;
}
