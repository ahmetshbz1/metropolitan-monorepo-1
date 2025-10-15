//  "products-search.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { and, eq, like, or } from "drizzle-orm";
import { t } from "elysia";

import {
  categories,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { formatProduct, getBaseUrl } from "./products-helpers";

/**
 * GET /search - Fast product search endpoint
 * Pattern matching on name, description, and brand
 */
export const productsSearchRoutes = createApp().get(
  "/search",
  async ({ db, query, request, profile }) => {
    const lang = query.lang || "en";
    const searchQuery = query.q || "";

    if (searchQuery.length < 2) {
      return { success: true, data: [] };
    }

    const searchPattern = `%${searchQuery}%`;
    const userType = profile?.userType || "individual";

    const searchResults = await db
      .select({
        id: products.id,
        name: productTranslations.name,
        description: productTranslations.description,
        imageUrl: products.imageUrl,
        price: products.price,
        individualPrice: products.individualPrice,
        corporatePrice: products.corporatePrice,
        minQuantityIndividual: products.minQuantityIndividual,
        minQuantityCorporate: products.minQuantityCorporate,
        quantityPerBox: products.quantityPerBox,
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
      .where(
        and(
          eq(productTranslations.languageCode, lang),
          or(
            like(productTranslations.name, searchPattern),
            like(productTranslations.description, searchPattern),
            like(products.brand, searchPattern)
          )
        )
      )
      .limit(10);

    const baseUrl = getBaseUrl(request);

    const formattedResults = searchResults.map((p) =>
      formatProduct(p, baseUrl, userType)
    );

    return { success: true, data: formattedResults };
  },
  {
    query: t.Object({
      q: t.String({ minLength: 2 }),
      lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
    }),
  }
);
