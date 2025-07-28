//  "index.tsx"
//  metropolitan app
//  Created by Ahmet on 21.07.2025.

import { Redirect, Stack } from "expo-router";
import React from "react";

import { SplashScreen } from "@/components/screens/SplashScreen";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  // Auth yükleniyor ise splash screen göster
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SplashScreen />
      </>
    );
  }

  // Kullanıcı giriş yapmışsa ana sayfaya yönlendir
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // Misafir ya da hiç giriş yapmamışsa auth'a yönlendir
  return <Redirect href="/(auth)" />;
}
