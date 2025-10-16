//  "notifications.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.
//  Rebuilt from scratch for stability

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  TouchableOpacity,
  Animated,
  SectionList,
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
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Debounce mekanizması için - double-tap önleme
  const isNavigatingRef = useRef(false);

  // Bildirimleri tarihe göre grupla
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.createdAt);
      let groupKey: string;

      if (notifDate.toDateString() === today.toDateString()) {
        groupKey = t("common.today");
      } else if (notifDate.toDateString() === yesterday.toDateString()) {
        groupKey = t("common.yesterday");
      } else {
        // Tarihi formatla
        groupKey = notifDate.toLocaleDateString(t("common.locale"), {
          day: "numeric",
          month: "long",
          year: notifDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    // Section listesi için formatla
    return Object.keys(groups).map((key) => ({
      title: key,
      data: groups[key],
    }));
  }, [notifications, t]);

  // Başlığı ayarla - sağ üstte tümünü okundu işaretle butonu ekle
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("notifications.title"),
      headerRight: () => {
        const hasUnread = notifications.some((n) => !n.isRead);
        if (!hasUnread || isGuest) return null;

        return (
          <TouchableOpacity
            onPress={markAllAsRead}
            className="mr-4"
          >
            <Ionicons
              name="checkmark-done-outline"
              size={24}
              color={colors.tint}
            />
          </TouchableOpacity>
        );
      },
    });
  }, [navigation, t, notifications, colors.tint, isGuest]);

  // Tümünü okundu işaretle
  const markAllAsRead = async () => {
    if (isGuest) return;

    try {
      await api.put("/users/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      refreshUnreadCount();
    } catch (error) {
      console.error("Tümü okundu işaretlenemedi:", error);
    }
  };

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

        // Fade in animasyonu
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
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
    // Double-tap kontrolü - zaten navigasyon yapılıyorsa çık
    if (isNavigatingRef.current) {
      console.log('Double-tap prevented - already navigating');
      return;
    }

    // Navigasyon başladı
    isNavigatingRef.current = true;

    // 1 saniye sonra flag'i reset et
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);

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

  // Skeleton loading için sahte veri
  const SkeletonItem = () => (
    <View className="mb-3">
      <ThemedView
        className="p-4 rounded-2xl flex-row items-start"
        lightColor="#f5f5f5"
        darkColor="#1a1a1a"
      >
        <View className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-3 mt-0.5" />
        <View className="flex-1">
          <View className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-3/4" />
          <View className="h-3 bg-gray-200 dark:bg-gray-800 rounded mb-1 w-full" />
          <View className="h-3 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-5/6" />
          <View className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        </View>
      </ThemedView>
    </View>
  );

  // Loading state - skeleton loading
  if (isLoading) {
    return (
      <ThemedView className="flex-1">
        <View className="px-4 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonItem key={i} />
          ))}
        </View>
      </ThemedView>
    );
  }

  // Empty state - daha güzel tasarım
  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-6 p-6 rounded-full bg-gray-100 dark:bg-gray-800">
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={colors.text + "40"}
        />
      </View>
      <ThemedText className="text-xl font-bold mb-2 text-center">
        {t("notifications.empty_title")}
      </ThemedText>
      <ThemedText className="text-center opacity-60 text-base">
        {t("notifications.empty_message")}
      </ThemedText>
    </View>
  );

  // Section başlığı render
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View className="px-4 py-2 mb-2">
      <ThemedText className="font-semibold text-sm opacity-70 uppercase tracking-wider">
        {section.title}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView className="flex-1">
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {notifications.length === 0 ? (
          renderEmpty()
        ) : (
          <SectionList
            sections={groupedNotifications}
            renderItem={({ item }) => (
              <View className="px-4">
                <NotificationItem
                  item={item}
                  onPress={() => handleNotificationPress(item)}
                  onDelete={() => deleteNotification(item.id)}
                />
              </View>
            )}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: 16,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.tint}
                title={t("common.pull_to_refresh")}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </ThemedView>
  );
}
