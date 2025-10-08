import { t } from "elysia";

import { GetAdminOrdersService } from "../../application/use-cases/orders/get-orders.service";
import { UpdateOrderStatusService } from "../../application/use-cases/orders/update-order-status.service";
import { UpdateOrderPaymentStatusService } from "../../application/use-cases/orders/update-payment-status.service";
import { InvoiceService } from "../../../order/application/use-cases/invoice.service";
import { createAdminRouter } from "./admin-router.factory";

const updateOrderStatusSchema = t.Object({
  status: t.String({ enum: ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] }),
  trackingNumber: t.Optional(t.String()),
  shippingCompany: t.Optional(t.String()),
  cancelReason: t.Optional(t.String()),
  estimatedDelivery: t.Optional(t.String({ format: "date-time" })),
  notes: t.Optional(t.String()),
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
  );
