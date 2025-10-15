//  "InitialLayout.tsx"
//  metropolitan app
//  Created by Ahmet on 11.06.2025. Updated on 21.07.2025.

import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import NotificationService from "@/core/firebase/notifications/notificationService";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useProducts } from "@/context/ProductContext";
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
  const { fetchAllProducts, fetchCategories } = useProducts();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isProductsReady, setIsProductsReady] = useState(false);

  // Push notification navigasyon kontrolü için
  const lastNavigationRef = React.useRef<{ screen: string; time: number } | null>(null);
  const processedNotificationIds = React.useRef<Set<string>>(new Set());

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Splash screen sırasında ürünleri çek
  useEffect(() => {
    const loadInitialData = async () => {
      if (loaded) {
        try {
          // Ürünleri ve kategorileri paralel çek
          await Promise.all([
            fetchAllProducts(),
            fetchCategories()
          ]);
          setIsProductsReady(true);
        } catch (error) {
          console.error("Failed to load initial data:", error);
          // Hata olsa bile splash screen'i gizle
          setIsProductsReady(true);
        }
      }
    };

    loadInitialData();
  }, [loaded, fetchAllProducts, fetchCategories]);

  // Hem fontlar hem de ürünler hazır olduğunda splash screen'i gizle
  useEffect(() => {
    if (loaded && isProductsReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isProductsReady]);

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

  // Notification'dan sayfaya yönlendirme yap
  const handleNotificationNavigation = useCallback((
    notificationId: string,
    data: { screen?: string; orderId?: string; productId?: string }
  ) => {
    if (!data?.screen) return;

    // Bu notification'ı daha önce işledik mi?
    if (processedNotificationIds.current.has(notificationId)) {
      console.log('🔔 [InitialLayout] Duplicate notification ignored:', notificationId);
      return;
    }

    // Notification'ı işlenmiş olarak kaydet
    processedNotificationIds.current.add(notificationId);

    const now = Date.now();
    const targetScreen = data.screen;

    // Son 2 saniye içinde aynı sayfaya navigasyon yapıldıysa ignore et
    if (lastNavigationRef.current &&
        lastNavigationRef.current.screen === targetScreen &&
        (now - lastNavigationRef.current.time) < 2000) {
      return;
    }

    // Navigasyon bilgisini kaydet
    lastNavigationRef.current = { screen: targetScreen, time: now };

    // Navigasyon yap
    try {
      switch (data.screen) {
        case 'orders':
          router.push('/(tabs)/orders');
          break;
        case 'order-detail':
          if (data.orderId) {
            router.push(`/order/${data.orderId}`);
          } else {
            router.push('/(tabs)/orders');
          }
          break;
        case 'product-detail':
          if (data.productId) {
            router.push(`/product/${data.productId}`);
          } else {
            router.push('/(tabs)/products');
          }
          break;
        case 'products':
          router.push('/(tabs)/products');
          break;
        case 'cart':
          router.push('/(tabs)/cart');
          break;
        case 'profile':
          router.push('/(tabs)/profile');
          break;
        case 'favorites':
          router.push('/favorites');
          break;
        default:
          console.log('Bilinmeyen ekran:', data.screen);
      }
    } catch (error) {
      console.error('Push notification yönlendirme hatası:', error);
    }
  }, []);

  // Push notifications'ı başlat - Custom permission ekranı gösterilmişse
  useEffect(() => {
    const initializePushNotifications = async () => {
      // App kapalıyken gelen notification'ı kontrol et (cold start)
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastNotificationResponse) {
        const notificationId = lastNotificationResponse.notification.request.identifier;
        const data = lastNotificationResponse.notification.request.content.data as {
          screen?: string;
          orderId?: string;
          productId?: string;
        };

        console.log('🔔 [InitialLayout] Cold start notification:', notificationId, data);

        // Badge sayısını güncelle
        refreshUnreadCount();

        // Yönlendirme yap
        if (data?.screen) {
          // Router hazır olana kadar bekle
          setTimeout(() => {
            handleNotificationNavigation(notificationId, data);
          }, 500);
        }
      }

      // Notification listener'ları kur (app açıkken gelen notification'lar için)
      NotificationService.setupNotificationListeners(
        (notification) => {
          // Bildirim alındığında - badge sayısını güncelle
          console.log("🔔 [InitialLayout] Notification received, refreshing count");
          refreshUnreadCount();
        },
        (response) => {
          // Bildirime tıklandığında (app açıkken)
          const notificationId = response.notification.request.identifier;
          const data = response.notification.request.content.data as {
            screen?: string;
            orderId?: string;
            productId?: string;
          };

          console.log('🔔 [InitialLayout] Notification tapped while app open:', notificationId, data);

          // Badge sayısını güncelle
          refreshUnreadCount();

          // Yönlendirme yap
          handleNotificationNavigation(notificationId, data);
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
  }, [loaded, refreshUnreadCount, handleNotificationNavigation]);

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
