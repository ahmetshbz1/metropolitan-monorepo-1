// "guest-migration.routes.ts"
// metropolitan backend
// Guest data migration routes

import { logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";
import { t } from "elysia";
import {
  cartItems,
  favorites,
  guestCartItems,
  guestFavorites,
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

          // 4. Migrate cart items
          let migratedCartItems = 0;
          for (const item of guestCartData) {
            try {
              await db
                .insert(cartItems)
                .values({
                  userId: user.id,
                  productId: item.productId,
                  quantity: item.quantity,
                })
                .onConflictDoUpdate({
                  target: [cartItems.userId, cartItems.productId],
                  set: {
                    quantity: item.quantity,
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

          // 6. Cleanup guest data
          try {
            await db
              .delete(guestCartItems)
              .where(eq(guestCartItems.guestId, guestId));
            await db
              .delete(guestFavorites)
              .where(eq(guestFavorites.guestId, guestId));
          } catch (err) {
            log.warn({ error: err, guestId }, "Failed to cleanup guest data");
          }

          log.info(
            {
              userId: user.id,
              guestId,
              migratedCartItems,
              migratedFavorites,
            },
            "Guest data migration completed"
          );

          return {
            success: true,
            message: "Guest data migrated successfully",
            migratedData: {
              cartItems: migratedCartItems,
              favorites: migratedFavorites,
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