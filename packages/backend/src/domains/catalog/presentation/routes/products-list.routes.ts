//  "products-list.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import {
  categories,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { formatProductList, getBaseUrl } from "./products-helpers";

/**
 * GET / - List all products with optional category filter
 * - Batch storage condition translations (N+1 prevention)
 * - UserType-based pricing
 */
export const productsListRoutes = createApp().get(
  "/",
  async ({ db, query, request, profile }) => {
    const lang = query.lang || "en";
    const categorySlug = query.category;
    const userType = profile?.userType || "individual";

    const conditions = [eq(productTranslations.languageCode, lang)];

    if (categorySlug) {
      conditions.push(eq(categories.slug, categorySlug));
    }

    const allProducts = await db
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
        size: products.size,
        allergens: products.allergens,
        nutritionalValues: products.nutritionalValues,
        netQuantity: products.netQuantity,
        expiryDate: products.expiryDate,
        storageConditions: products.storageConditions,
        manufacturerInfo: products.manufacturerInfo,
        originCountry: products.originCountry,
        badges: products.badges,
      })
      .from(products)
      .leftJoin(
        productTranslations,
        eq(products.id, productTranslations.productId)
      )
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions));

    const baseUrl = getBaseUrl(request);

    // Batch format - tek query ile tüm storage condition translations
    const formattedProducts = await formatProductList(
      allProducts,
      baseUrl,
      userType,
      lang
    );

    return { success: true, data: formattedProducts };
  },
  {
    query: t.Object({
      lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
      category: t.Optional(t.String()),
    }),
  }
);
