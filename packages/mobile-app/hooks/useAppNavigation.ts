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
    console.log("🧭 Navigation effect çalışıyor", {
      loading,
      user: !!user,
      isGuest,
      segments,
      segmentsLength: segments.length,
    });

    // Auth state yüklenene kadar bekle
    if (loading) {
      console.log("⏳ Auth hala yükleniyor, bekleniyor...");
      return;
    }

    // Expo Router'ın segmentleri yüklemesini bekle
    if (segments.length === 0) {
      console.log("📍 Segments henüz yüklenmedi, bekleniyor...");
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    
    console.log("🎯 Navigation karar veriliyor", {
      inAuthGroup,
      inTabsGroup,
      hasUser: !!user,
      isGuest,
    });

    // Kullanıcı giriş yapmışsa ama auth grubundaysa → tabs'a git
    if (user && inAuthGroup) {
      console.log("✅ User var ama auth grubunda → tabs'a yönlendiriliyor");
      router.replace("/(tabs)");
    }
    // Kullanıcı yoksa ama tabs grubundaysa → auth'a git  
    else if (!user && !isGuest && inTabsGroup) {
      console.log("🔐 User yok ama tabs grubunda → auth'a yönlendiriliyor");
      router.replace("/(auth)");
    }
    // Kullanıcı yoksa ve auth grubunda da değilse → auth'a git
    else if (!user && !isGuest && !inAuthGroup) {
      console.log("🔐 User yok, auth grubunda değil → auth'a yönlendiriliyor");
      router.replace("/(auth)");
    } else {
      console.log("🤷 Herhangi bir yönlendirme gerekli değil");
    }
  }, [user, isGuest, loading, segments, router]);

  return {
    user,
    isGuest,
    loading,
    segments,
  };
};
