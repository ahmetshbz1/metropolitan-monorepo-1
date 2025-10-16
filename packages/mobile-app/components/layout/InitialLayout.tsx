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

  // Push notification başlatma kontrolü - sadece bir kez çalışmalı
  const notificationInitializedRef = React.useRef(false);

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

  // Notification data'sından navigasyon yap
  const navigateFromNotification = useCallback((
    data: { screen?: string; orderId?: string; productId?: string }
  ) => {
    if (!data?.screen) return;

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
          break;
      }
    } catch (error) {
      console.error('Push notification yönlendirme hatası:', error);
    }
  }, []);

  // Push notifications'ı başlat
  useEffect(() => {
    // Eğer zaten başlatıldıysa, tekrar çalıştırma
    if (notificationInitializedRef.current) {
      return;
    }

    const initializePushNotifications = async () => {
      // ADIM 1: Cold start notification'ı kontrol et ve işle
      // Bu metod global singleton içinde kontrolü yapıyor, tekrar çağrılsa bile sadece bir kez işliyor
      const coldStartResult = await NotificationService.processColdStartNotification();

      if (coldStartResult.hasNotification && coldStartResult.data) {
        // Badge sayısını güncelle
        refreshUnreadCount();

        // Router hazır olana kadar bekle ve navigate et
        setTimeout(() => {
          navigateFromNotification(coldStartResult.data as {
            screen?: string;
            orderId?: string;
            productId?: string;
          });
        }, 500);
      }

      // ADIM 2: Listener'ları kur
      // NotificationService singleton içinde zaten kurulu mu kontrolü yapıyor
      // Cold start notification zaten işlenmiş ve dismiss edilmiş olduğundan
      // listener'a tekrar gönderilmeyecek
      NotificationService.setupNotificationListeners(
        () => {
          // Bildirim alındığında - badge sayısını güncelle
          refreshUnreadCount();
        },
        (response) => {
          // Bildirime tıklandığında (app açıkken veya background'da)
          const data = response.notification.request.content.data as {
            screen?: string;
            orderId?: string;
            productId?: string;
          };

          // Badge sayısını güncelle
          refreshUnreadCount();

          // Yönlendirme yap
          // NotificationService içinde zaten duplicate kontrolü var
          navigateFromNotification(data);
        }
      );
    };

    // Uygulama başladığında notification'ları başlat
    if (loaded) {
      notificationInitializedRef.current = true;
      initializePushNotifications();
    }

    // Cleanup
    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, [loaded, refreshUnreadCount, navigateFromNotification]);

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
