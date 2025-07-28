//  "payment.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 10.07.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import * as schema from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const paymentRoutes = createApp()
  .use(isAuthenticated)
  .group("/me/payment-methods", (app) =>
    app
      .get("/", async ({ db, profile }) => {
        const paymentMethods = await db.query.paymentMethods.findMany({
           
          where: eq(schema.paymentMethods.userId, profile!.userId),
        });

        return { success: true, data: paymentMethods };
      })
      .post(
        "/",
        async ({ db, profile, body }) => {
          const newPaymentMethod = await db
            .insert(schema.paymentMethods)
            .values({
               
              userId: profile!.userId,
              ...body,
            })
            .returning();

          return {
            success: true,
            message: "Payment method added successfully.",
            data: newPaymentMethod[0],
          };
        },
        {
          body: t.Object({
            cardholderName: t.String(),
            cardNumberLast4: t.String({ minLength: 4, maxLength: 4 }),
            expiryMonth: t.String({ minLength: 2, maxLength: 2 }),
            expiryYear: t.String({ minLength: 4, maxLength: 4 }),
            cardType: t.Optional(t.String()),
          }),
        }
      )
      .delete(
        "/:paymentMethodId",
        async ({ db, profile, params, error }) => {
          const { paymentMethodId } = params;

          const deletedPaymentMethod = await db
            .delete(schema.paymentMethods)
            .where(
              and(
                eq(schema.paymentMethods.id, paymentMethodId),
                eq(schema.paymentMethods.userId, profile!.userId)
              )
            )
            .returning();

          if (deletedPaymentMethod.length === 0) {
            return error(
              404,
              "Payment method not found or you do not have permission to delete it."
            );
          }

          return {
            success: true,
            message: "Payment method deleted successfully.",
          };
        },
        {
          params: t.Object({ paymentMethodId: t.String({ format: "uuid" }) }),
        }
      )
  );
