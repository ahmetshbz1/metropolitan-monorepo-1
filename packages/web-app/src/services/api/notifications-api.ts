import { api } from "@/lib/api";

export interface Notification {
  id: string;
  type: "order" | "promotion" | "delivery" | "system";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get("/users/notifications");
    return response.data.data || response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/users/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/users/notifications/read-all");
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/users/notifications/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await api.delete("/users/notifications/clear");
  },
};