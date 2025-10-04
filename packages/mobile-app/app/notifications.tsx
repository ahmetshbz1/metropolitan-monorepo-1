//  "notifications.tsx"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.
//  Rebuilt from scratch for stability

import { useNavigation } from "expo-router";
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
import api from "@/core/api";
import { useTheme } from "@/hooks/useTheme";
import type { Notification } from "@/types/notifications.types";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isGuest, guestId } = useAuth();
  const navigation = useNavigation();

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
  }, []);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  }, []);

  // Bildirimi okundu işaretle
  const markAsRead = async (notificationId: string) => {
    // Guest kullanıcılar bildirim okuyamaz (sadece görüntüler)
    if (isGuest) return;

    try {
      await api.put(`/users/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Bildirim okundu işaretlenemedi:", error);
    }
  };

  // Bildirimi sil
  const deleteNotification = async (notificationId: string) => {
    // Guest kullanıcılar bildirim silemez
    if (isGuest) return;

    try {
      await api.delete(`/users/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Bildirim silinemedi:", error);
    }
  };

  // Bildirim öğesi render
  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      item={item}
      onPress={() => markAsRead(item.id)}
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
