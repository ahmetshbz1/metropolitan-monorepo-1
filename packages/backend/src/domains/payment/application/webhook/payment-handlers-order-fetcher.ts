// payment-handlers-order-fetcher.ts
// Order bilgisi fetching utility

import type { OrderInfo } from "./payment-handlers-types";

/**
 * Order bilgisini database'den fetch eder
 * Push notification için gerekli minimal bilgileri alır
 */
export async function fetchOrderForNotification(orderId: string): Promise<OrderInfo | null> {
  const { db } = await import("../../../../shared/infrastructure/database/connection");
  const { orders } = await import("../../../../shared/infrastructure/database/schema");
  const { eq } = await import("drizzle-orm");

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      orderNumber: orders.orderNumber,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return order || null;
}
