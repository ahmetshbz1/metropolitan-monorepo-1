//  "order-tracking.service.ts"
//  metropolitan backend
//  Created by Ahmet on 15.06.2025.

import { and, desc, eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  addresses,
  orderItems,
  orders,
  productTranslations,
  products,
  trackingEvents,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";

export class OrderTrackingService {
  /**
   * Kullanıcının tüm siparişlerini getirir
   */
  static async getUserOrders(userId: string) {
    return await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        trackingNumber: orders.trackingNumber,
        shippingCompany: orders.shippingCompany,
        estimatedDelivery: orders.estimatedDelivery,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        paymentStatus: orders.paymentStatus,
        paymentMethodType: orders.paymentMethodType,
        shippingAddress: {
          addressTitle: addresses.addressTitle,
          street: addresses.street,
          city: addresses.city,
          postalCode: addresses.postalCode,
          country: addresses.country,
        },
      })
      .from(orders)
      .innerJoin(addresses, eq(orders.shippingAddressId, addresses.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  /**
   * Belirli bir siparişin detaylarını getirir
   */
  static async getOrderDetails(orderId: string, userId: string) {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        trackingNumber: orders.trackingNumber,
        shippingCompany: orders.shippingCompany,
        estimatedDelivery: orders.estimatedDelivery,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        paymentStatus: orders.paymentStatus,
        paymentMethodType: orders.paymentMethodType,
        stripePaymentIntentId: orders.stripePaymentIntentId,
        stripeClientSecret: orders.stripeClientSecret,
        paidAt: orders.paidAt,
        shippingAddressId: orders.shippingAddressId,
        billingAddressId: orders.billingAddressId,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          phoneNumber: users.phoneNumber,
          email: users.email,
        },
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) {
      throw new Error("Sipariş bulunamadı");
    }

    // Shipping ve billing adreslerini ayrı ayrı çek
    const [shippingAddress] = await db
      .select({
        addressTitle: addresses.addressTitle,
        street: addresses.street,
        city: addresses.city,
        postalCode: addresses.postalCode,
        country: addresses.country,
      })
      .from(addresses)
      .where(eq(addresses.id, order.shippingAddressId))
      .limit(1);

    let billingAddress = null;
    if (order.billingAddressId) {
      const [billing] = await db
        .select({
          addressTitle: addresses.addressTitle,
          street: addresses.street,
          city: addresses.city,
          postalCode: addresses.postalCode,
          country: addresses.country,
        })
        .from(addresses)
        .where(eq(addresses.id, order.billingAddressId))
        .limit(1);
      billingAddress = billing;
    }

    return {
      ...order,
      shippingAddress,
      billingAddress,
    };
  }

  /**
   * Sipariş öğelerini getirir
   */
  static async getOrderItems(orderId: string) {
    return await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        product: {
          id: products.id,
          productCode: products.productCode,
          brand: products.brand,
          size: products.size,
          imageUrl: products.imageUrl,
          name: productTranslations.name,
          fullName: productTranslations.fullName,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(
        productTranslations,
        and(
          eq(products.id, productTranslations.productId),
          eq(productTranslations.languageCode, "tr")
        )
      )
      .where(eq(orderItems.orderId, orderId));
  }

  /**
   * Kargo takip olaylarını getirir
   */
  static async getTrackingEvents(orderId: string) {
    return await db
      .select({
        id: trackingEvents.id,
        status: trackingEvents.status,
        statusText: trackingEvents.statusText,
        location: trackingEvents.location,
        timestamp: trackingEvents.timestamp,
        description: trackingEvents.description,
        createdAt: trackingEvents.createdAt,
      })
      .from(trackingEvents)
      .where(eq(trackingEvents.orderId, orderId))
      .orderBy(desc(trackingEvents.timestamp));
  }

  /**
   * Kargo takip numarasına göre sipariş bulur
   */
  static async getOrderByTrackingNumber(
    trackingNumber: string,
    userId: string
  ) {
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.trackingNumber, trackingNumber),
          eq(orders.userId, userId)
        )
      )
      .limit(1);

    if (!order) {
      throw new Error("Bu takip numarasına ait sipariş bulunamadı");
    }

    return order;
  }

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
        statusText: this.getStatusText(newStatus),
        location: trackingInfo.location || "",
        timestamp: new Date(),
        description: trackingInfo.description,
      });
    }

    // Push notification gönder
    const notificationData = this.getNotificationData(newStatus, updatedOrder.orderNumber);
    if (notificationData) {
      await PushNotificationService.sendToUser(updatedOrder.userId, {
        ...notificationData,
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

  /**
   * Sipariş durumuna göre bildirim metni döndürür
   */
  private static getNotificationData(status: string, orderNumber: string) {
    const notifications: Record<string, { title: string; body: string }> = {
      confirmed: {
        title: "Siparişiniz Onaylandı",
        body: `${orderNumber} numaralı siparişiniz onaylandı ve hazırlanıyor.`,
      },
      preparing: {
        title: "Siparişiniz Hazırlanıyor",
        body: `${orderNumber} numaralı siparişiniz hazırlanıyor.`,
      },
      shipped: {
        title: "Kargoya Verildi",
        body: `${orderNumber} numaralı siparişiniz kargoya verildi. Takip kodunuzu kontrol edebilirsiniz.`,
      },
      out_for_delivery: {
        title: "Dağıtıma Çıktı",
        body: `${orderNumber} numaralı siparişiniz bugün teslim edilecek.`,
      },
      delivered: {
        title: "Teslim Edildi",
        body: `${orderNumber} numaralı siparişiniz başarıyla teslim edildi. Afiyet olsun!`,
      },
      cancelled: {
        title: "Sipariş İptal Edildi",
        body: `${orderNumber} numaralı siparişiniz iptal edildi.`,
      },
      refunded: {
        title: "İade Edildi",
        body: `${orderNumber} numaralı siparişiniz için ödeme iadesi yapıldı.`,
      },
    };

    return notifications[status] || null;
  }

  /**
   * Sipariş durumu açıklaması
   */
  private static getStatusText(status: string): string {
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
