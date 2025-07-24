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

    // Kullanıcı giriş yapmışsa ama auth grubundaysa → tabs'a git
    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
    // Kullanıcı yoksa ama tabs grubundaysa → auth'a git
    else if (!user && !isGuest && inTabsGroup) {
      router.replace("/(auth)");
    }
    // Kullanıcı yoksa ve auth grubunda da değilse → auth'a git
    else if (!user && !isGuest && !inAuthGroup) {
      router.replace("/(auth)");
    }
  }, [user, isGuest, loading, segments, router]);

  return {
    user,
    isGuest,
    loading,
    segments,
  };
};
