//  "products.routes.ts"
//  metropolitan backend
//  Admin ürün yönetimi rotaları

import { eq } from "drizzle-orm";
import { t } from "elysia";

import { db } from "../../../../shared/infrastructure/database/connection";
import { categories } from "../../../../shared/infrastructure/database/schema";
import { AdminCreateProductService } from "../../application/use-cases/products/create-product.service";
import { AdminDeleteProductService } from "../../application/use-cases/products/delete-product.service";
import { AdminGetProductsService } from "../../application/use-cases/products/get-products.service";
import {
  AdminGetStockAlertsService,
  type StockAlertLevel,
} from "../../application/use-cases/products/get-stock-alerts.service";
import { ProductImageService } from "../../application/use-cases/products/product-image.service";
import {
  SUPPORTED_LANGUAGES,
  type AdminProductPayload,
  type AdminUpdateProductPayload,
} from "../../application/use-cases/products/product.types";
import { AdminUpdateProductService } from "../../application/use-cases/products/update-product.service";
import { AdminUpdateProductStockService } from "../../application/use-cases/products/update-product-stock.service";
import { AdminUpdateProductQuickSettingsService } from "../../application/use-cases/products/update-product-quick-settings.service";
import { AdminExportProductsService } from "../../application/use-cases/products/export-products.service";
import { AdminImportProductsService } from "../../application/use-cases/products/import-products.service";

const translationSchema = t.Object({
  languageCode: t.String({
    enum: SUPPORTED_LANGUAGES as unknown as readonly string[],
  }),
  name: t.String({ minLength: 1 }),
  fullName: t.Optional(t.String()),
  description: t.Optional(t.String()),
});

const baseProductSchema = {
  productCode: t.String({ minLength: 2 }),
  categoryId: t.Optional(t.String()),
  brand: t.Optional(t.String()),
  size: t.Optional(t.String()),
  imageUrl: t.Optional(t.String()),
  price: t.Optional(t.Number()),
  currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
  stock: t.Optional(t.Number()),
  tax: t.Optional(t.Number()),
  allergens: t.Optional(t.Array(t.String())),
  nutritionalValues: t.Optional(
    t.Object({
      energy: t.Optional(t.String()),
      fat: t.Optional(t.String()),
      saturatedFat: t.Optional(t.String()),
      carbohydrates: t.Optional(t.String()),
      sugar: t.Optional(t.String()),
      protein: t.Optional(t.String()),
      salt: t.Optional(t.String()),
    })
  ),
  netQuantity: t.Optional(t.String()),
  expiryDate: t.Optional(t.String({ format: "date-time" })),
  storageConditions: t.Optional(t.String()),
  manufacturerInfo: t.Optional(t.Record(t.String(), t.Any())),
  originCountry: t.Optional(t.String()),
  badges: t.Optional(
    t.Object({
      halal: t.Optional(t.Boolean()),
      vegetarian: t.Optional(t.Boolean()),
      vegan: t.Optional(t.Boolean()),
      glutenFree: t.Optional(t.Boolean()),
      organic: t.Optional(t.Boolean()),
      lactoseFree: t.Optional(t.Boolean()),
    })
  ),
  individualPrice: t.Optional(t.Number()),
  corporatePrice: t.Optional(t.Number()),
  minQuantityIndividual: t.Optional(t.Number()),
  minQuantityCorporate: t.Optional(t.Number()),
  quantityPerBox: t.Optional(t.Number()),
  translations: t.Array(translationSchema, { minItems: 1 }),
};

const createProductSchema = t.Object(baseProductSchema);

import { createAdminRouter } from "./admin-router.factory";

export const adminProductsRoutes = createAdminRouter("/admin/products")
  .get(
    "/",
    async ({ query, set }) => {
      const limit = query.limit ? Number(query.limit) : undefined;
      const offset = query.offset ? Number(query.offset) : undefined;
      const search = query.search || undefined;

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
        set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
        set.headers["Cache-Control"] = "no-store";

        return new Response(exportFile.buffer);
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Ürünler dışa aktarılamadı",
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
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        if (body.categoryId) {
          const existingCategory = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.id, body.categoryId))
            .limit(1);

          if (existingCategory.length === 0) {
            set.status = 400;
            return {
              success: false,
              message: "Geçersiz kategori seçimi",
            };
          }
        }

        const result = await AdminCreateProductService.execute(
          body as AdminProductPayload
        );
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Ürün oluşturulamadı",
        };
      }
    },
    {
      body: createProductSchema,
    }
  )
  .post(
    "/import",
    async ({ body, set }) => {
      if (!body.file) {
        set.status = 400;
        return {
          success: false,
          message: "Dosya yüklenmedi",
        };
      }

      try {
        const summary = await AdminImportProductsService.execute(body.file);
        return {
          success: true,
          summary,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Toplu yükleme başarısız",
        };
      }
    },
    {
      body: t.Object({
        file: t.File({ maxSize: 5 * 1024 * 1024 }),
      }),
    }
  )
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
    async ({ params, body, set }) => {
      try {
        const result = await AdminUpdateProductQuickSettingsService.execute({
          productId: params.id,
          stock: body.stock,
          individualPrice: body.individualPrice,
          corporatePrice: body.corporatePrice,
          minQuantityIndividual: body.minQuantityIndividual,
          minQuantityCorporate: body.minQuantityCorporate,
          quantityPerBox: body.quantityPerBox,
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
    async ({ params, body, set }) => {
      try {
        const result = await AdminUpdateProductStockService.execute({
          productId: params.id,
          stock: body.stock,
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
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const result = await AdminDeleteProductService.execute(params.id);
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: error instanceof Error ? error.message : "Ürün silinemedi",
        };
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    }
  )
  .post(
    "/upload-image",
    async ({ body, set }) => {
      try {
        if (!body.image) {
          set.status = 400;
          return {
            success: false,
            message: "Görsel dosyası gerekli",
          };
        }

        const imageUrl = await ProductImageService.uploadProductImage(
          body.image
        );
        return {
          success: true,
          imageUrl,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Görsel yüklenemedi",
        };
      }
    },
    {
      body: t.Object({
        image: t.File({
          maxSize: 5 * 1024 * 1024,
        }),
      }),
    }
  )
  .delete(
    "/delete-image",
    async ({ body, set }) => {
      try {
        if (!body.imageUrl) {
          set.status = 400;
          return {
            success: false,
            message: "Görsel URL'si gerekli",
          };
        }

        await ProductImageService.deleteProductImage(body.imageUrl);
        return {
          success: true,
          message: "Görsel silindi",
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Görsel silinemedi",
        };
      }
    },
    {
      body: t.Object({
        imageUrl: t.String(),
      }),
    }
  );
