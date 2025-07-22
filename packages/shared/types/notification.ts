// "notification.ts"
// metropolitan app
// Created by Ahmet on 15.07.2025.
export type NotificationType = "order" | "promotion" | "system" | "delivery";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date | string;
  actionUrl?: string;
}
