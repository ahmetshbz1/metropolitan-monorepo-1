//  "products-categories.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { eq } from "drizzle-orm";
import { t } from "elysia";

import {
  categories,
  categoryTranslations,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

/**
 * GET /categories - List all categories with translations
 */
export const productsCategoriesRoutes = createApp().get(
  "/categories",
  async ({ db, query }) => {
    const lang = query.lang || "en";

    const allCategories = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categoryTranslations.name,
        languageCode: categoryTranslations.languageCode,
      })
      .from(categories)
      .leftJoin(
        categoryTranslations,
        eq(categories.id, categoryTranslations.categoryId)
      )
      .where(eq(categoryTranslations.languageCode, lang));

    return { success: true, data: allCategories };
  },
  {
    query: t.Object({
      lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
    }),
  }
);
