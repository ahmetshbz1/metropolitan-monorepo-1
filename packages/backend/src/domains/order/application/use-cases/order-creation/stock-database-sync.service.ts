//  "stock-database-sync.service.ts"
//  metropolitan backend
//  Database synchronization operations for stock management

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";
import { eq, sql } from "drizzle-orm";

import { products } from "../../../../../shared/infrastructure/database/schema";

import type { RedisReservation } from "./stock-redis-operations.service";

export class StockDatabaseSyncService {
  /**
   * Sync database with Redis reservations for consistency
   */
  static async syncWithRedisReservations(
    tx: any,
    orderItemsData: OrderItemData[],
    redisReservations: RedisReservation[]
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
   * Direct database stock reservation (fallback method)
   */
  static async reserveStockInDatabase(
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
}