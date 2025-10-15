import { eq, inArray } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/connection";
import { orders } from "../../../../../shared/infrastructure/database/schema";

export class AdminDeleteOrderService {
  static async execute(orderId: string) {
    const existingOrder = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length === 0) {
      throw new Error("Sipariş bulunamadı");
    }

    // Sipariş silinmeden önce stok iadesi yap
    await this.rollbackStockOnDeletion(orderId);

    await db.delete(orders).where(eq(orders.id, orderId));

    return {
      success: true,
      message: "Sipariş başarıyla silindi",
    };
  }

  static async bulkDelete(orderIds: string[]) {
    if (orderIds.length === 0) {
      throw new Error("Silinecek sipariş bulunamadı");
    }

    const existingOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(inArray(orders.id, orderIds));

    if (existingOrders.length === 0) {
      throw new Error("Hiçbir sipariş bulunamadı");
    }

    // Toplu silmeden önce tüm siparişler için stok iadesi yap
    await Promise.allSettled(
      existingOrders.map((order) => this.rollbackStockOnDeletion(order.id))
    );

    await db.delete(orders).where(inArray(orders.id, orderIds));

    return {
      success: true,
      message: `${existingOrders.length} sipariş başarıyla silindi`,
      deletedCount: existingOrders.length,
    };
  }

  /**
   * Sipariş silinmeden önce stok iadesi yap
   */
  private static async rollbackStockOnDeletion(orderId: string): Promise<void> {
    try {
      console.log(`🔄 Admin deleting order, rolling back stock for order ${orderId}...`);

      const { WebhookStockRollbackService } = await import(
        "../../../../payment/application/webhook/stock-rollback.service"
      );

      const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

      if (rollbackResult.success) {
        console.log(`✅ Stock rollback successful for deleted order ${orderId}`);
        console.log(
          `   Redis: ${rollbackResult.redisRollback ? "✅" : "❌"}, Database: ${rollbackResult.databaseRollback ? "✅" : "❌"}`
        );
      } else {
        console.error(`❌ Stock rollback failed for deleted order ${orderId}:`, rollbackResult.errors);
      }
    } catch (error) {
      console.error(`❌ Stock rollback error for deleted order ${orderId}:`, error);
    }
  }
}
