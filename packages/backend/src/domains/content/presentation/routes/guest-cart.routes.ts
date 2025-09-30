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
    async ({ params, db, query, request }) => {
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

      const xfProto = request.headers.get('x-forwarded-proto');
      const host = request.headers.get('host');
      const baseUrl = xfProto && host ? `${xfProto}://${host}` : new URL(request.url).origin;

      const formattedItems = cartItems.map((item) => ({
        id: item.id,
        product: {
          id: item.productId,
          name: item.productName,
          price: Number(item.productPrice) || 0,
          currency: item.productCurrency,
          stock: item.productStock || 0,
          image: item.productImage ? `${baseUrl}${item.productImage}` : "",
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
  )

  // Batch update guest cart items
  .patch(
    "/cart/batch",
    async ({ body, db, error, query }) => {
      const { guestId, updates } = body;
      const lang = query.lang || "tr";

      if (!updates.length) {
        return { success: true, message: "No updates provided", updatedCount: 0 };
      }

      let updatedCount = 0;
      const adjustedItems: Array<{ itemId: string; requestedQty: number; adjustedQty: number; productName: string }> = [];

      for (const { itemId, quantity } of updates) {
        try {
          // Check if product exists and has stock
          const cartItem = await db.query.guestCartItems.findFirst({
            where: and(
              eq(guestCartItems.id, itemId),
              eq(guestCartItems.guestId, guestId)
            ),
          });

          if (!cartItem) continue;

          const product = await db.query.products.findFirst({
            where: eq(products.id, cartItem.productId),
          });

          if (!product) continue;

          // Get product translation
          const translation = await db.query.productTranslations.findFirst({
            where: and(
              eq(productTranslations.productId, product.id),
              eq(productTranslations.languageCode, lang)
            ),
          });

          const availableStock = product.stock || 0;
          let finalQuantity = quantity;

          // Eğer istenen miktar stoktan fazlaysa, otomatik olarak stok limitine ayarla
          if (quantity > availableStock) {
            finalQuantity = availableStock;
            adjustedItems.push({
              itemId,
              requestedQty: quantity,
              adjustedQty: finalQuantity,
              productName: translation?.name || product.productCode || "Product",
            });
          }

          await db
            .update(guestCartItems)
            .set({
              quantity: finalQuantity,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(guestCartItems.id, itemId),
                eq(guestCartItems.guestId, guestId)
              )
            );

          updatedCount++;
        } catch (err) {
          console.error(`Failed to update cart item ${itemId}:`, err);
        }
      }

      return {
        success: true,
        message: `${updatedCount} items updated`,
        updatedCount,
        adjustedItems: adjustedItems.length > 0 ? adjustedItems : undefined,
      };
    },
    {
      body: t.Object({
        guestId: t.String(),
        updates: t.Array(
          t.Object({
            itemId: t.String(),
            quantity: t.Integer({ minimum: 1 }),
          })
        ),
      }),
      query: t.Object({
        lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" })),
      }),
    }
  );
