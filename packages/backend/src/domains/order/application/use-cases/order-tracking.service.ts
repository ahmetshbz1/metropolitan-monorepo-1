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
}
