//  "stripe-order-updater.ts"
//  metropolitan backend
//  Service for updating orders with Stripe information

import { eq } from "drizzle-orm";

export class StripeOrderUpdater {
  /**
   * Update order with Stripe payment information
   */
  static async updateWithStripeInfo(
    tx: any,
    orderId: string,
    paymentIntentId: string,
    clientSecret: string
  ): Promise<void> {
    const { orders } = await import("../../../../../../shared/infrastructure/database/schema");
    
    await tx
      .update(orders)
      .set({
        stripePaymentIntentId: paymentIntentId,
        stripeClientSecret: clientSecret,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }
}