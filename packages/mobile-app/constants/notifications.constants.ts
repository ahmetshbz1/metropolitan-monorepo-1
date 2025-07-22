//  "notifications.constants.ts"
//  metropolitan app
//  Created by Ahmet on 02.07.2025.

import { Notification, NotificationType } from "@/types/notifications.types";

// Mock bildirim verileri - gerçek API'den gelecek
export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Siparişiniz Hazırlandı",
    message: "Sipariş #12345 hazırlandı ve kargoya verildi.",
    type: "order",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 dakika önce
    actionUrl: "/order/12345",
  },
  {
    id: "2",
    title: "Özel İndirim!",
    message: "Favori ürünlerinizde %20 indirim fırsatı.",
    type: "promotion",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 saat önce
  },
  {
    id: "3",
    title: "Teslimat Tamamlandı",
    message: "Sipariş #12344 başarıyla teslim edildi.",
    type: "delivery",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 gün önce
    actionUrl: "/order/12344",
  },
  {
    id: "4",
    title: "Sistem Güncellemesi",
    message: "Uygulama yeni özelliklerle güncellendi.",
    type: "system",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 gün önce
  },
];

// Bildirim tipi konfigürasyonları
export const notificationTypeConfig: Record<
  NotificationType,
  {
    icon: string;
    color: string;
  }
> = {
  order: {
    icon: "receipt-outline",
    color: "#007AFF",
  },
  promotion: {
    icon: "pricetag-outline",
    color: "#FF9500",
  },
  delivery: {
    icon: "car-outline",
    color: "#34C759",
  },
  system: {
    icon: "settings-outline",
    color: "#8E8E93",
  },
};

// Swipe action konfigürasyonları
export const swipeConfig = {
  rightThreshold: 40,
  friction: 2,
  deleteButtonWidth: 80,
};
