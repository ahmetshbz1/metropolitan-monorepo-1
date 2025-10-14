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
import { getOrderStatusNotificationWithNumber } from "../../../../shared/application/services/notification-translations";
import type { OrderQueryResult, OrderWithItems } from "../types/order-tracking.types";

export class OrderTrackingService {
  /**
   * Kullanıcının tüm siparişlerini getirir
   * Tek query ile tüm ilişkili verileri JOIN ile alır (N+1 query önlenir)
   */
  static async getUserOrders(userId: string) {
    const results = await db
      .select({
        // Order fields
        orderId: orders.id,
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

        // Address fields
        addressTitle: addresses.addressTitle,
        addressStreet: addresses.street,
        addressCity: addresses.city,
        addressPostalCode: addresses.postalCode,
        addressCountry: addresses.country,

        // Order item fields (nullable - LEFT JOIN)
        itemId: orderItems.id,
        itemQuantity: orderItems.quantity,
        itemUnitPrice: orderItems.unitPrice,
        itemTotalPrice: orderItems.totalPrice,

        // Product fields (nullable - LEFT JOIN)
        productId: products.id,
        productCode: products.productCode,
        productBrand: products.brand,
        productSize: products.size,
        productImageUrl: products.imageUrl,
      })
      .from(orders)
      .innerJoin(addresses, eq(orders.shippingAddressId, addresses.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    return this.transformToNestedOrders(results);
  }

  /**
   * Flat query sonuçlarını nested order yapısına dönüştürür
   */
  private static transformToNestedOrders(results: OrderQueryResult[]): OrderWithItems[] {
    const ordersMap = new Map<string, OrderWithItems>();

    for (const row of results) {
      // Order henüz map'te yoksa ekle
      if (!ordersMap.has(row.orderId)) {
        ordersMap.set(row.orderId, {
          id: row.orderId,
          orderNumber: row.orderNumber,
          status: row.status,
          totalAmount: row.totalAmount,
          currency: row.currency,
          trackingNumber: row.trackingNumber,
          shippingCompany: row.shippingCompany,
          estimatedDelivery: row.estimatedDelivery,
          notes: row.notes,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          paymentStatus: row.paymentStatus,
          paymentMethodType: row.paymentMethodType,
          shippingAddress: {
            addressTitle: row.addressTitle,
            street: row.addressStreet,
            city: row.addressCity,
            postalCode: row.addressPostalCode,
            country: row.addressCountry,
          },
          items: [],
        });
      }

      // Order item varsa items array'ine ekle
      if (row.itemId) {
        const order = ordersMap.get(row.orderId);
        if (order) {
          order.items.push({
            id: row.itemId,
            quantity: row.itemQuantity!,
            unitPrice: row.itemUnitPrice!,
            totalPrice: row.itemTotalPrice!,
            product: row.productId ? {
              id: row.productId,
              productCode: row.productCode!,
              brand: row.productBrand!,
              size: row.productSize!,
              imageUrl: row.productImageUrl!,
            } : null,
          });
        }
      }
    }

    return Array.from(ordersMap.values());
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
  static async getOrderItems(orderId: string, language: string) {
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
          eq(productTranslations.languageCode, language)
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
    const shouldSendNotification = this.shouldSendNotification(newStatus);
    if (shouldSendNotification) {
      const notificationTranslations = this.getNotificationTranslations(newStatus, updatedOrder.orderNumber);

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

  /**
   * Sipariş durumuna göre bildirim gönderilip gönderilmeyeceğini kontrol eder
   */
  private static shouldSendNotification(status: string): boolean {
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
  private static getNotificationTranslations(
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
