//  "useAppNavigation.ts"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export const useAppNavigation = () => {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Auth state yüklenene kadar bekle
    if (loading) {
      return;
    }

    // Expo Router'ın segmentleri yüklemesini bekle
    if (segments.length === 0) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const currentRoute = segments[0];

    // Public routes that don't require auth
    const publicRoutes = ["legal-webview", "terms"];
    const isPublicRoute = publicRoutes.includes(currentRoute);

    // Authenticated user routes (standalone pages outside tabs/auth groups)
    const authenticatedRoutes = [
      "notifications",
      "favorites",
      "addresses",
      "add-address",
      "edit-address",
      "edit-profile",
      "help-center",
      "faq",
      "order",
      "tracking",
      "invoice-preview",
      "checkout",
      "account-settings",
      "product",
    ];
    const isAuthenticatedRoute = authenticatedRoutes.some(
      (route) => currentRoute === route || currentRoute?.startsWith(route)
    );

    // Kullanıcı giriş yapmışsa ama auth grubundaysa → tabs'a git
    if (user && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }

    // Kullanıcı varsa (authenticated veya guest) ve authenticated route'daysa → izinli
    if ((user || isGuest) && isAuthenticatedRoute) {
      return;
    }

    // Kullanıcı varsa (authenticated veya guest) ve tabs grubundaysa → izinli
    if ((user || isGuest) && inTabsGroup) {
      return;
    }

    // Kullanıcı yoksa ama tabs grubundaysa → auth'a git
    if (!user && !isGuest && inTabsGroup) {
      router.replace("/(auth)");
      return;
    }

    // Kullanıcı yoksa ama authenticated route'daysa → auth'a git
    if (!user && !isGuest && isAuthenticatedRoute) {
      router.replace("/(auth)");
      return;
    }

    // Kullanıcı yoksa ve auth grubunda da değilse ve public route değilse → auth'a git
    if (!user && !isGuest && !inAuthGroup && !isPublicRoute) {
      router.replace("/(auth)");
      return;
    }
  }, [user, isGuest, loading, segments, router]);

  return {
    user,
    isGuest,
    loading,
    segments,
  };
};
