//  "invoices.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 09.07.2025.

import { t } from "elysia";
import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { InvoiceCacheService } from "../../application/use-cases/invoice-cache.service";
import { InvoiceService } from "../../application/use-cases/invoice.service";

export const invoicesRoutes = createApp()
  .use(isAuthenticated)
  .group("/invoices", (app) =>
    app

      // Fatura PDF'ini indir
      .get(
        "/:orderId/download",
        async ({ params, profile, error, set }) => {
          try {
            const { orderId } = params;

            if (!profile) {
              return error(401, "Unauthorized");
            }

            // PDF oluştur
            const pdfBuffer = await InvoiceService.generateInvoicePDF(
              orderId,
              profile.userId
            );

            // Response headers'ını ayarla
            set.headers["Content-Type"] = "application/pdf";
            set.headers["Content-Disposition"] =
              `attachment; filename="fatura-${orderId}.pdf"`;
            set.headers["Content-Length"] = pdfBuffer.length.toString();

            return new Response(pdfBuffer);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Fatura oluşturulamadı";
            return error(500, message);
          }
        },
        {
          params: t.Object({
            orderId: t.String({ format: "uuid" }),
          }),
        }
      )

      // Fatura verilerini JSON olarak getir (önizleme için)
      .get(
        "/:orderId/data",
        async ({ params, profile, error }) => {
          try {
            const { orderId } = params;

            if (!profile) {
              return error(401, "Unauthorized");
            }

            const invoiceData = await InvoiceService.getInvoiceData(
              orderId,
              profile.userId
            );

            return {
              success: true,
              data: invoiceData,
            };
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Fatura verileri alınamadı";
            return error(404, message);
          }
        },
        {
          params: t.Object({
            orderId: t.String({ format: "uuid" }),
          }),
        }
      )

      // Cache yönetimi endpoint'leri (admin için)
      .group("/cache", (app) =>
        app

          // Cache istatistiklerini getir
          .get("/stats", async () => {
            const stats = await InvoiceCacheService.getCacheStats();
            return {
              success: true,
              data: stats,
            };
          })

          // Belirli bir siparişin cache'ini ve PDF dosyasını temizle
          .delete(
            "/:orderId",
            async ({ params }) => {
              const { orderId } = params;
              await InvoiceService.invalidateInvoice(orderId);
              return {
                success: true,
                message: `Sipariş ${orderId} için fatura cache'i ve PDF dosyası temizlendi`,
              };
            },
            {
              params: t.Object({
                orderId: t.String({ format: "uuid" }),
              }),
            }
          )

          // Tüm fatura cache'lerini temizle
          .delete("/all", async () => {
            const deletedCount =
              await InvoiceCacheService.clearAllInvoiceCache();
            return {
              success: true,
              message: `${deletedCount} fatura cache'i temizlendi`,
            };
          })
      )
  );
