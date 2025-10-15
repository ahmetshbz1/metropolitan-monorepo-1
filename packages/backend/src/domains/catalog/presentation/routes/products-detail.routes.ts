//  "products-detail.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import {
  categories,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { StorageConditionTranslationService } from "../../../../shared/infrastructure/database/services/storage-condition-translation.service";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { formatProduct, getBaseUrl } from "./products-helpers";

/**
 * GET /:id - Get single product detail
 * - Storage condition translation
 * - UserType-based pricing
 * - Includes rating field
 */
export const productsDetailRoutes = createApp().get(
  "/:id",
  async ({ db, params, query, request, profile }) => {
    const lang = query.lang || "en";
    const productId = params.id;
    const userType = profile?.userType || "individual";

    const product = await db
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
      .where(
        and(
          eq(products.id, productId),
          eq(productTranslations.languageCode, lang)
        )
      )
      .limit(1);

    if (!product.length) {
      return { success: false, error: "Product not found" };
    }

    const p = product[0];
    const baseUrl = getBaseUrl(request);

    // Tek ürün için direkt getTranslation kullan (zaten 1 query)
    const storageConditionService = new StorageConditionTranslationService();

    let translatedStorageConditions = p.storageConditions;
    if (p.storageConditions) {
      const storageConditionTranslation =
        await storageConditionService.getTranslation(
          p.storageConditions,
          lang
        );
      translatedStorageConditions =
        storageConditionTranslation || p.storageConditions;
    }

    const formattedProduct = formatProduct(
      p,
      baseUrl,
      userType,
      translatedStorageConditions,
      true // includeRating = true for detail view
    );

    return { success: true, data: formattedProduct };
  },
  {
    params: t.Object({
      id: t.String(),
    }),
    query: t.Object({
      lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
    }),
  }
);
