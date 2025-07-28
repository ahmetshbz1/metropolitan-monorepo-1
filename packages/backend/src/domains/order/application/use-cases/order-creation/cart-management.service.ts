//  "cart-management.service.ts"
//  metropolitan backend
//  Cart management logic extracted from OrderCreationService

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";
import { eq } from "drizzle-orm";

export class CartManagementService {
  /**
   * Clear user cart after successful order creation
   */
  static async clearUserCart(tx: any, userId: string): Promise<void> {
    const { cartItems } = await import("../../../../../shared/infrastructure/database/schema");
    
    const deletedItems = await tx
      .delete(cartItems)
      .where(eq(cartItems.userId, userId))
      .returning({ id: cartItems.id });

    console.log(
      `🛒 Cart cleared: ${deletedItems.length} items removed for user ${userId}`
    );
  }

  /**
   * Creates order items in batch to prevent N+1 query problem
   */
  static async createOrderItems(
    tx: any,
    orderId: string,
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    const { orderItems } = await import("../../../../../shared/infrastructure/database/schema");
    
    // Batch insert for order items - eliminates N+1 query problem
    const orderItemsToInsert = orderItemsData.map(itemData => ({
      orderId: orderId,
      productId: itemData.product.id,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      totalPrice: itemData.totalPrice,
    }));

    if (orderItemsToInsert.length > 0) {
      await tx.insert(orderItems).values(orderItemsToInsert);
      console.log(`📦 Created ${orderItemsToInsert.length} order items for order ${orderId}`);
    }
  }

  /**
   * Legacy method: Finalize order after payment
   * This method handles final cart clearing and stock updates after payment completion
   */
  static async finalizeOrderAfterPayment(orderId: string): Promise<void> {
    const { db } = await import("../../../../../shared/infrastructure/database/connection");
    const { orders, cartItems, products } = await import("../../../../../shared/infrastructure/database/schema");
    const { sql } = await import("drizzle-orm");

    await db.transaction(async (tx) => {
      // Get order info
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

      // Get cart items (for stock update)
      const userCartItems = await tx
        .select({
          productId: cartItems.productId,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.userId, order.userId));

      // Update stock levels
      for (const item of userCartItems) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }

      // Clear cart
      await this.clearUserCart(tx, order.userId);
    });

    // Generate invoice in background
    const { PaymentProcessingService } = await import("./payment-processing.service");
    PaymentProcessingService.createInvoiceInBackground?.(orderId, "system");
    
    console.log(`✅ Order finalized after payment: ${orderId}`);
  }
}