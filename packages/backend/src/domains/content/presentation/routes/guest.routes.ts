//  "guest.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";
import {
  guestCartItems,
  guestFavorites,
  guestSessions,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const guestRoutes = createApp().group("/guest", (app) =>
  app

    // Guest session oluştur
    .post(
      "/session/create",
      async ({ body, db }) => {
        const { guestId, deviceInfo } = body;

        // 7 gün sonra expire olsun
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Mevcut kayıt varsa güncelle, yoksa yeni oluştur
        await db
          .insert(guestSessions)
          .values({
            guestId,
            deviceInfo: deviceInfo || null,
            expiresAt,
          })
          .onConflictDoUpdate({
            target: [guestSessions.guestId],
            set: {
              lastActivity: new Date(),
              expiresAt,
              deviceInfo: deviceInfo || null,
            },
          });

        return { success: true, guestId, expiresAt };
      },
      {
        body: t.Object({
          guestId: t.String(),
          deviceInfo: t.Optional(t.String()),
        }),
      }
    )

    // Guest sepetini getir
    .get(
      "/cart/:guestId",
      async ({ params, db, query }) => {
        const { guestId } = params;
        const lang = query.lang || "tr";

        const cartItems = await db
          .select({
            id: guestCartItems.id,
            productId: guestCartItems.productId,
            quantity: guestCartItems.quantity,
            productName: productTranslations.name,
            productPrice: products.price,
            productCurrency: products.currency,
            productStock: products.stock,
            productImage: products.imageUrl,
            productBrand: products.brand,
          })
          .from(guestCartItems)
          .leftJoin(products, eq(guestCartItems.productId, products.id))
          .leftJoin(
            productTranslations,
            and(
              eq(products.id, productTranslations.productId),
              eq(productTranslations.languageCode, lang)
            )
          )
          .where(eq(guestCartItems.guestId, guestId));

        const formattedItems = cartItems.map((item) => ({
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
          quantity: item.quantity,
          totalPrice: (Number(item.productPrice) || 0) * item.quantity,
        }));

        const totalAmount = formattedItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );

        return {
          success: true,
          data: {
            items: formattedItems,
            totalAmount,
            itemCount: formattedItems.length,
          },
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

    // Guest sepetine ürün ekle
    .post(
      "/cart/add",
      async ({ body, db, error }) => {
        const { guestId, productId, quantity } = body;

        // Ürün var mı kontrol et
        const product = await db.query.products.findFirst({
          where: eq(products.id, productId),
        });

        if (!product) {
          return error(404, "Product not found");
        }

        if (quantity > (product.stock || 0)) {
          return error(400, "Insufficient stock");
        }

        // Sepette varsa quantity güncelle, yoksa yeni ekle
        await db
          .insert(guestCartItems)
          .values({
            guestId,
            productId,
            quantity,
          })
          .onConflictDoUpdate({
            target: [guestCartItems.guestId, guestCartItems.productId],
            set: {
              quantity: quantity,
              updatedAt: new Date(),
            },
          });

        return { success: true, message: "Product added to cart" };
      },
      {
        body: t.Object({
          guestId: t.String(),
          productId: t.String(),
          quantity: t.Integer({ minimum: 1 }),
        }),
      }
    )

    // Guest sepetten ürün çıkar
    .delete(
      "/cart/:guestId/:itemId",
      async ({ params, db }) => {
        const { guestId, itemId } = params;

        await db
          .delete(guestCartItems)
          .where(
            and(
              eq(guestCartItems.guestId, guestId),
              eq(guestCartItems.id, itemId)
            )
          );

        return { success: true, message: "Item removed from cart" };
      },
      {
        params: t.Object({
          guestId: t.String(),
          itemId: t.String(),
        }),
      }
    )

    // Guest favorilerini getir
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

    // Guest favorilere ürün ekle
    .post(
      "/favorites/add",
      async ({ body, db, error }) => {
        const { guestId, productId } = body;

        // Ürün var mı kontrol et
        const product = await db.query.products.findFirst({
          where: eq(products.id, productId),
        });

        if (!product) {
          return error(404, "Product not found");
        }

        // Favorilere ekle (duplicate ignore)
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

    // Guest favorilerden ürün çıkar
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
    )
);
