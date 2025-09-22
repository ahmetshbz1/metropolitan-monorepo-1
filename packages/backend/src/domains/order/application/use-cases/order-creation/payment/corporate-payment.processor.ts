//  "corporate-payment.processor.ts"
//  metropolitan backend
//  Corporate bank transfer payment processing

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import type { OrderCreationResult, OrderItem as OrderItemData } from "@metropolitan/shared/types/order";
import { eq } from "drizzle-orm";

import { BackgroundInvoiceService } from "./background-invoice.service";

export class CorporatePaymentProcessor {
  /**
   * Handle corporate bank transfer with auto-approval
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
    
    console.log("🏢 Kurumsal müşteri banka havalesi - otomatik onay");

    // Auto-approve order
    await tx
      .update(orders)
      .set({
        status: "confirmed",
        paymentStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // Create order items
    await this.createOrderItems(tx, orderItems, order.id, orderItemsData);

    // Clear cart
    if (cartItemsData.length > 0) {
      await CartManagementService.clearUserCart(tx, userId);
    }

    // Generate invoice in background
    BackgroundInvoiceService.scheduleInvoiceGeneration(order.id, userId);

    return this.buildSuccessResult(order);
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
   * Build success result for corporate order
   */
  private static buildSuccessResult(order: any): OrderCreationResult {
    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: "confirmed",
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        paymentStatus: "pending",
      },
    };
  }
}