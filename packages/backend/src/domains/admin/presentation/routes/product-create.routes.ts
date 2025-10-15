//  "product-create.routes.ts"
//  metropolitan backend
//  Ürün oluşturma ve import rotaları

import { eq } from "drizzle-orm";
import { t } from "elysia";
import { db } from "../../../../shared/infrastructure/database/connection";
import { categories } from "../../../../shared/infrastructure/database/schema";
import { AdminCreateProductService } from "../../application/use-cases/products/create-product.service";
import { AdminImportProductsService } from "../../application/use-cases/products/import-products.service";
import type { AdminProductPayload } from "../../application/use-cases/products/product.types";
import { createAdminRouter } from "./admin-router.factory";
import { createProductSchema } from "./product-schemas";

export const productCreateRoutes = createAdminRouter()
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
    async ({ body, set, admin }) => {
      if (!body.file) {
        set.status = 400;
        return {
          success: false,
          message: "Dosya yüklenmedi",
        };
      }

      try {
        const summary = await AdminImportProductsService.execute(body.file, admin.id);
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
  );
