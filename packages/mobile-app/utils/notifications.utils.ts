//  "notifications.utils.ts"
//  metropolitan app
//  Created by Ahmet on 08.07.2025.

import { notificationTypeConfig } from "@/constants/notifications.constants";
import { NotificationType } from "@/types/notifications.types";

// Bildirim tipine göre ikon belirleme
export const getNotificationIcon = (type: NotificationType): string => {
  return notificationTypeConfig[type]?.icon || "notifications-outline";
};

// Bildirim tipine göre renk belirleme
export const getNotificationColor = (
  type: NotificationType,
  fallbackColor?: string
): string => {
  return notificationTypeConfig[type]?.color || fallbackColor || "#8E8E93";
};

// Zaman formatı
export const formatTime = (date: Date, t: any): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return t("notifications.time.minutes_ago", { count: minutes });
  } else if (hours < 24) {
    return t("notifications.time.hours_ago", { count: hours });
  } else {
    return t("notifications.time.days_ago", { count: days });
  }
};

// Okunmamış bildirim sayısını hesaplama
export const getUnreadCount = (notifications: any[]): number => {
  return notifications.filter((n) => !n.isRead).length;
};

// Bildirim listesini tarihe göre sıralama
export const sortNotificationsByDate = (notifications: any[]): any[] => {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};
