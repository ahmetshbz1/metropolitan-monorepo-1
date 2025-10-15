//  "order-tracking-notification.service.ts"
//  metropolitan backend
//  Created by Ahmet on 15.10.2025.

import { getOrderStatusNotificationWithNumber } from "../../../../shared/application/services/notification-translations";

export class OrderTrackingNotificationService {
  /**
   * Sipariş durumuna göre bildirim gönderilip gönderilmeyeceğini kontrol eder
   */
  static shouldSendNotification(status: string): boolean {
    const notifiableStatuses = [
      "confirmed",
      "preparing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "refunded",
    ];
    return notifiableStatuses.includes(status);
  }

  /**
   * Sipariş durumuna göre bildirim çevirilerini döndürür
   */
  static getNotificationTranslations(
    status: string,
    orderNumber: string
  ): Record<"tr" | "en" | "pl", { title: string; body: string }> {
    const validStatuses = [
      "confirmed",
      "preparing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "refunded",
    ];

    if (!validStatuses.includes(status)) {
      // Default fallback
      return {
        tr: { title: "Sipariş Güncelleme", body: `${orderNumber} numaralı siparişiniz güncellendi.` },
        en: { title: "Order Update", body: `Order ${orderNumber} has been updated.` },
        pl: { title: "Aktualizacja Zamówienia", body: `Zamówienie ${orderNumber} zostało zaktualizowane.` },
      };
    }

    const trTranslation = getOrderStatusNotificationWithNumber(
      status as any,
      orderNumber,
      "tr"
    );
    const enTranslation = getOrderStatusNotificationWithNumber(
      status as any,
      orderNumber,
      "en"
    );
    const plTranslation = getOrderStatusNotificationWithNumber(
      status as any,
      orderNumber,
      "pl"
    );

    return {
      tr: trTranslation,
      en: enTranslation,
      pl: plTranslation,
    };
  }

  /**
   * Sipariş durumu açıklaması
   */
  static getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      pending: "Beklemede",
      confirmed: "Onaylandı",
      preparing: "Hazırlanıyor",
      shipped: "Kargoya Verildi",
      out_for_delivery: "Dağıtımda",
      delivered: "Teslim Edildi",
      cancelled: "İptal Edildi",
      refunded: "İade Edildi",
    };

    return statusTexts[status] || status;
  }
}
