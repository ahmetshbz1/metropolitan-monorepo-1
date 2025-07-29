//  "database-rollback.strategy.ts"
//  metropolitan backend
//  Database-specific rollback strategy

import { eq, sql } from "drizzle-orm";
import type { RollbackStrategy, RollbackResult } from "../rollback-types";

export class DatabaseRollbackStrategy implements RollbackStrategy {
  async rollback(
    orderDetails: Array<{
      userId: string;
      productId: string;
      quantity: number;
    }>,
    orderId: string
  ): Promise<RollbackResult> {
    const errors: string[] = [];
    let itemsRolledBack = 0;

    try {
      const { db } = await import(
        "../../../../../shared/infrastructure/database/connection"
      );
      const { products, orders } = await import(
        "../../../../../shared/infrastructure/database/schema"
      );

      await db.transaction(async (tx) => {
        // Rollback stock for each item
        for (const item of orderDetails) {
          try {
            await tx
              .update(products)
              .set({
                stock: sql`${products.stock} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));

            itemsRolledBack++;
            console.log(
              `🔄 Stock rolled back: Product ${item.productId} + ${item.quantity}`
            );
          } catch (error) {
            errors.push(
              `Database rollback failed for ${item.productId}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }

        // Mark order as cancelled if any items were rolled back
        if (itemsRolledBack > 0) {
          await tx
            .update(orders)
            .set({
              status: "cancelled",
              paymentStatus: "failed",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          console.log(
            `❌ Order cancelled and stock rolled back: ${orderId}`
          );
        }
      });

      return {
        success: itemsRolledBack > 0,
        method: "database",
        itemsRolledBack,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        method: "database",
        itemsRolledBack: 0,
        errors: [
          `Database transaction failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
      };
    }
  }
}