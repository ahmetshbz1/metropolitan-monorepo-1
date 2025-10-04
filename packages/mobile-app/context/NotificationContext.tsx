//  "NotificationContext.tsx"
//  metropolitan app
//  Created by Ahmet on 07.01.2025.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import api from "@/core/api";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, isGuest, guestId } = useAuth();

  const refreshUnreadCount = async () => {
    try {
      // Guest veya authenticated kullanıcılar için farklı endpoint
      // Backend'de ayrı unread-count endpoint'i yok, /notifications endpoint'i hem bildirimleri hem de unreadCount dönüyor
      const endpoint =
        isGuest && guestId
          ? `/guest/notifications/${guestId}`
          : "/users/notifications";

      console.log("🔔 [NotificationContext] Fetching from:", endpoint);
      console.log("🔔 [NotificationContext] Auth state:", { isAuthenticated, isGuest, guestId });

      const response = await api.get(endpoint, {
        params: { limit: 1 }, // Sadece count için minimal veri
      });
      
      console.log("🔔 [NotificationContext] Response:", response.data);
      
      if (response.data.success) {
        const count = response.data.unreadCount || 0;
        console.log("🔔 [NotificationContext] Setting unreadCount to:", count);
        setUnreadCount(count);
      }
    } catch (error) {
      // Sessizce başarısız ol, kullanıcıya gösterme
      console.log("🔔 [NotificationContext] Error:", error);
      setUnreadCount(0);
    }
  };

  // İlk yüklemede ve auth değiştiğinde sayıyı getir
  useEffect(() => {
    console.log("🔔 [NotificationContext] useEffect triggered", { isAuthenticated, isGuest, guestId });
    if (isAuthenticated || isGuest) {
      console.log("🔔 [NotificationContext] Calling refreshUnreadCount...");
      refreshUnreadCount();
    } else {
      console.log("🔔 [NotificationContext] Not authenticated, setting count to 0");
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isGuest, guestId]);

  // Her 60 saniyede bir güncelle (opsiyonel)
  useEffect(() => {
    if (!isAuthenticated && !isGuest) return;

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 60000); // 60 saniye

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isGuest, guestId]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
