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

    await db.delete(orders).where(inArray(orders.id, orderIds));

    return {
      success: true,
      message: `${existingOrders.length} sipariş başarıyla silindi`,
      deletedCount: existingOrders.length,
    };
  }
}
