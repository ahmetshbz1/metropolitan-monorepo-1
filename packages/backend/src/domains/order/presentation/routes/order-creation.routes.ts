//  "order-creation.routes.ts"
//  metropolitan backend
//  Order creation specific routes

import type { OrderCreationRequest } from "@metropolitan/shared/types/order";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";
import { OrderCalculationService } from "../../application/use-cases/order-calculation.service";
import { OrderCreationService } from "../../application/use-cases/order-creation.service";
import { OrderValidationService } from "../../application/use-cases/order-validation.service";

interface AuthenticatedContext {
  user: {
    id: string;
  };
}

export const orderCreationRoutes = new Elysia()
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
  .post(
    "/",
    async ({
      user,
      body,
    }: AuthenticatedContext & { body: OrderCreationRequest }) => {
      console.log(
        "📦 Order creation request body:",
        JSON.stringify(body, null, 2)
      );

      // Validate cart items
      const { items: cartItems, validation } =
        await OrderValidationService.validateCartItems(user.id);

      if (!validation.isValid) {
        throw new Error(
          JSON.stringify({
            code: "INSUFFICIENT_STOCK",
            message: "Bazı ürünlerde stok yetersiz",
            details: validation.errors,
          })
        );
      }

      // Validate addresses
      await OrderValidationService.validateAddress(
        body.shippingAddressId,
        user.id
      );
      
      if (body.billingAddressId) {
        await OrderValidationService.validateAddress(
          body.billingAddressId,
          user.id
        );
      }

      // Validate payment method
      await OrderValidationService.validatePaymentMethod(
        body.paymentMethodId,
        user.id
      );

      // Prepare order items and calculate total
      const { orderItems, totalAmount } =
        OrderCalculationService.prepareOrderItems(cartItems);

      // Create order with Stripe
      const result = await OrderCreationService.createOrderWithStripe(
        user.id,
        body,
        orderItems,
        cartItems,
        totalAmount
      );

      return result;
    },
    {
      body: t.Object({
        shippingAddressId: t.String(),
        billingAddressId: t.Optional(t.String()),
        paymentMethodId: t.String(),
        notes: t.Optional(t.String()),
      }),
    }
  );