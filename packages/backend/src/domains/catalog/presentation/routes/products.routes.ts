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
import { AllergenTranslationService } from "../../../../shared/infrastructure/database/services/allergen-translation.service";
import { StorageConditionTranslationService } from "../../../../shared/infrastructure/database/services/storage-condition-translation.service";
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
            description: productTranslations.description,
            imageUrl: products.imageUrl,
            price: products.price,
            currency: products.currency,
            stock: products.stock,
            categorySlug: categories.slug,
            brand: products.brand,
            size: products.size,
            // Yeni eklenen alanlar
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

        // Use HTTPS in production, otherwise use request origin
        const requestOrigin = new URL(request.url).origin;
        const baseUrl = process.env.NODE_ENV === 'production'
          ? 'https://api.metropolitanfg.pl'
          : requestOrigin;
        const allergenService = new AllergenTranslationService();
        const storageConditionService =
          new StorageConditionTranslationService();

        const formattedProducts = await Promise.all(
          allProducts.map(async (p) => {
            // Alerjen çevirisini al
            let translatedAllergens = p.allergens;
            if (p.allergens) {
              const allergenTranslation = await allergenService.getTranslation(
                p.allergens,
                lang
              );
              translatedAllergens = allergenTranslation || p.allergens;
            }

            // Saklama koşulları çevirisini al
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

            return {
              id: p.id,
              name: p.name,
              description: p.description,
              image: p.imageUrl ? `${baseUrl}${p.imageUrl}` : "",
              price: Number(p.price) || 0,
              currency: p.currency,
              stock: p.stock ?? 0,
              category: p.categorySlug,
              brand: p.brand || "Yayla", // Use brand from DB, fallback just in case
              size: p.size || undefined,
              // Yeni eklenen alanlar
              allergens: translatedAllergens || undefined,
              nutritionalValues: p.nutritionalValues
                ? JSON.parse(p.nutritionalValues)
                : undefined,
              netQuantity: p.netQuantity || undefined,
              expiryDate: p.expiryDate || undefined,
              storageConditions: translatedStorageConditions || undefined,
              manufacturerInfo: p.manufacturerInfo
                ? JSON.parse(p.manufacturerInfo)
                : undefined,
              originCountry: p.originCountry || undefined,
              badges: p.badges ? JSON.parse(p.badges) : undefined,
            };
          })
        );

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
