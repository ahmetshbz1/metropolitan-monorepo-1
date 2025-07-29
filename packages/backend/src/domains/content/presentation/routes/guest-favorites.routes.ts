// guest-favorites.routes.ts
// Handles guest favorites/wishlist operations
// Manages favorite products for non-authenticated users

import { and, eq } from "drizzle-orm";
import { t } from "elysia";
import {
  guestFavorites,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const guestFavoritesRoutes = createApp()
  // Get guest favorites
  .get(
    "/favorites/:guestId",
    async ({ params, db, query }) => {
      const { guestId } = params;
      const lang = query.lang || "tr";

      const favorites = await db
        .select({
          id: guestFavorites.id,
          productId: guestFavorites.productId,
          productName: productTranslations.name,
          productPrice: products.price,
          productCurrency: products.currency,
          productStock: products.stock,
          productImage: products.imageUrl,
          productBrand: products.brand,
        })
        .from(guestFavorites)
        .leftJoin(products, eq(guestFavorites.productId, products.id))
        .leftJoin(
          productTranslations,
          and(
            eq(products.id, productTranslations.productId),
            eq(productTranslations.languageCode, lang)
          )
        )
        .where(eq(guestFavorites.guestId, guestId));

      const formattedFavorites = favorites.map((item) => ({
        id: item.id,
        product: {
          id: item.productId,
          name: item.productName,
          price: Number(item.productPrice) || 0,
          currency: item.productCurrency,
          stock: item.productStock || 0,
          image: item.productImage,
          brand: item.productBrand,
        },
      }));

      return {
        success: true,
        data: formattedFavorites,
      };
    },
    {
      params: t.Object({
        guestId: t.String(),
      }),
      query: t.Object({
        lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
      }),
    }
  )

  // Add product to guest favorites
  .post(
    "/favorites/add",
    async ({ body, db, error }) => {
      const { guestId, productId } = body;

      // Check if product exists
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product) {
        return error(404, "Product not found");
      }

      // Add to favorites (ignore duplicates)
      await db
        .insert(guestFavorites)
        .values({
          guestId,
          productId,
        })
        .onConflictDoNothing();

      return { success: true, message: "Product added to favorites" };
    },
    {
      body: t.Object({
        guestId: t.String(),
        productId: t.String(),
      }),
    }
  )

  // Remove product from guest favorites
  .delete(
    "/favorites/:guestId/:productId",
    async ({ params, db }) => {
      const { guestId, productId } = params;

      await db
        .delete(guestFavorites)
        .where(
          and(
            eq(guestFavorites.guestId, guestId),
            eq(guestFavorites.productId, productId)
          )
        );

      return { success: true, message: "Product removed from favorites" };
    },
    {
      params: t.Object({
        guestId: t.String(),
        productId: t.String(),
      }),
    }
  );