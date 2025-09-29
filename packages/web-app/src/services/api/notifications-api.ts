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
    console.log("🔔 Notifications API Response:", response.data);
    
    // Try different possible response structures
    const data = 
      response.data.data?.notifications || 
      response.data.notifications || 
      response.data.data || 
      response.data;
    
    console.log("🔔 Parsed notifications:", data);
    
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
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