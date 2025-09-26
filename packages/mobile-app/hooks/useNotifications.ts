//  "useNotifications.ts"
//  metropolitan app
//  Created by Ahmet on 19.06.2025.

import { useHaptics } from "@/hooks/useHaptics";
import {
  Notification,
  UseNotificationsReturn,
} from "@/types/notifications.types";
import { getUnreadCount } from "@/utils/notifications.utils";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import api from "@/core/api";

export function useNotifications(): UseNotificationsReturn {
  const { t } = useTranslation();
  const { triggerHaptic } = useHaptics();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Okunmamış bildirim sayısı
  const unreadCount = getUnreadCount(notifications);

  // Bildirimleri API'den çek
  const fetchNotifications = useCallback(async () => {
    try {
      console.log("📡 Fetching notifications from /users/notifications");
      const response = await api.get("/users/notifications");
      console.log("✅ Notifications response:", response.data);
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        console.error("❌ API returned success: false", response.data);
        setNotifications([]);
      }
    } catch (error: any) {
      console.error("❌ Bildirimler yüklenemedi:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Full error:", JSON.stringify(error, null, 2));
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Component mount olduğunda bildirimleri çek
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Bildirimi okundu olarak işaretle
  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/users/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Bildirim okundu işaretlenemedi:", error);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    triggerHaptic();
    try {
      await api.put("/users/notifications/mark-all-read");
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Tüm bildirimler okundu işaretlenemedi:", error);
    }
  };

  // Tekil bildirim silme fonksiyonu
  const deleteNotification = (notificationId: string) => {
    Alert.alert(
      t("notifications.delete_confirm_title"),
      t("notifications.delete_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            triggerHaptic();
            try {
              await api.delete(`/users/notifications/${notificationId}`);
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
              );
            } catch (error) {
              console.error("Bildirim silinemedi:", error);
            }
          },
        },
      ]
    );
  };

  // Tüm bildirimleri sil
  const deleteAllNotifications = () => {
    triggerHaptic();
    Alert.alert(
      t("notifications.delete_all_confirm_title"),
      t("notifications.delete_all_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/users/notifications");
              setNotifications([]);
            } catch (error) {
              console.error("Bildirimler silinemedi:", error);
            }
          },
        },
      ]
    );
  };

  // Bildirime tıklama işlemi
  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Eğer data.screen varsa o sayfaya yönlendir
    if (notification.data && typeof notification.data === 'object' && 'screen' in notification.data) {
      const screen = (notification.data as any).screen;
      if (screen) {
        router.push(screen);
      }
    }
  };

  // Yenileme işlemi
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  return {
    notifications,
    setNotifications,
    isLoading,
    refreshing,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    handleNotificationPress,
    onRefresh,
  };
}
