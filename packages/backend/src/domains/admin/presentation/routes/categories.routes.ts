import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { isAdminAuthenticated } from "../../application/guards/admin.guard";
import { AdminCreateCategoryService } from "../../application/use-cases/categories/create-category.service";
import { AdminDeleteCategoryService } from "../../application/use-cases/categories/delete-category.service";
import { AdminGetCategoriesService } from "../../application/use-cases/categories/get-categories.service";
import {
  SUPPORTED_LANGUAGES,
  type AdminCategoryPayload,
} from "../../application/use-cases/categories/category.types";

const translationSchema = t.Object({
  languageCode: t.String({ enum: SUPPORTED_LANGUAGES as unknown as readonly string[] }),
  name: t.String({ minLength: 1 }),
});

const createCategorySchema = t.Object({
  slug: t.Optional(t.String()),
  translations: t.Array(translationSchema, { minItems: 1 }),
});

export const adminCategoriesRoutes = createApp()
  .use(isAdminAuthenticated)
  .group("/admin/categories", (app) =>
    app
      .get("/", async ({ set }) => {
        try {
          const result = await AdminGetCategoriesService.execute();
          return result;
        } catch (error) {
          set.status = 400;
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Kategoriler getirilemedi",
          };
        }
      })
      .post(
        "/",
        async ({ body, set }) => {
          try {
            const result = await AdminCreateCategoryService.execute(
              body as AdminCategoryPayload
            );
            return result;
          } catch (error) {
            set.status = 400;
            return {
              success: false,
              message:
                error instanceof Error
                  ? error.message
                  : "Kategori oluşturulamadı",
            };
          }
        },
        {
          body: createCategorySchema,
        }
      )
      .delete(
        "/:id",
        async ({ params, set }) => {
          try {
            const result = await AdminDeleteCategoryService.execute(params.id);
            return result;
          } catch (error) {
            set.status = 400;
            return {
              success: false,
              message:
                error instanceof Error ? error.message : "Kategori silinemedi",
            };
          }
        },
        {
          params: t.Object({ id: t.String({ format: "uuid" }) }),
        }
      )
  );
