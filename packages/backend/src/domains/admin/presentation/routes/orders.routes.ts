import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { GetAdminOrdersService } from "../../application/use-cases/orders/get-orders.service";
import { UpdateOrderStatusService } from "../../application/use-cases/orders/update-order-status.service";

const updateOrderStatusSchema = t.Object({
  status: t.String({ enum: ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] }),
  trackingNumber: t.Optional(t.String()),
  shippingCompany: t.Optional(t.String()),
  cancelReason: t.Optional(t.String()),
});

export const adminOrdersRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/orders", (app) =>
    app
      .get("/", async ({ query, set }) => {
        try {
          const filters = {
            status: query?.status as string | undefined,
            paymentStatus: query?.paymentStatus as string | undefined,
            limit: query?.limit ? Number(query.limit) : undefined,
            offset: query?.offset ? Number(query.offset) : undefined,
          };

          const result = await GetAdminOrdersService.execute(filters);
          return result;
        } catch (error) {
          console.error("Admin orders error:", error);
          set.status = 400;
          return {
            success: false,
            message: error instanceof Error ? error.message : "Siparişler getirilemedi",
          };
        }
      })
      .patch(
        "/:id/status",
        async ({ params, body, set }) => {
          try {
            const result = await UpdateOrderStatusService.execute({
              orderId: params.id,
              ...body,
            });
            return result;
          } catch (error) {
            set.status = 400;
            return {
              success: false,
              message: error instanceof Error ? error.message : "Sipariş durumu güncellenemedi",
            };
          }
        },
        {
          params: t.Object({ id: t.String({ format: "uuid" }) }),
          body: updateOrderStatusSchema,
        }
      )
  );
