//  "InitialLayout.tsx"
//  metropolitan app
//  Created by Ahmet on 11.06.2025. Updated on 21.07.2025.

import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import NotificationService from "@/core/firebase/notifications/notificationService";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import * as Notifications from 'expo-notifications';

import { NavigationStack } from "./NavigationStack";

export const InitialLayout: React.FC = () => {
  const [loaded, error] = useFonts({
    // ... add your fonts here
  });
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  // Push notification navigasyon kontrolü için
  const lastNavigationRef = React.useRef<{ screen: string; time: number } | null>(null);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Push notifications'ı başlat - Custom permission ekranı gösterilmişse
  useEffect(() => {
    const initializePushNotifications = async () => {
      // Notification listener'ları kur (token zaten alınmış olabilir)
      NotificationService.setupNotificationListeners(
        (notification) => {
          // Bildirim alındığında
          // Removed console statement
        },
        (response) => {
          // Bildirime tıklandığında
          // Removed console statement
          const data = response.notification.request.content.data;

          // Eğer bildirimde yönlendirme bilgisi varsa
          if (data?.screen) {
            const targetScreen = data.screen;
            const now = Date.now();

            // Son 2 saniye içinde aynı sayfaya navigasyon yapıldıysa ignore et
            if (lastNavigationRef.current &&
                lastNavigationRef.current.screen === targetScreen &&
                (now - lastNavigationRef.current.time) < 2000) {
              // Removed console statement kısa süre önce navigasyon yapıldı, ignore ediliyor`);
              return;
            }

            // Navigasyon bilgisini kaydet
            lastNavigationRef.current = { screen: targetScreen, time: now };

            // Navigasyon yap
            router.push(targetScreen);
          }
        }
      );
    };

    // Uygulama başladığında notification'ları başlat
    if (loaded) {
      initializePushNotifications();
    }

    // Cleanup
    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, [loaded]);

  // Font yüklenmemiş ise null döndür (Expo splash screen görünür)
  if (!loaded) {
    return null;
  }

  return (
    <View
      className={colorScheme === "dark" ? "flex-1 dark vars" : "flex-1 vars"}
      style={{ flex: 1 }}
    >
      <NavigationStack key={i18n.language} />
    </View>
  );
};
