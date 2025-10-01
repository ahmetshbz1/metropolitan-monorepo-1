// "guest-migration.routes.ts"
// metropolitan backend
// Guest data migration routes

import { logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";
import { t } from "elysia";

import {
  cartItems,
  deviceTokens,
  favorites,
  guestCartItems,
  guestDeviceTokens,
  guestFavorites,
  products,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

import { phoneNumberSchema } from "./auth-guards";

export const guestMigrationRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/auth", (app) =>
    app
      .post(
        "/migrate-guest-data",
        async ({ body, db, log, error }) => {
          const { phoneNumber, guestId } = body;

          log.info(
            { phoneNumber, guestId },
            "Attempting to migrate guest data"
          );

          // 1. Find user by phone number
          const user = await db.query.users.findFirst({
            where: eq(users.phoneNumber, phoneNumber),
          });

          if (!user) {
            return error(404, "User not found");
          }

          // 2. Get guest cart items
          const guestCartData = await db.query.guestCartItems.findMany({
            where: eq(guestCartItems.guestId, guestId),
          });

          // 3. Get guest favorites
          const guestFavoritesData = await db.query.guestFavorites.findMany({
            where: eq(guestFavorites.guestId, guestId),
          });

          // 3.5. Get guest device tokens
          const guestTokensData = await db.query.guestDeviceTokens.findMany({
            where: eq(guestDeviceTokens.guestId, guestId),
          });

          // 4. Migrate cart items with minimum quantity adjustment for corporate users
          let migratedCartItems = 0;
          for (const item of guestCartData) {
            try {
              let finalQuantity = item.quantity;

              // If user is corporate, adjust quantity to meet minimum requirements
              if (user.userType === 'corporate') {
                // Get product minimum quantity for corporate
                const product = await db.query.products.findFirst({
                  where: eq(products.id, item.productId),
                  columns: {
                    minQuantityCorporate: true,
                  },
                });

                if (product && product.minQuantityCorporate) {
                  // Adjust quantity to meet minimum corporate requirement
                  finalQuantity = Math.max(item.quantity, product.minQuantityCorporate);

                  if (finalQuantity !== item.quantity) {
                    log.info(
                      {
                        productId: item.productId,
                        originalQuantity: item.quantity,
                        adjustedQuantity: finalQuantity,
                        minRequired: product.minQuantityCorporate,
                      },
                      "Adjusted quantity to meet corporate minimum"
                    );
                  }
                }
              }

              await db
                .insert(cartItems)
                .values({
                  userId: user.id,
                  productId: item.productId,
                  quantity: finalQuantity,
                })
                .onConflictDoUpdate({
                  target: [cartItems.userId, cartItems.productId],
                  set: {
                    quantity: finalQuantity,
                    updatedAt: new Date(),
                  },
                });
              migratedCartItems++;
            } catch (err) {
              log.warn(
                { error: err, productId: item.productId },
                "Failed to migrate cart item"
              );
            }
          }

          // 5. Migrate favorites
          let migratedFavorites = 0;
          for (const item of guestFavoritesData) {
            try {
              await db
                .insert(favorites)
                .values({
                  userId: user.id,
                  productId: item.productId,
                })
                .onConflictDoNothing();
              migratedFavorites++;
            } catch (err) {
              log.warn(
                { error: err, productId: item.productId },
                "Failed to migrate favorite item"
              );
            }
          }

          // 5.5. Migrate device tokens
          let migratedDeviceTokens = 0;
          for (const item of guestTokensData) {
            try {
              await db
                .insert(deviceTokens)
                .values({
                  userId: user.id,
                  token: item.token,
                  platform: item.platform,
                  deviceName: item.deviceName,
                  deviceId: item.deviceId,
                  lastUsedAt: item.lastUsedAt,
                  isValid: item.isValid,
                  failureCount: item.failureCount,
                })
                .onConflictDoUpdate({
                  target: [deviceTokens.userId, deviceTokens.token],
                  set: {
                    lastUsedAt: item.lastUsedAt,
                    platform: item.platform,
                    deviceName: item.deviceName,
                    isValid: item.isValid,
                    failureCount: item.failureCount,
                    updatedAt: new Date(),
                  },
                });
              migratedDeviceTokens++;
            } catch (err) {
              log.warn(
                { error: err, token: item.token.substring(0, 20) + "..." },
                "Failed to migrate device token"
              );
            }
          }

          // 6. Cleanup guest data
          try {
            await db
              .delete(guestCartItems)
              .where(eq(guestCartItems.guestId, guestId));
            await db
              .delete(guestFavorites)
              .where(eq(guestFavorites.guestId, guestId));
            await db
              .delete(guestDeviceTokens)
              .where(eq(guestDeviceTokens.guestId, guestId));
          } catch (err) {
            log.warn({ error: err, guestId }, "Failed to cleanup guest data");
          }

          log.info(
            {
              userId: user.id,
              guestId,
              migratedCartItems,
              migratedFavorites,
              migratedDeviceTokens,
            },
            "Guest data migration completed"
          );

          return {
            success: true,
            message: "Guest data migrated successfully",
            migratedData: {
              cartItems: migratedCartItems,
              favorites: migratedFavorites,
              deviceTokens: migratedDeviceTokens,
            },
          };
        },
        {
          body: t.Object({
            phoneNumber: t.String(phoneNumberSchema),
            guestId: t.String(),
          }),
        }
      )
  );