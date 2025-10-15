//  "order-creation.service.ts"
//  metropolitan backend
//  Refactored: Main orchestration service for order creation
//  Now coordinates between specialized services for better modularity

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import type {
  OrderCreationRequest,
  OrderCreationResult,
  OrderItem as OrderItemData,
} from "@metropolitan/shared/types/order";
import { eq } from "drizzle-orm";

import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";
import { db } from "../../../../shared/infrastructure/database/connection";
import {
  orders,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

// Refactored modular services
import { CartManagementService } from "./order-creation/cart-management.service";
import { PaymentProcessingService } from "./order-creation/payment-processing.service";
import { StockManagementService } from "./order-creation/stock-management.service";

export class OrderCreationService {
  /**
   * Main order creation orchestrator - coordinates between specialized services
   * This is now the main entry point that delegates to modular services
   */

  /**
   * Main Stripe order creation method - now uses modular services
   */
  static async createOrderWithStripe(
    userId: string,
    request: OrderCreationRequest,
    orderItemsData: OrderItemData[],
    cartItemsData: CartItemData[],
    totalAmount: number
  ): Promise<OrderCreationResult> {
    try {
      const result = await db.transaction(async (tx) => {
        // 1. CRITICAL: Stock validation and reservation (delegated)
        await StockManagementService.validateAndReserveStock(tx, orderItemsData, userId);

        const isStripePayment = PaymentProcessingService.isStripePayment(request.paymentMethodId);
        const isBankTransfer = request.paymentMethodId === "bank_transfer";

        // Get user info for corporate customer check
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

      // Create order (delegated)
      const orderPayload = PaymentProcessingService.createOrderPayload(
        userId,
        request,
        totalAmount,
        isStripePayment
      );

      logger.info("Creating order", { userId, totalAmount, paymentMethodId: request.paymentMethodId });
      const [order] = await tx.insert(orders).values(orderPayload).returning();
      if (!order) throw new Error("Sipariş oluşturulamadı");

      // Handle corporate bank transfer (requires manual approval)
      if (isBankTransfer && user.userType === "corporate") {
        const bankTransferResult = await PaymentProcessingService.handleCorporateBankTransfer(
          tx,
          order,
          orderItemsData,
          cartItemsData,
          userId
        );
        // Bank transfer handler already returns a formatted OrderCreationResult
        return bankTransferResult;
      }

      // Process Stripe payment (delegated)
      const stripeInfo = await PaymentProcessingService.processStripePayment(
        order,
        request,
        cartItemsData,
        userId
      );

      // Update order with Stripe info (delegated)
      await PaymentProcessingService.updateOrderWithStripeInfo(
        tx,
        order.id,
        stripeInfo.paymentIntentId,
        stripeInfo.clientSecret
      );

      // Create order items (delegated)
      await CartManagementService.createOrderItems(tx, order.id, orderItemsData);

      // DON'T clear cart here - wait for payment success
      // Cart will be cleared in webhook after payment confirmation
      logger.debug("Cart will be cleared after payment confirmation via webhook", { orderId: order.id });

      // NOT SENDING PUSH HERE: User hasn't even started payment process yet
      // Push will be sent only after successful payment via webhook
      logger.debug("Not sending payment pending push - user hasn't started payment yet", { orderId: order.id });

        return {
          ...order,
          stripePaymentIntentId: stripeInfo.paymentIntentId,
          stripeClientSecret: stripeInfo.clientSecret,
          stripeCheckoutUrl: stripeInfo.checkoutUrl, // Web için Stripe Checkout URL
        };
      });

      // Check if result is already formatted (bank transfer case)
      if (result && typeof result === 'object' && 'success' in result && 'order' in result) {
        return result as OrderCreationResult;
      }

      // Format result for Stripe payment cases
      return this.formatOrderCreationResult(result);
    } catch (error) {
      // Database transaction failed - rollback Redis reservations
      logger.error("Order creation failed, rolling back Redis reservations", {
        error: error instanceof Error ? error.message : String(error),
        userId
      });

      try {
        await StockManagementService.rollbackOrderItemsFromData(orderItemsData, userId);
        logger.info("Redis reservations rolled back successfully", { userId });
      } catch (rollbackError) {
        logger.error("Redis rollback failed", {
          error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          userId
        });
      }

      throw error;
    }
  }

  /**
   * Ödeme tamamlandıktan sonra sipariş işlemlerini finalize eder (delegated)
   * Bu method webhook'dan çağrılır
   */
  static async finalizeOrderAfterPayment(orderId: string): Promise<void> {
    await CartManagementService.finalizeOrderAfterPayment(orderId);

    // Push notification is now sent from webhook handler
    logger.debug("Push notification will be sent from webhook handler", { orderId });
  }

  /**
   * Legacy method - now also uses modular services for consistency
   */
  static async createOrderWithTransaction(
    userId: string,
    request: OrderCreationRequest,
    orderItemsData: OrderItemData[],
    cartItemsData: CartItemData[],
    totalAmount: number
  ): Promise<OrderCreationResult> {
    logger.warn("Legacy order creation method used - consider using createOrderWithStripe", { userId });

    const result = await db.transaction(async (tx) => {
      // Create order using modular service
      const orderPayload = PaymentProcessingService.createOrderPayload(
        userId,
        request,
        totalAmount,
        false // not Stripe payment
      );

      const [order] = await tx.insert(orders).values(orderPayload).returning();
      if (!order) throw new Error("Sipariş oluşturulamadı");

      // Use modular services
      await CartManagementService.createOrderItems(tx, order.id, orderItemsData);
      await StockManagementService.fallbackDatabaseStockReservation?.(tx, orderItemsData);
      // DON'T clear cart for legacy orders either - depends on payment method
      logger.debug("Legacy order created, cart clearing depends on payment method", { orderId: order.id, userId });

      return order;
    });

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
   * Formats order creation result based on order status
   */
  private static formatOrderCreationResult(order: any): OrderCreationResult {
    const baseResult = {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        paymentStatus: order.paymentStatus || "pending",
      },
    };

    // Add Stripe payment info if available
    if (order.stripePaymentIntentId) {
      (baseResult.order as any).stripePaymentIntentId = order.stripePaymentIntentId;
      (baseResult.order as any).stripeClientSecret = order.stripeClientSecret;
    }

    // Add Stripe Checkout URL if available (for web)
    if (order.stripeCheckoutUrl) {
      (baseResult.order as any).stripeCheckoutUrl = order.stripeCheckoutUrl;
    }

    return baseResult;
  }

  /**
   * Rollback stock if order fails (delegated to StockManagementService)
   */
  static async rollbackStock(orderId: string): Promise<void> {
    await StockManagementService.rollbackStock(orderId);
  }
}
