// guest-cart.routes.ts
// Handles guest shopping cart operations
// Manages cart items for non-authenticated users

import { and, eq } from "drizzle-orm";
import { t } from "elysia";
import {
  guestCartItems,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const guestCartRoutes = createApp()
  // Get guest cart
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

  // Add product to guest cart
  .post(
    "/cart/add",
    async ({ body, db, error }) => {
      const { guestId, productId, quantity } = body;

      // Check if product exists
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product) {
        return error(404, "Product not found");
      }

      if (quantity > (product.stock || 0)) {
        return error(400, "Insufficient stock");
      }

      // Update quantity if exists, else insert new
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

  // Remove item from guest cart
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
  );