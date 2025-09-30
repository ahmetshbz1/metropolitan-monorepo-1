//  "useNotifications.ts"
//  metropolitan app
//  Created by Ahmet on 19.06.2025.

import { useHaptics } from "@/hooks/useHaptics";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import {
  Notification,
  UseNotificationsReturn,
} from "@/types/notifications.types";
import { getUnreadCount } from "@/utils/notifications.utils";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "@/core/api";

export function useNotifications(): UseNotificationsReturn {
  const { t } = useTranslation();
  const { triggerHaptic } = useHaptics();
  const {
    dialogState: deleteDialogState,
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    handleConfirm: handleDeleteConfirm
  } = useConfirmationDialog();
  const {
    dialogState: deleteAllDialogState,
    showDialog: showDeleteAllDialog,
    hideDialog: hideDeleteAllDialog,
    handleConfirm: handleDeleteAllConfirm
  } = useConfirmationDialog();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Okunmamış bildirim sayısı
  const unreadCount = getUnreadCount(notifications);

  // Bildirimleri API'den çek
  const fetchNotifications = useCallback(async () => {
    try {
      // Removed console statement
      const response = await api.get("/users/notifications");
      // Removed console statement
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        // Removed console statement
        setNotifications([]);
      }
    } catch (error: any) {
      // Removed console statement
      // Removed console statement
      // Removed console statement
      // Removed console statement);
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
      // Removed console statement
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
      // Removed console statement
    }
  };

  // Tekil bildirim silme fonksiyonu
  const deleteNotification = (notificationId: string) => {
    showDeleteDialog({
      title: t("notifications.delete_confirm_title"),
      message: t("notifications.delete_confirm_message"),
      icon: "trash-outline",
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        triggerHaptic();
        try {
          await api.delete(`/users/notifications/${notificationId}`);
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );
        } catch (error) {
          // Removed console statement
        }
      },
    });
  };

  // Tüm bildirimleri sil
  const deleteAllNotifications = () => {
    triggerHaptic();
    showDeleteAllDialog({
      title: t("notifications.delete_all_confirm_title"),
      message: t("notifications.delete_all_confirm_message"),
      icon: "trash-outline",
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete("/users/notifications");
          setNotifications([]);
        } catch (error) {
          // Removed console statement
        }
      },
    });
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
    deleteDialogState,
    hideDeleteDialog,
    handleDeleteConfirm,
    deleteAllDialogState,
    hideDeleteAllDialog,
    handleDeleteAllConfirm,
  };
}
