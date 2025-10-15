//  "order-tracking-update.service.ts"
//  metropolitan backend
//  Created by Ahmet on 15.10.2025.

import { eq } from "drizzle-orm";

import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";
import { db } from "../../../../shared/infrastructure/database/connection";
import { orders, trackingEvents } from "../../../../shared/infrastructure/database/schema";
import { OrderTrackingNotificationService } from "./order-tracking-notification.service";

export class OrderTrackingUpdateService {
  /**
   * Sipariş durumunu günceller ve bildirim gönderir
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    trackingInfo?: {
      trackingNumber?: string;
      shippingCompany?: string;
      estimatedDelivery?: Date;
      location?: string;
      description?: string;
    }
  ) {
    // Siparişi güncelle
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: newStatus,
        trackingNumber: trackingInfo?.trackingNumber || orders.trackingNumber,
        shippingCompany: trackingInfo?.shippingCompany || orders.shippingCompany,
        estimatedDelivery: trackingInfo?.estimatedDelivery || orders.estimatedDelivery,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error("Sipariş güncellenemedi");
    }

    // Tracking event ekle
    if (trackingInfo?.description) {
      await db.insert(trackingEvents).values({
        orderId: orderId,
        status: newStatus,
        statusText: OrderTrackingNotificationService.getStatusText(newStatus),
        location: trackingInfo.location || "",
        timestamp: new Date(),
        description: trackingInfo.description,
      });
    }

    // Push notification gönder
    const shouldSendNotification = OrderTrackingNotificationService.shouldSendNotification(newStatus);
    if (shouldSendNotification) {
      const notificationTranslations = OrderTrackingNotificationService.getNotificationTranslations(
        newStatus,
        updatedOrder.orderNumber
      );

      await PushNotificationService.sendToUser(updatedOrder.userId, {
        customTranslations: notificationTranslations,
        data: {
          screen: `/order/${orderId}`,
          orderId: orderId,
          orderNumber: updatedOrder.orderNumber,
          status: newStatus,
          type: "order_update",
        },
      });
    }

    return updatedOrder;
  }
}
