//  "products.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import {
  categories,
  categoryTranslations,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const productRoutes = createApp().group("/products", (app) =>
  app
    // GET /api/products/categories
    .get(
      "/categories",
      async ({ db, query }) => {
        const lang = query.lang || "tr"; // Default to Turkish if no language is specified

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
    )
    // GET /api/products
    .get(
      "/",
      async ({ db, query, request }) => {
        const lang = query.lang || "tr";
        const categorySlug = query.category;

        const conditions = [eq(productTranslations.languageCode, lang)];

        if (categorySlug) {
          conditions.push(eq(categories.slug, categorySlug));
        }

        const allProducts = await db
          .select({
            id: products.id,
            name: productTranslations.name,
            imageUrl: products.imageUrl,
            price: products.price,
            currency: products.currency,
            stock: products.stock,
            categorySlug: categories.slug,
            brand: products.brand,
          })
          .from(products)
          .leftJoin(
            productTranslations,
            eq(products.id, productTranslations.productId)
          )
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(and(...conditions));

        const baseUrl = new URL(request.url).origin;

        const formattedProducts = allProducts.map((p) => ({
          id: p.id,
          name: p.name,
          image: p.imageUrl ? `${baseUrl}${p.imageUrl}` : "",
          price: Number(p.price) || 0,
          currency: p.currency,
          stock: p.stock ?? 0,
          category: p.categorySlug,
          brand: p.brand || "Yayla", // Use brand from DB, fallback just in case
        }));

        return { success: true, data: formattedProducts };
      },
      {
        query: t.Object({
          lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
          category: t.Optional(t.String()),
        }),
      }
    )
);
