// "order-cart-operations.service.ts"
// metropolitan backend  
// Cart and order data operations for webhooks

import { eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import { cartItems, orders, orderItems } from "../../../../shared/infrastructure/database/schema";

export class OrderCartOperationsService {
  
  /**
   * Clear user's cart after successful payment
   */
  static async clearUserCart(userId: string): Promise<{
    success: boolean;
    itemsCleared: number;
    message: string;
  }> {
    try {
      return await db.transaction(async (tx) => {
        // Check if cart still has items
        const remainingCartItems = await tx
          .select({ id: cartItems.id })
          .from(cartItems)
          .where(eq(cartItems.userId, userId));

        if (remainingCartItems.length === 0) {
          return {
            success: true,
            itemsCleared: 0,
            message: `Cart already cleared for user ${userId}`,
          };
        }

        // Clear cart
        await tx.delete(cartItems).where(eq(cartItems.userId, userId));
        
        return {
          success: true,
          itemsCleared: remainingCartItems.length,
          message: `Cart cleared for user ${userId}, ${remainingCartItems.length} items removed`,
        };
      });
    } catch (error) {
      return {
        success: false,
        itemsCleared: 0,
        message: `Failed to clear cart for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get order details for stock rollback operations
   */
  static async getOrderDetailsForRollback(orderId: string): Promise<{
    success: boolean;
    orderDetails: Array<{
      userId: string;
      productId: string;
      quantity: number;
    }>;
    error?: string;
  }> {
    try {
      const orderDetails = await db
        .select({
          userId: orders.userId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(eq(orders.id, orderId));

      const validDetails = orderDetails
        .filter(detail => detail.productId && detail.quantity)
        .map(detail => ({
          userId: detail.userId,
          productId: detail.productId!,
          quantity: detail.quantity!,
        }));

      return {
        success: true,
        orderDetails: validDetails,
      };
    } catch (error) {
      return {
        success: false,
        orderDetails: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore cart items after payment cancellation/failure
   * This helps users continue shopping without re-adding items
   */
  static async restoreCartFromOrder(orderId: string): Promise<{
    success: boolean;
    itemsRestored: number;
    message: string;
  }> {
    try {
      return await db.transaction(async (tx) => {
        // Get order and its items
        const orderWithItems = await tx
          .select({
            userId: orders.userId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
          })
          .from(orders)
          .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
          .where(eq(orders.id, orderId));

        if (orderWithItems.length === 0) {
          return {
            success: false,
            itemsRestored: 0,
            message: `Order ${orderId} not found`,
          };
        }

        const userId = orderWithItems[0].userId;
        const validItems = orderWithItems.filter(item => item.productId && item.quantity);

        if (validItems.length === 0) {
          return {
            success: true,
            itemsRestored: 0,
            message: `No items to restore for order ${orderId}`,
          };
        }

        // Check current cart items to avoid duplicates
        const existingCartItems = await tx
          .select({ productId: cartItems.productId })
          .from(cartItems)
          .where(eq(cartItems.userId, userId));

        const existingProductIds = new Set(existingCartItems.map(item => item.productId));

        // Prepare cart items to restore (only non-existing ones)
        const cartItemsToRestore = validItems
          .filter(item => !existingProductIds.has(item.productId!))
          .map(item => ({
            userId: userId,
            productId: item.productId!,
            quantity: item.quantity!,
            createdAt: new Date(),
          }));

        if (cartItemsToRestore.length > 0) {
          await tx.insert(cartItems).values(cartItemsToRestore);
        }

        return {
          success: true,
          itemsRestored: cartItemsToRestore.length,
          message: `Restored ${cartItemsToRestore.length} items to cart for user ${userId}`,
        };
      });
    } catch (error) {
      return {
        success: false,
        itemsRestored: 0,
        message: `Failed to restore cart for order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get order basic information from payment intent metadata
   */
  static extractOrderInfo(metadata: any): {
    orderId?: string;
    userId?: string;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!metadata.order_id) {
      errors.push('Order ID not found in payment intent metadata');
    }
    
    if (!metadata.user_id) {
      errors.push('User ID not found in payment intent metadata');
    }

    return {
      orderId: metadata.order_id,
      userId: metadata.user_id,
      isValid: errors.length === 0,
      errors,
    };
  }
}