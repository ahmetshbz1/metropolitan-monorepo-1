//  "notifications.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.
//  Rebuilt from scratch for stability

import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import api from "@/core/api";
import { useTheme } from "@/hooks/useTheme";
import type { Notification } from "@/types/notifications.types";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isGuest, guestId } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const { refreshUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Başlığı ayarla
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("notifications.title"),
    });
  }, [navigation, t]);

  // Bildirimleri getir - sadece mount'ta bir kez
  const loadNotifications = async () => {
    try {
      // Guest kullanıcılar için farklı endpoint
      const endpoint =
        isGuest && guestId
          ? `/guest/notifications/${guestId}`
          : "/users/notifications";

      const response = await api.get(endpoint);
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error("Bildirimler yüklenemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Component mount olduğunda çalış
  useEffect(() => {
    loadNotifications();
    // Sayfa açıldığında badge'i güncelle
    refreshUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bildirime tıklandığında çalışır
  const handleNotificationPress = async (notification: Notification) => {
    // Önce okundu işaretle
    if (!isGuest) {
      try {
        await api.put(`/users/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        refreshUnreadCount();
      } catch (error) {
        console.error("Bildirim okundu işaretlenemedi:", error);
      }
    }

    // Yönlendirme yap (eğer data.screen varsa)
    if (notification.data && typeof notification.data === 'object') {
      const data = notification.data as { screen?: string; orderId?: string; productId?: string };

      if (data.screen) {
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
          console.error('Yönlendirme hatası:', error);
        }
      }
    }
  };

  // Bildirimi sil
  const deleteNotification = async (notificationId: string) => {
    // Guest kullanıcılar bildirim silemez
    if (isGuest) return;

    try {
      await api.delete(`/users/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      // Badge sayısını güncelle
      refreshUnreadCount();
    } catch (error) {
      console.error("Bildirim silinemedi:", error);
    }
  };

  // Bildirim öğesi render
  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      item={item}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => deleteNotification(item.id)}
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </ThemedView>
    );
  }

  // Empty state
  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-8">
      <ThemedText className="text-lg font-semibold mb-2 text-center">
        {t("notifications.empty_title")}
      </ThemedText>
      <ThemedText className="text-center opacity-60">
        {t("notifications.empty_message")}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}
