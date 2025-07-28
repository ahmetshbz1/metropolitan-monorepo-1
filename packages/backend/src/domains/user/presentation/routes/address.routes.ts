//  "address.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 02.07.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import * as schema from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const addressRoutes = createApp()
  .use(isAuthenticated)
  .group("/me/addresses", (app) =>
    app
      .get("/", async ({ db, profile }) => {
        const userAddresses = await db.query.addresses.findMany({
           
          where: eq(schema.addresses.userId, profile!.userId),
        });
        return { success: true, data: userAddresses };
      })
      .post(
        "/",
        async ({ db, profile, body }) => {
          const newAddress = await db
            .insert(schema.addresses)
            .values({
               
              userId: profile!.userId,
              ...body,
            })
            .returning();

          return {
            success: true,
            message: "Address added successfully.",
            data: newAddress[0],
          };
        },
        {
          body: t.Object({
            addressTitle: t.String(),
            street: t.String(),
            city: t.String(),
            postalCode: t.String(),
            country: t.String(),
          }),
        }
      )
      .put(
        "/:addressId",
        async ({ db, profile, params, body, error }) => {
          const { addressId } = params;

          if (Object.keys(body).length === 0) {
            return error(400, "No fields to update provided.");
          }

          const updatedAddress = await db
            .update(schema.addresses)
            .set({ ...body, updatedAt: new Date() })
            .where(
              and(
                eq(schema.addresses.id, addressId),
                eq(schema.addresses.userId, profile!.userId)
              )
            )
            .returning();

          if (updatedAddress.length === 0) {
            return error(
              404,
              "Address not found or you do not have permission to update it."
            );
          }

          return {
            success: true,
            message: "Address updated successfully.",
            data: updatedAddress[0],
          };
        },
        {
          params: t.Object({ addressId: t.String({ format: "uuid" }) }),
          body: t.Object({
            addressTitle: t.Optional(t.String()),
            street: t.Optional(t.String()),
            city: t.Optional(t.String()),
            postalCode: t.Optional(t.String()),
            country: t.Optional(t.String()),
          }),
        }
      )
      .delete(
        "/:addressId",
        async ({ db, profile, params, error }) => {
          const { addressId } = params;

          const deletedAddress = await db
            .delete(schema.addresses)
            .where(
              and(
                eq(schema.addresses.id, addressId),
                eq(schema.addresses.userId, profile!.userId)
              )
            )
            .returning();

          if (deletedAddress.length === 0) {
            return error(
              404,
              "Address not found or you do not have permission to delete it."
            );
          }

          return { success: true, message: "Address deleted successfully." };
        },
        {
          params: t.Object({ addressId: t.String({ format: "uuid" }) }),
        }
      )
      .post(
        "/:addressId/set-default",
        async ({ db, profile, params, body, error }) => {
          if (!profile) {
            return error(401, "Unauthorized");
          }

          const { addressId } = params;
          const { type } = body;

          try {
            await db.transaction(async (tx) => {
              let result;

              if (type === "delivery") {
                // 1. Önceki varsayılan teslimat adresini sıfırla
                await tx
                  .update(schema.addresses)
                  .set({ isDefaultDelivery: false })
                  .where(
                    and(
                      eq(schema.addresses.userId, profile!.userId),
                      eq(schema.addresses.isDefaultDelivery, true)
                    )
                  );

                // 2. Yeni varsayılan teslimat adresini ayarla
                result = await tx
                  .update(schema.addresses)
                  .set({ isDefaultDelivery: true })
                  .where(
                    and(
                      eq(schema.addresses.id, addressId),
                      eq(schema.addresses.userId, profile!.userId)
                    )
                  )
                  .returning();
              } else {
                // type === 'billing'
                // 1. Önceki varsayılan fatura adresini sıfırla
                await tx
                  .update(schema.addresses)
                  .set({ isDefaultBilling: false })
                  .where(
                    and(
                      eq(schema.addresses.userId, profile!.userId),
                      eq(schema.addresses.isDefaultBilling, true)
                    )
                  );

                // 2. Yeni varsayılan fatura adresini ayarla
                result = await tx
                  .update(schema.addresses)
                  .set({ isDefaultBilling: true })
                  .where(
                    and(
                      eq(schema.addresses.id, addressId),
                      eq(schema.addresses.userId, profile!.userId)
                    )
                  )
                  .returning();
              }

              // Eğer adres bulunamazsa veya kullanıcıya ait değilse, işlemi geri al
              if (result.length === 0) {
                // Bu hatayı fırlatmak transaction'ı geri alacaktır (rollback)
                throw new Error("Address not found or access denied.");
              }
            });

            return {
              success: true,
              message: "Default address updated successfully.",
            };
          } catch (e: any) {
            if (e.message === "Address not found or access denied.") {
              return error(404, e.message);
            }
            console.error("Failed to set default address:", e.message);
            return error(500, "An internal server error occurred.");
          }
        },
        {
          body: t.Object({
            type: t.Enum({
              DELIVERY: "delivery",
              BILLING: "billing",
            }),
          }),
          params: t.Object({
            addressId: t.String({
              format: "uuid",
              error: "Invalid address ID format.",
            }),
          }),
        }
      )
  );
