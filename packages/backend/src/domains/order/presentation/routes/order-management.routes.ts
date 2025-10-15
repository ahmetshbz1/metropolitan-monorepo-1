//  "order-management.routes.ts"
//  metropolitan backend
//  Order management operations (cancel, update, etc.)

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { db } from "../../../../shared/infrastructure/database/connection";
import { orders, users } from "../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { WebhookStockRollbackService } from "../../../payment/application/webhook/stock-rollback.service";
import { InvoiceService } from "../../application/use-cases/invoice.service";
import { OrderTrackingService } from "../../application/use-cases/order-tracking.service";

interface AuthenticatedContext {
  user: {
    id: string;
  };
}

export const orderManagementRoutes = new Elysia()
  .use(isAuthenticated)
  .resolve(async ({ profile, set }) => {
    if (!profile) throw new Error("Unauthorized");

    const userId = profile?.sub || profile?.userId;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      set.status = 401;
      throw new Error("User not found");
    }

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

      logger.info({ orderId, context: "OrderManagementRoutes" }, "Order cancelled");

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
  )
  // Rollback stock for failed payments
  .post(
    "/:orderId/rollback-stock",
    async ({
      user,
      params,
    }: AuthenticatedContext & { params: { orderId: string } }) => {
      const { orderId } = params;

      logger.info({ orderId, userId: user.id, context: "OrderManagementRoutes" }, "Manual stock rollback requested");

      try {
        // Verify order belongs to user
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (!order) {
          throw new Error("Sipariş bulunamadı");
        }

        if (order.userId !== user.id) {
          throw new Error("Bu siparişe erişim yetkiniz yok");
        }

        // Only allow rollback for pending/failed orders
        if (!["pending", "failed", "cancelled"].includes(order.status)) {
          throw new Error("Bu sipariş durumu için stok geri alımı yapılamaz");
        }

        // Perform stock rollback
        const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

        if (!rollbackResult.success) {
          logger.error({ orderId, errors: rollbackResult.errors, context: "OrderManagementRoutes" }, "Stock rollback failed");
          throw new Error(`Stok geri alımı başarısız: ${rollbackResult.errors.join(", ")}`);
        }

        logger.info({ orderId, message: rollbackResult.message, context: "OrderManagementRoutes" }, "Stock rollback successful");

        return {
          success: true,
          message: "Stok başarıyla geri alındı",
          orderId,
          rollbackDetails: {
            redisRollback: rollbackResult.redisRollback,
            databaseRollback: rollbackResult.databaseRollback,
          },
        };
      } catch (error: any) {
        logger.error({ orderId, error, context: "OrderManagementRoutes" }, "Stock rollback failed");
        throw new Error(error.message || "Stok geri alımı başarısız oldu");
      }
    },
    {
      params: t.Object({
        orderId: t.String({ format: "uuid" }),
      }),
    }
  );