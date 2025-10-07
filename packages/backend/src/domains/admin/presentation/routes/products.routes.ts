//  "products.routes.ts"
//  metropolitan backend
//  Admin ürün yönetimi rotaları

import { t } from "elysia";
import { eq } from "drizzle-orm";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { db } from "../../../../shared/infrastructure/database/connection";
import { categories } from "../../../../shared/infrastructure/database/schema";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { AdminCreateProductService } from "../../application/use-cases/products/create-product.service";
import { AdminDeleteProductService } from "../../application/use-cases/products/delete-product.service";
import { AdminGetProductsService } from "../../application/use-cases/products/get-products.service";
import { AdminUpdateProductService } from "../../application/use-cases/products/update-product.service";
import { ProductImageService } from "../../application/use-cases/products/product-image.service";
import {
  SUPPORTED_LANGUAGES,
  type AdminProductPayload,
  type AdminUpdateProductPayload,
} from "../../application/use-cases/products/product.types";

const translationSchema = t.Object({
  languageCode: t.String({ enum: SUPPORTED_LANGUAGES as unknown as readonly string[] }),
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
  allergens: t.Optional(t.Array(t.String())),
  nutritionalValues: t.Optional(t.Record(t.String(), t.Any())),
  netQuantity: t.Optional(t.String()),
  expiryDate: t.Optional(t.String({ format: "date-time" })),
  storageConditions: t.Optional(t.String()),
  manufacturerInfo: t.Optional(t.Record(t.String(), t.Any())),
  originCountry: t.Optional(t.String()),
  badges: t.Optional(t.Array(t.String())),
  individualPrice: t.Optional(t.Number()),
  corporatePrice: t.Optional(t.Number()),
  minQuantityIndividual: t.Optional(t.Number()),
  minQuantityCorporate: t.Optional(t.Number()),
  quantityPerBox: t.Optional(t.Number()),
  translations: t.Array(translationSchema, { minItems: SUPPORTED_LANGUAGES.length }),
};

const createProductSchema = t.Object(baseProductSchema);

const updateProductSchema = t.Object({
  ...baseProductSchema,
  productId: t.String({ format: "uuid" }),
});

export const adminProductsRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/products", (app) =>
    app
      .get(
        "/",
        async ({ query, set }) => {
          const limit = query.limit ? Number(query.limit) : undefined;
          const offset = query.offset ? Number(query.offset) : undefined;

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
                error instanceof Error
                  ? error.message
                  : "Ürün oluşturulamadı",
            };
          }
        },
        {
          body: createProductSchema,
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
              message:
                error instanceof Error ? error.message : "Ürün silinemedi",
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

            const imageUrl = await ProductImageService.uploadProductImage(body.image);
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
  );
