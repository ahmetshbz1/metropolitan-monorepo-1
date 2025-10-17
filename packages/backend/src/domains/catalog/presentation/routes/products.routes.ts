//  "products.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { and, asc, eq, like, or } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";
import { t } from "elysia";

import {
  categories,
  categoryTranslations,
  productTranslations,
  products,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { isTokenBlacklisted } from "../../../../shared/infrastructure/database/redis";
import { StorageConditionTranslationService } from "../../../../shared/infrastructure/database/services/storage-condition-translation.service";
import { createApp } from "../../../../shared/infrastructure/web/app";

const safeParseAllergens = (allergens: string | null): string[] | undefined => {
  if (!allergens) return undefined;
  try {
    const parsed = JSON.parse(allergens);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === "string") {
      return [parsed];
    }
    return undefined;
  } catch {
    return [allergens];
  }
};

export const productRoutes = createApp()
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET! }))
  .derive(async ({ jwt: jwtInstance, headers, db }) => {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) return { profile: null };

    try {
      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) return { profile: null };

      const decoded = (await jwtInstance.verify(token)) as any;
      if (!decoded) return { profile: null };

      const userId = decoded.sub || decoded.userId;
      if (!userId) return { profile: null };

      // Hibrit çözüm: Önce token'a bak, yoksa DB'den çek
      let userType = decoded.userType;

      if (!userType) {
        // Sadece eski token'lar için DB sorgusu
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { userType: true }
        });

        if (!user) return { profile: null };
        userType = user.userType;
      }

      const profile = {
        userId,
        userType: userType as "individual" | "corporate",
      };

      return { profile };
    } catch (_error) {
      return { profile: null };
    }
  })
  .group("/products", (app) =>
  app
    // GET /api/products/search - Fast search endpoint
    .get(
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

        const xfProto = request.headers.get('x-forwarded-proto');
        const host = request.headers.get('host');
        const baseUrl = xfProto && host
          ? `${xfProto}://${host}`
          : new URL(request.url).origin;

        const formattedResults = searchResults.map((p) => {
          const finalPrice = userType === "corporate"
            ? (p.corporatePrice ? Number(p.corporatePrice) : Number(p.price) || 0)
            : (p.individualPrice ? Number(p.individualPrice) : Number(p.price) || 0);

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.imageUrl ? `${baseUrl}${p.imageUrl}` : "",
            price: finalPrice,
            individualPrice: p.individualPrice ? Number(p.individualPrice) : undefined,
            corporatePrice: p.corporatePrice ? Number(p.corporatePrice) : undefined,
            minQuantityIndividual: p.minQuantityIndividual ?? 1,
            minQuantityCorporate: p.minQuantityCorporate ?? 1,
            quantityPerBox: p.quantityPerBox ?? undefined,
            currency: p.currency,
            stock: p.stock ?? 0,
            category: p.categorySlug,
            brand: p.brand || "Yayla",
          };
        });

        return { success: true, data: formattedResults };
      },
      {
        query: t.Object({
          q: t.String({ minLength: 2 }),
          lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
        }),
      }
    )
    // GET /api/products/categories
    .get(
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
    )
    // GET /api/products/suggestions - Get suggested products to complete minimum order
    .get(
      "/suggestions",
      async ({ db, query, request, profile }) => {
        const lang = query.lang || "en";
        const userType = profile?.userType || "individual";
        const limit = query.limit ? parseInt(query.limit) : 20;

        // Az satan veya düşük stoklu ürünleri getir
        const suggestedProducts = await db
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
          .innerJoin(
            productTranslations,
            eq(products.id, productTranslations.productId)
          )
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(eq(productTranslations.languageCode, lang))
          .orderBy(asc(products.stock)) // Düşük stoklu ürünler önce
          .limit(limit);

        const xfProto = request.headers.get('x-forwarded-proto');
        const host = request.headers.get('host');
        const baseUrl = xfProto && host
          ? `${xfProto}://${host}`
          : new URL(request.url).origin;

        const formattedProducts = suggestedProducts.map((p) => {
          const finalPrice = userType === "corporate"
            ? (p.corporatePrice ? Number(p.corporatePrice) : Number(p.price) || 0)
            : (p.individualPrice ? Number(p.individualPrice) : Number(p.price) || 0);

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.imageUrl ? `${baseUrl}${p.imageUrl}` : "",
            price: finalPrice,
            individualPrice: p.individualPrice ? Number(p.individualPrice) : undefined,
            corporatePrice: p.corporatePrice ? Number(p.corporatePrice) : undefined,
            minQuantityIndividual: p.minQuantityIndividual ?? 1,
            minQuantityCorporate: p.minQuantityCorporate ?? 1,
            quantityPerBox: p.quantityPerBox ?? undefined,
            currency: p.currency,
            stock: p.stock ?? 0,
            category: p.categorySlug,
            brand: p.brand || "Yayla",
          };
        });

        return { success: true, data: formattedProducts };
      },
      {
        query: t.Object({
          lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
          limit: t.Optional(t.String()),
        }),
      }
    )
    // GET /api/products
    .get(
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

        const xfProto = request.headers.get('x-forwarded-proto');
        const host = request.headers.get('host');
        const baseUrl = xfProto && host
          ? `${xfProto}://${host}`
          : new URL(request.url).origin;
        const storageConditionService =
          new StorageConditionTranslationService();

        const formattedProducts = await Promise.all(
          allProducts.map(async (p) => {
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

            const finalPrice = userType === "corporate"
              ? (p.corporatePrice ? Number(p.corporatePrice) : Number(p.price) || 0)
              : (p.individualPrice ? Number(p.individualPrice) : Number(p.price) || 0);

            return {
              id: p.id,
              name: p.name,
              description: p.description,
              image: p.imageUrl ? `${baseUrl}${p.imageUrl}` : "",
              price: finalPrice,
              individualPrice: p.individualPrice ? Number(p.individualPrice) : undefined,
              corporatePrice: p.corporatePrice ? Number(p.corporatePrice) : undefined,
              minQuantityIndividual: p.minQuantityIndividual ?? 1,
              minQuantityCorporate: p.minQuantityCorporate ?? 1,
              quantityPerBox: p.quantityPerBox ?? undefined,
              currency: p.currency,
              stock: p.stock ?? 0,
              category: p.categorySlug,
              brand: p.brand || "Yayla",
              size: p.size || undefined,
              allergens: safeParseAllergens(p.allergens),
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
    // GET /api/products/:id
    .get(
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

        const xfProto = request.headers.get('x-forwarded-proto');
        const host = request.headers.get('host');
        const baseUrl = xfProto && host
          ? `${xfProto}://${host}`
          : new URL(request.url).origin;

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

        const finalPrice = userType === "corporate"
          ? (p.corporatePrice ? Number(p.corporatePrice) : Number(p.price) || 0)
          : (p.individualPrice ? Number(p.individualPrice) : Number(p.price) || 0);

        const formattedProduct = {
          id: p.id,
          name: p.name,
          description: p.description,
          image: p.imageUrl ? `${baseUrl}${p.imageUrl}` : "",
          price: finalPrice,
          individualPrice: p.individualPrice ? Number(p.individualPrice) : undefined,
          corporatePrice: p.corporatePrice ? Number(p.corporatePrice) : undefined,
          minQuantityIndividual: p.minQuantityIndividual ?? 1,
          minQuantityCorporate: p.minQuantityCorporate ?? 1,
          quantityPerBox: p.quantityPerBox ?? undefined,
          currency: p.currency,
          stock: p.stock ?? 0,
          category: p.categorySlug,
          brand: p.brand || "Yayla",
          size: p.size || undefined,
          rating: Math.random() * 2 + 3,
          allergens: safeParseAllergens(p.allergens),
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
    )
);
