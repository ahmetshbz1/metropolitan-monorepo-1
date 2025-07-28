//  "stripe-webhook.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 27.01.2025.

import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import type Stripe from "stripe";

import { db } from "../../../../shared/infrastructure/database/connection";
import { orders, cartItems, orderItems } from "../../../../shared/infrastructure/database/schema";
import StripeService from "../../../../shared/infrastructure/external/stripe.service";
import { InvoiceService } from "../../../order/application/use-cases/invoice.service";

// İdempotency için işlenmiş webhook event'leri cache'le
const processedEvents = new Set<string>();

export const stripeWebhookRoutes = new Elysia().group("/stripe", (app) =>
  app.post("/webhook", async ({ request, headers }) => {
    try {
      const signature = headers["stripe-signature"];

      if (!signature) {
        throw new Error("Stripe signature missing");
      }

      // Raw body'yi al
      const rawBody = await request.text();

      // Webhook event'ini doğrula
      const event = await StripeService.constructWebhookEvent(
        rawBody,
        signature
      );

      console.log(`Stripe webhook received: ${event.type} - ${event.id}`);

      // İdempotency kontrolü - aynı event'i birden fazla kez işleme
      if (processedEvents.has(event.id)) {
        console.log(`Event ${event.id} already processed, skipping...`);
        return { received: true, status: "already_processed" };
      }

      // Event'i işlenmiş olarak işaretle
      processedEvents.add(event.id);

      // Memory leak'i önlemek için cache'i sınırla (1000 event)
      if (processedEvents.size > 1000) {
        const firstEvent = processedEvents.values().next().value;
        processedEvents.delete(firstEvent);
      }

      // Event type'a göre işle
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case "payment_intent.requires_action":
          await handlePaymentIntentRequiresAction(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case "payment_intent.canceled":
          await handlePaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case "payment_intent.processing":
          await handlePaymentIntentProcessing(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true, status: "processed" };
    } catch (error) {
      console.error("Stripe webhook error:", error);
      throw new Error(
        `Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  })
);

// Payment Intent başarılı olduğunda
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const orderId = paymentIntent.metadata.order_id;
    const userId = paymentIntent.metadata.user_id;

    if (!orderId) {
      console.error("Order ID not found in payment intent metadata");
      return;
    }

    if (!userId) {
      console.error("User ID not found in payment intent metadata");
      return;
    }

    // İdempotency kontrolü - order zaten completed mı?
    const existingOrder = await db
      .select({ paymentStatus: orders.paymentStatus, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length > 0 && existingOrder[0].paymentStatus === "completed") {
      console.log(`Order ${orderId} already completed, skipping...`);
      return;
    }

    // Order'ı güncelle - ödeme başarılı
    await db
      .update(orders)
      .set({
        paymentStatus: "completed",
        status: "confirmed",
        stripePaymentIntentId: paymentIntent.id,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`✅ Order ${orderId} payment completed successfully`);

    // ✅ Stock already reserved during order creation - no need to deduct again
    // 🛒 Only clear cart if it wasn't already cleared during order creation
    try {
      await db.transaction(async (tx) => {
        // Check if cart still has items (might be cleared during order creation)
        const remainingCartItems = await tx
          .select({ id: cartItems.id })
          .from(cartItems)
          .where(eq(cartItems.userId, userId))
          .limit(1);

        if (remainingCartItems.length > 0) {
          // Clear cart if not already cleared
          await tx.delete(cartItems).where(eq(cartItems.userId, userId));
          console.log(`🛒 Cart cleared for user ${userId} after payment success`);
        } else {
          console.log(`🛒 Cart already cleared for user ${userId}`);
        }
      });
    } catch (cartError) {
      console.error(`❌ Cart clearing failed for order ${orderId}:`, cartError);
    }

    // 📄 Fatura oluştur (arka planda, async)
    try {
      console.log(`📄 Generating invoice for order ${orderId}...`);
      await InvoiceService.generateInvoicePDF(orderId, userId);
      console.log(`✅ Invoice generated successfully for order ${orderId}`);
    } catch (invoiceError) {
      // Fatura hatası ödeme başarısını etkilemez, sadece log'la
      console.error(
        `❌ Invoice generation failed for order ${orderId}:`,
        invoiceError
      );
    }

    // TODO: Order işleme pipeline'ını başlat
    // - Teslimat planla
    // - Müşteriye bildirim gönder
  } catch (error) {
    console.error("Error handling payment_intent.succeeded:", error);
  }
}

// Payment Intent başarısız olduğunda
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.order_id;

    if (!orderId) {
      console.error("Order ID not found in payment intent metadata");
      return;
    }

    // Order'ı güncelle - ödeme başarısız
    await db
      .update(orders)
      .set({
        paymentStatus: "failed",
        status: "canceled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`❌ Order ${orderId} payment failed`);

    // CRITICAL: Rollback stock since payment failed (Redis + Database)
    try {
      // Try Redis rollback first
      const { RedisStockService } = await import("../../../shared/infrastructure/cache/redis-stock.service");
      
      // Get order details to identify products for rollback
      const orderDetails = await db
        .select({
          userId: orders.userId,
          items: orderItems
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.id, orderId));

      // Rollback each product in Redis
      for (const detail of orderDetails) {
        if (detail.items?.productId) {
          await RedisStockService.rollbackReservation(detail.userId, detail.items.productId);
        }
      }
      
      console.log(`🔄 Redis stock rollback completed for order ${orderId}`);
    } catch (redisError) {
      console.warn("Redis rollback failed, using database rollback:", redisError);
    }
    
    // Always do database rollback as well for consistency
    const { OrderCreationService } = await import("../../../order/application/use-cases/order-creation.service");
    await OrderCreationService.rollbackStock(orderId);

    // TODO:
    // - Müşteriye bildirim gönder  
    // - Failed payment analytics'e kaydet
  } catch (error) {
    console.error("Error handling payment_intent.payment_failed:", error);
  }
}

// Payment Intent ek doğrulama gerektirdiğinde (3D Secure vb.)
async function handlePaymentIntentRequiresAction(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const orderId = paymentIntent.metadata.order_id;

    if (!orderId) {
      console.error("Order ID not found in payment intent metadata");
      return;
    }

    // Order'ı güncelle - ek doğrulama bekleniyor
    await db
      .update(orders)
      .set({
        paymentStatus: "requires_action",
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`🔐 Order ${orderId} requires additional authentication`);

    // TODO: Müşteriye 3D Secure için bildirim gönder
  } catch (error) {
    console.error("Error handling payment_intent.requires_action:", error);
  }
}

// Payment Intent iptal edildiğinde
async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const orderId = paymentIntent.metadata.order_id;
    const userId = paymentIntent.metadata.user_id;

    if (!orderId) {
      console.error("Order ID not found in payment intent metadata");
      return;
    }

    // İdempotency kontrolü - order zaten canceled mı?
    const existingOrder = await db
      .select({ paymentStatus: orders.paymentStatus, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length > 0 && existingOrder[0].paymentStatus === "canceled") {
      console.log(`Order ${orderId} already canceled, skipping...`);
      return;
    }

    // Order'ı güncelle - iptal edildi
    await db
      .update(orders)
      .set({
        paymentStatus: "canceled",
        status: "canceled",
        cancelledAt: new Date(),
        cancelReason: "Payment canceled by customer",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`🚫 Order ${orderId} payment canceled`);

    // Stock'u geri ver (Redis + Database)
    try {
      // Redis rollback
      const { RedisStockService } = await import("../../../../shared/infrastructure/cache/redis-stock.service");
      
      // Get order details to identify products for rollback
      const orderDetails = await db
        .select({
          userId: orders.userId,
          items: orderItems
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.id, orderId));

      // Rollback each product in Redis
      for (const detail of orderDetails) {
        if (detail.items?.productId && userId) {
          await RedisStockService.rollbackReservation(userId, detail.items.productId);
        }
      }
      
      console.log(`🔄 Redis stock rollback completed for canceled order ${orderId}`);
    } catch (redisError) {
      console.warn("Redis rollback failed, using database rollback:", redisError);
    }
    
    // Database rollback
    const { OrderCreationService } = await import("../../../order/application/use-cases/order-creation.service");
    await OrderCreationService.rollbackStock(orderId);

    // TODO:
    // - Müşteriye bildirim gönder
  } catch (error) {
    console.error("Error handling payment_intent.canceled:", error);
  }
}

// Payment Intent işlenmeye başladığında
async function handlePaymentIntentProcessing(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const orderId = paymentIntent.metadata.order_id;

    if (!orderId) {
      console.error("Order ID not found in payment intent metadata");
      return;
    }

    // Order'ı güncelle - ödeme işleniyor
    await db
      .update(orders)
      .set({
        paymentStatus: "processing",
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`⏳ Order ${orderId} payment is processing`);
  } catch (error) {
    console.error("Error handling payment_intent.processing:", error);
  }
}
