import { api } from "@/lib/api";
import type { Notification } from "@metropolitan/shared";

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
    await api.put(`/users/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/users/notifications/mark-all-read");
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/users/notifications/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await api.delete("/users/notifications/clear");
  },
};