//  "order-creation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 07.07.2025, last modified on 27.01.2025.

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import type {
  OrderCreationRequest,
  OrderCreationResult,
  OrderItem as OrderItemData,
} from "@metropolitan/shared/types/order";
import { eq, sql } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  orderItems,
  orders,
  products,
  users,
} from "../../../../shared/infrastructure/database/schema";
import StripeService from "../../../../shared/infrastructure/external/stripe.service";
import { generateOrderNumber } from "../../domain/value-objects/order-number.util";

import { InvoiceService } from "./invoice.service";

export class OrderCreationService {
  /**
   * Sepet öğelerinden toplam tutarı hesaplar (cent cinsinden)
   */
  private static calculateAmountFromCart(cartItems: CartItemData[]): number {
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    // PLN'den cent'e çevir (100 ile çarp) - Polonya Zloty
    return Math.round(totalAmount * 100);
  }

  /**
   * Stripe için metadata oluşturur
   */
  private static createOrderMetadata(
    orderId: string,
    userId: string
  ): Record<string, string> {
    return {
      order_id: orderId,
      user_id: userId,
      source: "metropolitan_app",
    };
  }

  /**
   * Stripe ile transaction'lı sipariş oluşturur
   */
  static async createOrderWithStripe(
    userId: string,
    request: OrderCreationRequest,
    orderItemsData: OrderItemData[],
    cartItemsData: CartItemData[],
    totalAmount: number
  ): Promise<OrderCreationResult> {
    // İlk olarak Stripe payment intent oluştur
    const amountInCents = this.calculateAmountFromCart(cartItemsData);

    const result = await db.transaction(async (tx) => {
      // 1. CRITICAL: Stock validation and reservation
      await this.validateAndReserveStock(tx, orderItemsData);

      // Stripe payment types
      const stripePaymentTypes = [
        "card",
        "bank_transfer",
        "blik",
        "apple_pay",
        "google_pay",
      ];
      const isStripePayment = stripePaymentTypes.includes(
        request.paymentMethodId
      );

      // Banka havalesi için özel kontrol
      const isBankTransfer = request.paymentMethodId === "bank_transfer";

      // Kullanıcı bilgilerini al (kurumsal müşteri kontrolü için)
      const [user] = await tx
        .select({
          id: users.id,
          userType: users.userType,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      // Sipariş oluştur
      const orderPayload: any = {
        orderNumber: generateOrderNumber(),
        userId: userId,
        shippingAddressId: request.shippingAddressId,
        totalAmount: totalAmount.toString(),
        status: "pending", // Ödeme bekliyor
        paymentStatus: "pending", // Stripe payment durumu
      };

      // Payment method handling
      if (isStripePayment) {
        // Stripe payments için paymentMethodType kullan, paymentMethodId null
        orderPayload.paymentMethodType = request.paymentMethodId;
        orderPayload.paymentMethodId = null;
      } else {
        // Traditional payment methods için paymentMethodId kullan
        orderPayload.paymentMethodId = request.paymentMethodId;
        orderPayload.paymentMethodType = null;
      }

      // Fatura adresi belirtilmemişse, teslimat adresini kullan
      orderPayload.billingAddressId =
        request.billingAddressId || request.shippingAddressId;
      if (request.notes) {
        orderPayload.notes = request.notes;
      }

      console.log("📦 Creating order with payload:", orderPayload);

      const [order] = await tx.insert(orders).values(orderPayload).returning();

      if (!order) throw new Error("Sipariş oluşturulamadı");

      // Banka havalesi için kurumsal müşteri otomatik onay
      if (isBankTransfer && user.userType === "corporate") {
        console.log("🏢 Kurumsal müşteri banka havalesi - otomatik onay");

        // Siparişi otomatik olarak onayla
        await tx
          .update(orders)
          .set({
            status: "confirmed",
            paymentStatus: "pending", // Ödeme hala bekliyor ama sipariş onaylandı
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        // Sipariş öğelerini oluştur
        for (const itemData of orderItemsData) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: itemData.product.id,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            totalPrice: itemData.totalPrice,
          });
        }

        // Sepeti temizle
        if (cartItemsData.length > 0) {
          await this.clearUserCart(tx, userId);
        }

        // Background'da fatura oluştur (kurumsal müşteri için hemen)
        this.createInvoiceInBackground(order.id, userId);

        return {
          ...order,
          status: "confirmed",
          paymentStatus: "pending",
        };
      }

      // Normal Stripe payment flow
      // Stripe payment intent oluştur
      const paymentIntentParams: any = {
        amount: amountInCents,
        currency: "pln", // Satışlar PLN cinsinden!
        metadata: this.createOrderMetadata(order.id, userId),
      };

      // Belirli payment method'ları için stripe configuration
      console.log("🔧 Payment method ID:", request.paymentMethodId);
      if (request.paymentMethodId === "card") {
        paymentIntentParams.paymentMethodTypes = ["card"];
        console.log("💳 Using card payment methods only");
      } else if (request.paymentMethodId === "blik") {
        paymentIntentParams.paymentMethodTypes = ["blik"];
        // BLIK Poland'a özel, currency PLN olmalı
        if (paymentIntentParams.currency !== "pln") {
          console.warn("⚠️ BLIK requires PLN currency, forcing to pln");
          paymentIntentParams.currency = "pln";
        }
        console.log("📱 Using BLIK payment methods only");
      } else {
        console.log("🔄 Using automatic payment methods");
      }

      const paymentIntent =
        await StripeService.createPaymentIntent(paymentIntentParams);

      // Order'ı Stripe bilgileriyle güncelle
      await tx
        .update(orders)
        .set({
          stripePaymentIntentId: paymentIntent.id,
          stripeClientSecret: paymentIntent.client_secret,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      // Sipariş öğelerini oluştur
      for (const itemData of orderItemsData) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: itemData.product.id,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
        });
      }

      // 2. Stock already reserved above - webhook will handle final confirmation/rollback
      // 3. Clear cart - order is created, cart should be emptied
      if (cartItemsData.length > 0) {
        await this.clearUserCart(tx, userId);
      }

      return {
        ...order,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      };
    });

    // Banka havalesi kurumsal müşteri için özel response
    if (result.status === "confirmed") {
      return {
        success: true,
        order: {
          id: result.id,
          orderNumber: result.orderNumber,
          status: result.status,
          totalAmount: result.totalAmount,
          currency: result.currency,
          createdAt: result.createdAt,
          paymentStatus: "pending",
        },
      };
    }

    return {
      success: true,
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        totalAmount: result.totalAmount,
        currency: result.currency,
        createdAt: result.createdAt,
        // Stripe payment bilgileri
        stripePaymentIntentId: result.stripePaymentIntentId!,
        stripeClientSecret: result.stripeClientSecret!,
        paymentStatus: "pending",
      },
    };
  }

  /**
   * Ödeme tamamlandıktan sonra sipariş işlemlerini finalize eder
   * Bu method webhook'dan çağrılır
   */
  static async finalizeOrderAfterPayment(orderId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Sipariş bilgilerini al
      const [order] = await tx
        .select({
          id: orders.id,
          userId: orders.userId,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error("Sipariş bulunamadı");
      }

      // Sepet öğelerini al (stok güncellemesi için)
      const userCartItems = await tx
        .select({
          productId: cartItems.productId,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.userId, order.userId));

      // Stokları güncelle
      for (const item of userCartItems) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }

      // Sepeti temizle
      await tx.delete(cartItems).where(eq(cartItems.userId, order.userId));
    });

    // Background'da fatura oluştur
    this.createInvoiceInBackground(orderId, "system"); // User ID'yi order'dan alacak
  }

  /**
   * Legacy method - backward compatibility için
   * Stripe olmadan sipariş oluşturur (eski flow)
   */
  static async createOrderWithTransaction(
    userId: string,
    request: OrderCreationRequest,
    orderItemsData: OrderItemData[],
    cartItemsData: CartItemData[],
    totalAmount: number
  ): Promise<OrderCreationResult> {
    // Eski flow'u koruyoruz, ancak önerilenin Stripe kullanımı olduğunu belirtelim
    console.warn(
      "Legacy order creation method used - consider using createOrderWithStripe"
    );

    const result = await db.transaction(async (tx) => {
      // Sipariş oluştur
      const orderPayload: any = {
        orderNumber: generateOrderNumber(),
        userId: userId,
        shippingAddressId: request.shippingAddressId,
        paymentMethodId: request.paymentMethodId,
        totalAmount: totalAmount.toString(),
        status: "pending",
        paymentStatus: "pending",
      };

      // Fatura adresi belirtilmemişse, teslimat adresini kullan
      orderPayload.billingAddressId =
        request.billingAddressId || request.shippingAddressId;
      if (request.notes) {
        orderPayload.notes = request.notes;
      }

      const [order] = await tx.insert(orders).values(orderPayload).returning();

      if (!order) throw new Error("Sipariş oluşturulamadı");

      // Sipariş öğelerini oluştur
      for (const itemData of orderItemsData) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: itemData.product.id,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
        });
      }

      // Stokları güncelle
      for (const item of cartItemsData) {
        if (item.product?.id) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
            })
            .where(eq(products.id, item.product.id));
        }
      }

      // Sepeti temizle
      await tx.delete(cartItems).where(eq(cartItems.userId, userId));

      return order;
    });

    // Background'da fatura oluştur (sipariş oluşturma hızını etkilemesin)
    this.createInvoiceInBackground(result.id, userId);

    return {
      success: true,
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        totalAmount: result.totalAmount,
        currency: result.currency,
        createdAt: result.createdAt,
      },
    };
  }

  /**
   * Background'da fatura oluşturur ve cache'e atar
   */
  private static createInvoiceInBackground(
    orderId: string,
    userId: string
  ): void {
    // Async olarak çalıştır, sipariş oluşturmayı beklemesin
    setImmediate(async () => {
      try {
        console.log(`Background fatura oluşturuluyor: ${orderId}`);
        const startTime = performance.now();

        // Faturayı oluştur ve cache'e at
        await InvoiceService.generateInvoicePDF(orderId, userId);

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.log(
          `Background fatura oluşturuldu: ${orderId} (${duration}ms)`
        );
      } catch (error) {
        // Fatura oluşturulamazsa log at ama sipariş etkilenmesin
        console.error(`Background fatura oluşturma hatası: ${orderId}`, error);
      }
    });
  }

  /**
   * CRITICAL: Stock validation and reservation with Redis
   * Prevents race conditions and over-selling using distributed locking
   */
  private static async validateAndReserveStock(
    tx: any,
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    // Try Redis-based reservation first (faster + distributed locking)
    const redisReservations: {
      productId: string;
      userId: string;
      success: boolean;
    }[] = [];

    try {
      // Import Redis service dynamically to avoid dependency issues
      const { RedisStockService } = await import(
        "../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const item of orderItemsData) {
        const productId = item.product.id;
        const requestedQuantity = item.quantity;
        const userId = "temp-user"; // Will be replaced with actual userId

        console.log(`🔄 Attempting Redis stock reservation for ${productId}`);

        const reservation = await RedisStockService.reserveStockAtomic(
          productId,
          userId,
          requestedQuantity
        );

        redisReservations.push({
          productId,
          userId,
          success: reservation.success,
        });

        if (!reservation.success) {
          // Rollback any successful reservations before throwing
          await this.rollbackRedisReservations(
            redisReservations.filter((r) => r.success)
          );
          throw new Error(
            JSON.stringify({
              code: "INSUFFICIENT_STOCK",
              message: "Stok yetersiz",
              productId: productId,
              error: reservation.error,
            })
          );
        }

        console.log(
          `✅ Redis stock reserved: ${productId} - Remaining: ${reservation.remainingStock}`
        );
      }

      // If Redis succeeds, also update database for consistency
      await this.syncDatabaseWithRedisReservations(
        tx,
        orderItemsData,
        redisReservations
      );
    } catch (redisError) {
      console.warn(
        "Redis stock reservation failed, falling back to database:",
        redisError
      );

      // Check if this is an insufficient stock error that should be rethrown
      if (
        redisError.message &&
        redisError.message.includes("INSUFFICIENT_STOCK")
      ) {
        throw redisError; // Re-throw the stock error
      }

      // Fallback to database-only reservation for other errors
      await this.fallbackDatabaseStockReservation(tx, orderItemsData);
    }
  }

  /**
   * Fallback database stock reservation (original method)
   */
  private static async fallbackDatabaseStockReservation(
    tx: any,
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    for (const item of orderItemsData) {
      const productId = item.product.id;
      const requestedQuantity = item.quantity;

      // Atomic stock check and reservation using SQL
      const [result] = await tx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${requestedQuantity}`,
          updatedAt: new Date(),
        })
        .where(
          sql`${products.id} = ${productId} AND ${products.stock} >= ${requestedQuantity}`
        )
        .returning({
          id: products.id,
          name: products.name,
          newStock: products.stock,
        });

      // If no rows affected, stock was insufficient
      if (!result) {
        // Get current stock for error message
        const [currentProduct] = await tx
          .select({
            name: products.name,
            stock: products.stock,
          })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);

        const productName = currentProduct?.name || `Product ${productId}`;
        const currentStock = currentProduct?.stock || 0;

        throw new Error(
          `Insufficient stock for ${productName}. Requested: ${requestedQuantity}, Available: ${currentStock}`
        );
      }

      console.log(
        `✅ Database stock reserved: ${result.name} - Quantity: ${requestedQuantity}, Remaining: ${result.newStock}`
      );
    }
  }

  /**
   * Sync database with Redis reservations for consistency
   */
  private static async syncDatabaseWithRedisReservations(
    tx: any,
    orderItemsData: OrderItemData[],
    redisReservations: { productId: string; userId: string; success: boolean }[]
  ): Promise<void> {
    for (const item of orderItemsData) {
      const reservation = redisReservations.find(
        (r) => r.productId === item.product.id
      );
      if (reservation?.success) {
        // Update database to match Redis state
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.product.id));

        console.log(
          `🔄 Database synced with Redis for product ${item.product.id}`
        );
      }
    }
  }

  /**
   * Rollback Redis reservations in case of failure
   */
  private static async rollbackRedisReservations(
    reservations: { productId: string; userId: string; success: boolean }[]
  ): Promise<void> {
    try {
      const { RedisStockService } = await import(
        "../../../../shared/infrastructure/cache/redis-stock.service"
      );

      for (const reservation of reservations) {
        await RedisStockService.rollbackReservation(
          reservation.userId,
          reservation.productId
        );
        console.log(
          `🔄 Redis reservation rolled back: ${reservation.productId}`
        );
      }
    } catch (error) {
      console.error("Failed to rollback Redis reservations:", error);
    }
  }

  /**
   * Clear user cart after successful order creation
   */
  private static async clearUserCart(tx: any, userId: string): Promise<void> {
    const deletedItems = await tx
      .delete(cartItems)
      .where(eq(cartItems.userId, userId))
      .returning({ id: cartItems.id });

    console.log(
      `🛒 Cart cleared: ${deletedItems.length} items removed for user ${userId}`
    );
  }

  /**
   * Rollback stock if order fails (called from webhook on payment failure)
   */
  static async rollbackStock(orderId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get order items that need stock rollback
      const orderItemsToRollback = await tx
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Rollback stock for each item
      for (const item of orderItemsToRollback) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));

        console.log(
          `🔄 Stock rolled back: Product ${item.productId} + ${item.quantity}`
        );
      }

      // Mark order as cancelled
      await tx
        .update(orders)
        .set({
          status: "cancelled",
          paymentStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`❌ Order cancelled and stock rolled back: ${orderId}`);
    });
  }
}
