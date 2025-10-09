import { t } from "elysia";

import {
  SUPPORTED_LANGUAGES,
  type AdminCategoryPayload,
  type AdminUpdateCategoryPayload,
} from "../../application/use-cases/categories/category.types";
import { AdminCreateCategoryService } from "../../application/use-cases/categories/create-category.service";
import { AdminUpdateCategoryService } from "../../application/use-cases/categories/update-category.service";
import { AdminDeleteCategoryService } from "../../application/use-cases/categories/delete-category.service";
import { AdminGetCategoriesService } from "../../application/use-cases/categories/get-categories.service";

import { createAdminRouter } from "./admin-router.factory";

const translationSchema = t.Object({
  languageCode: t.String({
    enum: SUPPORTED_LANGUAGES as unknown as readonly string[],
  }),
  name: t.String({ minLength: 1 }),
});

const createCategorySchema = t.Object({
  slug: t.Optional(t.String()),
  translations: t.Array(translationSchema, { minItems: 1 }),
});

const updateCategorySchema = t.Object({
  categoryId: t.String({ format: "uuid" }),
  slug: t.Optional(t.String()),
  translations: t.Array(translationSchema, { minItems: 1 }),
});

export const adminCategoriesRoutes = createAdminRouter("/admin/categories")
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
            error instanceof Error ? error.message : "Kategori oluşturulamadı",
        };
      }
    },
    {
      body: createCategorySchema,
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const result = await AdminUpdateCategoryService.execute({
          ...body,
          categoryId: params.id,
        } as AdminUpdateCategoryPayload);
        return result;
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Kategori güncellenemedi",
        };
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: updateCategorySchema,
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
  );
