//  "product-update.routes.ts"
//  metropolitan backend
//  Ürün güncelleme rotaları

import { eq } from "drizzle-orm";
import { t } from "elysia";

import { db } from "../../../../shared/infrastructure/database/connection";
import { categories } from "../../../../shared/infrastructure/database/schema";
import {
  type AdminProductPayload,
  type AdminUpdateProductPayload,
} from "../../application/use-cases/products/product.types";
import { AdminUpdateProductQuickSettingsService } from "../../application/use-cases/products/update-product-quick-settings.service";
import { AdminUpdateProductStockService } from "../../application/use-cases/products/update-product-stock.service";
import { AdminUpdateProductService } from "../../application/use-cases/products/update-product.service";

import { createAdminRouter } from "./admin-router.factory";
import { createProductSchema } from "./product-schemas";

export const productUpdateRoutes = createAdminRouter()
  .put(
    "/:id",
    async ({ body, params, set }) => {
      try {
        const payload: AdminUpdateProductPayload = {
          ...(body as AdminProductPayload),
          productId: params.id,
        };

        if (payload.categoryId) {
          const existingCategory = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.id, payload.categoryId))
            .limit(1);

          if (existingCategory.length === 0) {
            set.status = 400;
            return {
              success: false,
              message: "Geçersiz kategori seçimi",
            };
          }
        }

        const result = await AdminUpdateProductService.execute(
          payload as AdminUpdateProductPayload
        );
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Ürün güncellenemedi",
        };
      }
    },
    {
      body: createProductSchema,
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    }
  )
  .patch(
    "/:id/quick-settings",
    async ({ params, body, set, admin }) => {
      try {
        const result = await AdminUpdateProductQuickSettingsService.execute({
          productId: params.id,
          stock: body.stock,
          individualPrice: body.individualPrice,
          corporatePrice: body.corporatePrice,
          minQuantityIndividual: body.minQuantityIndividual,
          minQuantityCorporate: body.minQuantityCorporate,
          quantityPerBox: body.quantityPerBox,
          adminUserId: admin.id,
        });
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Hızlı ürün bilgisi güncellenemedi",
        };
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        stock: t.Optional(t.Number({ minimum: 0 })),
        individualPrice: t.Optional(
          t.Union([t.Number({ minimum: 0 }), t.Null()])
        ),
        corporatePrice: t.Optional(
          t.Union([t.Number({ minimum: 0 }), t.Null()])
        ),
        minQuantityIndividual: t.Optional(t.Number({ minimum: 0 })),
        minQuantityCorporate: t.Optional(t.Number({ minimum: 0 })),
        quantityPerBox: t.Optional(
          t.Union([t.Number({ minimum: 0 }), t.Null()])
        ),
      }),
    }
  )
  .patch(
    "/:id/stock",
    async ({ params, body, set, admin }) => {
      try {
        const result = await AdminUpdateProductStockService.execute({
          productId: params.id,
          stock: body.stock,
          adminUserId: admin.id,
        });
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Stok güncellenemedi",
        };
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        stock: t.Number({ minimum: 0 }),
      }),
    }
  );
