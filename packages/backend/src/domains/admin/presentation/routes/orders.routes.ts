import { t } from "elysia";

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { InvoiceService } from "../../../order/application/use-cases/invoice.service";
import { AdminDeleteOrderService } from "../../application/use-cases/orders/delete-order.service";
import { AdminExportOrdersService } from "../../application/use-cases/orders/export-orders.service";
import { GetAdminOrdersService } from "../../application/use-cases/orders/get-orders.service";
import { UpdateOrderStatusService } from "../../application/use-cases/orders/update-order-status.service";
import { UpdateOrderPaymentStatusService } from "../../application/use-cases/orders/update-payment-status.service";

import { createAdminRouter } from "./admin-router.factory";

const updateOrderStatusSchema = t.Object({
  status: t.String({ enum: ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] }),
  trackingNumber: t.Optional(t.Union([t.String(), t.Null()])),
  shippingCompany: t.Optional(t.Union([t.String(), t.Null()])),
  cancelReason: t.Optional(t.Union([t.String(), t.Null()])),
  estimatedDelivery: t.Optional(t.Union([t.String({ format: "date-time" }), t.Null()])),
  notes: t.Optional(t.Union([t.String(), t.Null()])),
});

const updateOrderPaymentStatusSchema = t.Object({
  paymentStatus: t.String({
    enum: ["pending", "processing", "requires_action", "completed", "succeeded", "failed", "canceled"],
  }),
});

export const adminOrdersRoutes = createAdminRouter("/admin/orders")
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
      logger.error({ error, context: "AdminOrdersRoutes" }, "Admin orders error");
      set.status = 400;
      return {
        success: false,
        message: error instanceof Error ? error.message : "Siparişler getirilemedi",
      };
    }
  })
  .get(
    "/export",
    async ({ query, set }) => {
      const formatParam = query?.format?.toLowerCase() ?? "csv";

      if (formatParam !== "csv" && formatParam !== "xlsx") {
        set.status = 400;
        return {
          success: false,
          message: "Geçersiz format. 'csv' veya 'xlsx' kullanın.",
        };
      }

      try {
        const exportFile = await AdminExportOrdersService.execute({
          format: formatParam,
          status: query?.status,
          paymentStatus: query?.paymentStatus,
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `orders-${timestamp}.${exportFile.fileExtension}`;

        set.headers["Content-Type"] = exportFile.contentType;
        set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
        set.headers["Cache-Control"] = "no-store";

        return new Response(exportFile.buffer);
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Siparişler dışa aktarılamadı",
        };
      }
    },
    {
      query: t.Object({
        format: t.Optional(t.String()),
        status: t.Optional(t.String()),
        paymentStatus: t.Optional(t.String()),
      }),
    }
  )
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
  .get(
    "/:id/invoice",
    async ({ params, set }) => {
      try {
        const pdfBuffer = await InvoiceService.generateInvoicePDFForAdmin(params.id);

        set.headers["Content-Type"] = "application/pdf";
        set.headers["Content-Disposition"] = `inline; filename="invoice-${params.id}.pdf"`;
        set.headers["Content-Length"] = pdfBuffer.length.toString();

        return new Response(pdfBuffer);
      } catch (error) {
        set.status = 404;
        return {
          success: false,
          message: error instanceof Error ? error.message : "Fatura bulunamadı",
        };
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    }
  )
  .patch(
    "/:id/payment-status",
    async ({ params, body, set }) => {
      try {
        const result = await UpdateOrderPaymentStatusService.execute({
          orderId: params.id,
          paymentStatus: body.paymentStatus,
        });
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: error instanceof Error ? error.message : "Ödeme durumu güncellenemedi",
        };
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: updateOrderPaymentStatusSchema,
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const result = await AdminDeleteOrderService.execute(params.id);
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: error instanceof Error ? error.message : "Sipariş silinemedi",
        };
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    }
  )
  .post(
    "/bulk-delete",
    async ({ body, set }) => {
      try {
        const result = await AdminDeleteOrderService.bulkDelete(body.orderIds);
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: error instanceof Error ? error.message : "Siparişler silinemedi",
        };
      }
    },
    {
      body: t.Object({
        orderIds: t.Array(t.String({ format: "uuid" })),
      }),
    }
  );
