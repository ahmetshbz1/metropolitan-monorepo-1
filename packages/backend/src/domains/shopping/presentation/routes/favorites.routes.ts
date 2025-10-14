//  "favorites.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 16.06.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import {
  categories,
  favorites,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const favoritesRoutes = createApp()
  .use(isAuthenticated)
  .group("/me/favorites", (app) =>
    app
      .get(
        "/",
        async ({ db, profile, query, request }) => {
          const userId = profile?.sub || profile?.userId;
          const lang = query.lang || "en";
          const userFavorites = await db
            .select({
              id: products.id,
              name: productTranslations.name,
              imageUrl: products.imageUrl,
              price: products.price,
              currency: products.currency,
              stock: products.stock,
              categorySlug: categories.slug, // Corrected from products.categorySlug
              brand: products.brand,
            })
            .from(favorites)
            .innerJoin(products, eq(favorites.productId, products.id))
            .innerJoin(
              productTranslations,
              and(
                eq(productTranslations.productId, products.id),
                eq(productTranslations.languageCode, lang)
              )
            )
            .innerJoin(categories, eq(products.categoryId, categories.id)) // Join with categories
            .where(eq(favorites.userId, userId));

          const baseUrl = new URL(request.url).origin;

          const formattedFavorites = userFavorites.map((p) => ({
            id: p.id,
            name: p.name,
            image: p.imageUrl ? `${baseUrl}${p.imageUrl}` : "",
            price: Number(p.price) || 0,
            currency: p.currency,
            stock: p.stock ?? 0,
            category: p.categorySlug,
            brand: p.brand || "Yayla",
          }));

          return { success: true, data: formattedFavorites };
        },
        {
          query: t.Object({
            lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
          }),
        }
      )
      .post(
        "/",
        async ({ db, profile, body, set, log }) => {
          const userId = profile?.sub || profile?.userId;
          const { productId } = body;

          if (!userId) {
            log.error({ profile }, "No userId found in profile");
            set.status = 401;
            return { success: false, error: "Unauthorized - No user ID found" };
          }

          // Ürün mevcut mu kontrol et
          const productExists = await db.query.products.findFirst({
            where: eq(products.id, productId),
          });

          if (!productExists) {
            log.error({ productId }, "Product not found");
            set.status = 404;
            return { success: false, error: "Product not found." };
          }

          // Zaten favorilerde mi kontrol et
          const alreadyFavorite = await db.query.favorites.findFirst({
            where: and(
              eq(favorites.userId, userId),
              eq(favorites.productId, productId)
            ),
          });

          if (alreadyFavorite) {
            log.info({ userId, productId }, "Product already in favorites");
            set.status = 409;
            return { success: false, error: "Product is already in favorites." };
          }

          try {
            await db.insert(favorites).values({
              userId: userId,
              productId: productId,
            });

            log.info({ userId, productId }, "Product added to favorites");
            return { success: true, message: "Product added to favorites." };
          } catch (err) {
            log.error({ err, userId, productId }, "Failed to insert favorite");
            set.status = 500;
            return { success: false, error: "Failed to add product to favorites" };
          }
        },
        {
          body: t.Object({
            productId: t.String({ format: "uuid" }),
          }),
        }
      )
      .delete(
        "/:productId",
        async ({ db, profile, params, set }) => {
          const userId = profile?.sub || profile?.userId;
          const { productId } = params;

          const deletedFavorite = await db
            .delete(favorites)
            .where(
              and(
                eq(favorites.userId, userId),
                eq(favorites.productId, productId)
              )
            )
            .returning();

          if (deletedFavorite.length === 0) {
            set.status = 404;
            return { success: false, error: "Favorite not found." };
          }

          return { success: true, message: "Product removed from favorites." };
        },
        {
          params: t.Object({
            productId: t.String({ format: "uuid" }),
          }),
        }
      )
  );
