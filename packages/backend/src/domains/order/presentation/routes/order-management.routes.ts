//  "order-management.routes.ts"
//  metropolitan backend
//  Order management operations (cancel, update, etc.)

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { db } from "../../../../shared/infrastructure/database/connection";
import { orders, users } from "../../../../shared/infrastructure/database/schema";
import { InvoiceService } from "../../application/use-cases/invoice.service";
import { OrderTrackingService } from "../../application/use-cases/order-tracking.service";

interface AuthenticatedContext {
  user: {
    id: string;
  };
}

export const orderManagementRoutes = new Elysia()
  .use(isAuthenticated)
  .resolve(async ({ profile }) => {
    if (!profile) throw new Error("Unauthorized");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, profile.userId))
      .limit(1);

    if (!user) throw new Error("User not found");

    return { user };
  })
  // Cancel order
  .delete(
    "/:orderId",
    async ({
      user,
      params,
    }: AuthenticatedContext & { params: { orderId: string } }) => {
      const { orderId } = params;

      // Verify order belongs to user and is cancellable
      const order = await OrderTrackingService.getOrderDetails(
        orderId,
        user.id
      );

      if (!["pending", "confirmed"].includes(order.status)) {
        throw new Error("Bu sipariş artık iptal edilemez");
      }

      // Cancel the order
      await db
        .update(orders)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: "Müşteri talebi",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Invalidate invoice cache
      await InvoiceService.invalidateInvoiceCache(orderId);

      console.log(`❌ Order cancelled: ${orderId}`);

      return { 
        message: "Sipariş başarıyla iptal edildi",
        orderId,
        status: "cancelled"
      };
    },
    {
      params: t.Object({
        orderId: t.String({ format: "uuid" }),
      }),
    }
  );