//  "InitialLayout.tsx"
//  metropolitan app
//  Created by Ahmet on 11.06.2025. Updated on 21.07.2025.

import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import NotificationService from "@/core/firebase/notifications/notificationService";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { router } from "expo-router";
import * as Notifications from 'expo-notifications';
import { EventEmitter, AppEvent } from "@/utils/eventEmitter";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

import { NavigationStack } from "./NavigationStack";

export const InitialLayout: React.FC = () => {
  const [loaded, error] = useFonts({
    // ... add your fonts here
  });
  const colorScheme = useColorScheme();
  const { i18n, t } = useTranslation();
  const { isAuthenticated, isGuest, logout } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const [sessionExpired, setSessionExpired] = useState(false);

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

  useEffect(() => {
    const checkForUpdates = async () => {
      if (!__DEV__ && Updates.isEnabled) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (error) {
          console.log("Update check failed:", error);
        }
      }
    };

    if (loaded) {
      checkForUpdates();
    }
  }, [loaded]);

  // Push notifications'ı başlat - Custom permission ekranı gösterilmişse
  useEffect(() => {
    const initializePushNotifications = async () => {
      // Notification listener'ları kur (token zaten alınmış olabilir)
      NotificationService.setupNotificationListeners(
        (notification) => {
          // Bildirim alındığında - badge sayısını güncelle
          console.log("🔔 [InitialLayout] Notification received, refreshing count");
          refreshUnreadCount();
        },
        (response) => {
          // Bildirime tıklandığında
          const data = response.notification.request.content.data;

          // Badge sayısını güncelle
          refreshUnreadCount();

          // Eğer bildirimde yönlendirme bilgisi varsa
          if (data?.screen) {
            const targetScreen = data.screen;
            const now = Date.now();

            // Son 2 saniye içinde aynı sayfaya navigasyon yapıldıysa ignore et
            if (lastNavigationRef.current &&
                lastNavigationRef.current.screen === targetScreen &&
                (now - lastNavigationRef.current.time) < 2000) {
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
  }, [loaded, refreshUnreadCount]);

  // Session expired listener
  useEffect(() => {
    const handleSessionExpired = () => {
      if (isGuest) {
        logout();
        return;
      }

      setSessionExpired(true);
    };

    const subscription = EventEmitter.addListener(AppEvent.SESSION_EXPIRED, handleSessionExpired);

    return () => {
      subscription.remove();
    };
  }, [isGuest, logout]);

  // Handle session expired dialog login action
  const handleSessionExpiredLogin = async () => {
    // Hide dialog first
    setSessionExpired(false);

    // Logout (clears all auth data and updates context state)
    await logout();

    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      // Navigate to auth index (main login screen with all options)
      router.replace("/(auth)");
    }, 100);
  };

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

      {/* Session Expired Dialog */}
      <ConfirmationDialog
        visible={sessionExpired}
        title={t("auth.session_expired_title")}
        message={t("auth.session_expired_description")}
        icon="lock-closed-outline"
        confirmText={t("auth.login_again")}
        singleButton
        onConfirm={handleSessionExpiredLogin}
      />
    </View>
  );
};
