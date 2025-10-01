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
    const statusMap: Record<string, { tr: string; en: string; pl: string }> = {
      confirmed: {
        tr: `${orderNumber} numaralı siparişiniz onaylandı ve hazırlanıyor.`,
        en: `Order ${orderNumber} has been confirmed and is being prepared.`,
        pl: `Zamówienie ${orderNumber} zostało potwierdzone i jest przygotowywane.`,
      },
      preparing: {
        tr: `${orderNumber} numaralı siparişiniz hazırlanıyor.`,
        en: `Order ${orderNumber} is being prepared.`,
        pl: `Zamówienie ${orderNumber} jest przygotowywane.`,
      },
      shipped: {
        tr: `${orderNumber} numaralı siparişiniz kargoya verildi. Takip kodunuzu kontrol edebilirsiniz.`,
        en: `Order ${orderNumber} has been shipped. You can check your tracking code.`,
        pl: `Zamówienie ${orderNumber} zostało wysłane. Możesz sprawdzić kod śledzenia.`,
      },
      out_for_delivery: {
        tr: `${orderNumber} numaralı siparişiniz bugün teslim edilecek.`,
        en: `Order ${orderNumber} will be delivered today.`,
        pl: `Zamówienie ${orderNumber} zostanie dostarczone dzisiaj.`,
      },
      delivered: {
        tr: `${orderNumber} numaralı siparişiniz başarıyla teslim edildi. Afiyet olsun!`,
        en: `Order ${orderNumber} has been successfully delivered. Enjoy!`,
        pl: `Zamówienie ${orderNumber} zostało pomyślnie dostarczone. Smacznego!`,
      },
      cancelled: {
        tr: `${orderNumber} numaralı siparişiniz iptal edildi.`,
        en: `Order ${orderNumber} has been cancelled.`,
        pl: `Zamówienie ${orderNumber} zostało anulowane.`,
      },
      refunded: {
        tr: `${orderNumber} numaralı siparişiniz için ödeme iadesi yapıldı.`,
        en: `Payment refund has been processed for order ${orderNumber}.`,
        pl: `Zwrot płatności został przetworzony dla zamówienia ${orderNumber}.`,
      },
    };

    const notificationTypeMap: Record<
      string,
      "orderConfirmed" | "orderPreparing" | "orderShipped" | "orderOutForDelivery" | "orderDelivered" | "orderCancelled" | "orderRefunded"
    > = {
      confirmed: "orderConfirmed",
      preparing: "orderPreparing",
      shipped: "orderShipped",
      out_for_delivery: "orderOutForDelivery",
      delivered: "orderDelivered",
      cancelled: "orderCancelled",
      refunded: "orderRefunded",
    };

    const notificationType = notificationTypeMap[status];
    const bodyTranslations = statusMap[status];

    if (!notificationType || !bodyTranslations) {
      return null;
    }

    const titleMap: Record<string, { tr: string; en: string; pl: string }> = {
      confirmed: {
        tr: "Siparişiniz Onaylandı",
        en: "Order Confirmed",
        pl: "Zamówienie Potwierdzone",
      },
      preparing: {
        tr: "Siparişiniz Hazırlanıyor",
        en: "Order Being Prepared",
        pl: "Zamówienie w Przygotowaniu",
      },
      shipped: {
        tr: "Kargoya Verildi",
        en: "Order Shipped",
        pl: "Zamówienie Wysłane",
      },
      out_for_delivery: {
        tr: "Dağıtıma Çıktı",
        en: "Out for Delivery",
        pl: "W Dostawie",
      },
      delivered: {
        tr: "Teslim Edildi",
        en: "Order Delivered",
        pl: "Zamówienie Dostarczone",
      },
      cancelled: {
        tr: "Sipariş İptal Edildi",
        en: "Order Cancelled",
        pl: "Zamówienie Anulowane",
      },
      refunded: {
        tr: "İade Edildi",
        en: "Order Refunded",
        pl: "Zamówienie Zwrócone",
      },
    };

    const titleTranslations = titleMap[status];

    return {
      notificationType,
      customTranslations: {
        tr: {
          title: titleTranslations.tr,
          body: bodyTranslations.tr,
        },
        en: {
          title: titleTranslations.en,
          body: bodyTranslations.en,
        },
        pl: {
          title: titleTranslations.pl,
          body: bodyTranslations.pl,
        },
      },
    };
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
