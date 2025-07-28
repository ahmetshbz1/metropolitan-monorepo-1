//  "cart.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 02.07.2025.

import type {
  AddToCartRequest,
  UpdateCartItemRequest,
} from "@metropolitan/shared/types/cart";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";
import { CartItemService } from "../../application/use-cases/cart-item.service";

// Bu tip backend'e özel kalabilir
interface AuthenticatedContext {
  user: {
    id: string;
    // ... diğer user alanları
  };
}

export const createCartApp = () =>
  new Elysia({ prefix: "/me/cart" })
    .use(isAuthenticated)
    .resolve(async ({ profile }) => {
      if (!profile) throw new Error("Unauthorized");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, profile.userId))
        .limit(1);

      if (!user) throw new Error("User not found");

      return { user };
    })

    // Sepet öğelerini listele
    .get("/", async ({ user }: AuthenticatedContext) => {
      return await CartItemService.getUserCartItems(user.id);
    }, {
      query: t.Object({
        lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" }))
      })
    })

    // Sepete ürün ekle
    .post(
      "/",
      async ({
        user,
        body,
      }: AuthenticatedContext & {
        body: AddToCartRequest;
      }) => {
        return await CartItemService.addItemToCart(user.id, body);
      },
      {
        body: t.Object({
          productId: t.String({ format: "uuid" }),
          quantity: t.Optional(t.Number({ minimum: 1 })),
        }),
        query: t.Object({
          lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" }))
        })
      }
    )

    // Sepet öğesini güncelle
    .put(
      "/:itemId",
      async ({
        user,
        params,
        body,
      }: AuthenticatedContext & {
        params: { itemId: string };
        body: UpdateCartItemRequest;
      }) => {
        const { itemId } = params;
        const { quantity } = body;

        return await CartItemService.updateCartItem(user.id, itemId, quantity);
      },
      {
        params: t.Object({
          itemId: t.String({ format: "uuid" }),
        }),
        body: t.Object({
          quantity: t.Number({ minimum: 1 }),
        }),
        query: t.Object({
          lang: t.Optional(t.String({ pattern: "^(tr|en|pl)$" }))
        })
      }
    )

    // Sepet öğesini sil
    .delete(
      "/:itemId",
      async ({
        user,
        params,
      }: AuthenticatedContext & {
        params: { itemId: string };
      }) => {
        const { itemId } = params;

        return await CartItemService.removeCartItem(user.id, itemId);
      },
      {
        params: t.Object({
          itemId: t.String({ format: "uuid" }),
        }),
      }
    )

    // Sepeti temizle
    .delete("/", async ({ user }: AuthenticatedContext) => {
      return await CartItemService.clearCart(user.id);
    });

export const cartRoutes = createCartApp();
