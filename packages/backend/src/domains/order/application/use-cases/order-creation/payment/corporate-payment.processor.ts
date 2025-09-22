//  "corporate-payment.processor.ts"
//  metropolitan backend
//  Bank transfer payment processing

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import type { OrderCreationResult, OrderItem as OrderItemData } from "@metropolitan/shared/types/order";
import { eq } from "drizzle-orm";

export class CorporatePaymentProcessor {
  /**
   * Handle bank transfer orders - require manual admin approval
   */
  static async processCorporateBankTransfer(
    tx: any,
    order: any,
    orderItemsData: OrderItemData[],
    cartItemsData: CartItemData[],
    userId: string
  ): Promise<OrderCreationResult> {
    const { orders, orderItems } = await import("../../../../../../shared/infrastructure/database/schema");
    const { CartManagementService } = await import("../cart-management.service");
    
    console.log("🏦 Banka havalesi siparişi - manuel onay bekliyor");

    // Keep order in pending status for manual approval
    const [updatedOrder] = await tx
      .update(orders)
      .set({
        status: "pending",
        paymentStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning();

    // Create order items
    await this.createOrderItems(tx, orderItems, order.id, orderItemsData);

    // Clear cart
    if (cartItemsData.length > 0) {
      await CartManagementService.clearUserCart(tx, userId);
    }

    // Note: Invoice will be generated after admin approval
    console.log("📝 Fatura admin onayından sonra oluşturulacak");

    return this.buildSuccessResult(updatedOrder || order);
  }
  
  /**
   * Create order items in database
   */
  private static async createOrderItems(
    tx: any,
    orderItemsTable: any,
    orderId: string,
    orderItemsData: OrderItemData[]
  ): Promise<void> {
    for (const itemData of orderItemsData) {
      await tx.insert(orderItemsTable).values({
        orderId: orderId,
        productId: itemData.product.id,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        totalPrice: itemData.totalPrice,
      });
    }
  }
  
  /**
   * Build success result for bank transfer order
   */
  private static buildSuccessResult(order: any): OrderCreationResult {
    console.log("📝 Building success result for order:", {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      currency: order.currency
    });

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: "pending", // Bank transfer orders need manual approval
        totalAmount: order.totalAmount,
        currency: order.currency || "PLN",
        createdAt: order.createdAt,
        paymentStatus: "pending",
      },
    };
  }
}