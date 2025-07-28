//  "useNotifications.ts"
//  metropolitan app
//  Created by Ahmet on 19.06.2025.

import { mockNotifications } from "@/constants/notifications.constants";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Notification,
  UseNotificationsReturn,
} from "@/types/notifications.types";
import { getUnreadCount } from "@/utils/notifications.utils";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export function useNotifications(): UseNotificationsReturn {
  const { t } = useTranslation();
  const { triggerHaptic } = useHaptics();

  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Okunmamış bildirim sayısı
  const unreadCount = getUnreadCount(notifications);

  // Bildirimi okundu olarak işaretle
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    triggerHaptic("success");
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
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
          onPress: () => {
            triggerHaptic("warning");
            setNotifications((prev) =>
              prev.filter((n) => n.id !== notificationId)
            );
          },
        },
      ]
    );
  };

  // Tüm bildirimleri sil
  const deleteAllNotifications = () => {
    triggerHaptic("warning");
    Alert.alert(
      t("notifications.delete_all_confirm_title"),
      t("notifications.delete_all_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            setNotifications([]);
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

    // Eğer actionUrl varsa o sayfaya yönlendir
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Yenileme işlemi
  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: API'den yeni bildirimler çek
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
