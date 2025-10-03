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
  const { user, accessToken, loading } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait for auth store to load
    if (loading) return;

    // If user is already authenticated, redirect to home
    if (user && accessToken) {
      router.replace("/");
      return;
    }

    // Auth check complete, allow rendering
    setChecking(false);
  }, [user, accessToken, loading, router]);

  // Show nothing while checking auth or redirecting
  if (loading || checking || (user && accessToken)) {
    return null;
  }

  return <>{children}</>;
}
