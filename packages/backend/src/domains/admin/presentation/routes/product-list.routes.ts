//  "product-list.routes.ts"
//  metropolitan backend
//  Ürün listeleme ve export rotaları

import { t } from "elysia";

import { AdminExportProductsService } from "../../application/use-cases/products/export-products.service";
import { AdminGetProductsService } from "../../application/use-cases/products/get-products.service";
import {
  AdminGetStockAlertsService,
  type StockAlertLevel,
} from "../../application/use-cases/products/get-stock-alerts.service";

import { createAdminRouter } from "./admin-router.factory";

export const productListRoutes = createAdminRouter()
  .get(
    "/",
    async ({ query, set }) => {
      const limit = query.limit ? Number(query.limit) : undefined;
      const offset = query.offset ? Number(query.offset) : undefined;
      const search = query.search || undefined;
      const categoryId = query.categoryId || undefined;

      if (
        (limit !== undefined && Number.isNaN(limit)) ||
        (offset !== undefined && Number.isNaN(offset))
      ) {
        set.status = 400;
        return {
          success: false,
          message: "Geçersiz limit veya offset değeri",
        };
      }

      try {
        const result = await AdminGetProductsService.execute({
          limit,
          offset,
          search,
          categoryId,
        });
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Ürünler getirilemedi",
        };
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        search: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/export",
    async ({ query, set }) => {
      const formatParam = query.format?.toLowerCase() ?? "csv";

      if (formatParam !== "csv" && formatParam !== "xlsx") {
        set.status = 400;
        return {
          success: false,
          message: "Geçersiz format. 'csv' veya 'xlsx' kullanın.",
        };
      }

      try {
        const exportFile = await AdminExportProductsService.execute({
          format: formatParam,
          languageCode: query.languageCode ?? "tr",
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `products-${timestamp}.${exportFile.fileExtension}`;

        set.headers["Content-Type"] = exportFile.contentType;
        set.headers[
          "Content-Disposition"
        ] = `attachment; filename="${filename}"`;
        set.headers["Cache-Control"] = "no-store";

        return new Response(exportFile.buffer);
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Ürünler dışa aktarılamadı",
        };
      }
    },
    {
      query: t.Object({
        format: t.Optional(t.String()),
        languageCode: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/stock-alerts",
    async ({ query, set }) => {
      const limit = query.limit ? Number(query.limit) : undefined;

      if (query.limit && Number.isNaN(limit)) {
        set.status = 400;
        return {
          success: false,
          message: "Geçersiz limit değeri",
        };
      }

      const level = query.level as StockAlertLevel | undefined;

      try {
        const result = await AdminGetStockAlertsService.execute({
          limit,
          level,
          search: query.search ?? null,
        });
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Stok uyarıları getirilemedi",
        };
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        level: t.Optional(t.String({ enum: ["critical", "warning"] as const })),
        search: t.Optional(t.String()),
      }),
    }
  );
