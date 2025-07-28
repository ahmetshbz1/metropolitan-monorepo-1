//  "notifications.types.ts"
//  metropolitan app
//  Created by Ahmet on 03.07.2025.

import type { ThemeColors } from "./theme";
import type { Notification } from "@metropolitan/shared";

// Re-export shared types for convenience
export type {
  Notification,
  NotificationType,
} from "@metropolitan/shared";

// Component prop types
export interface NotificationItemProps {
  item: Notification;
  onPress: (notification: Notification) => void;
  onDelete: (notificationId: string) => void;
}

export interface EmptyNotificationsProps {
  colors: ThemeColors;
}

export interface NotificationActionButtonsProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onDeleteAll: () => void;
  colors: ThemeColors;
}

export interface SwipeActionsProps {
  item: Notification;
  onDelete: (notificationId: string) => void;
}

// Hook return type
export interface UseNotificationsReturn {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  isLoading: boolean;
  refreshing: boolean;
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  deleteAllNotifications: () => void;
  handleNotificationPress: (notification: Notification) => void;
  onRefresh: () => Promise<void>;
}
