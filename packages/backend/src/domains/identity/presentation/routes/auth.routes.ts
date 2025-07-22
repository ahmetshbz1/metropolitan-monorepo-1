//  "auth.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 25.06.2025.

import { logger } from "@bogeychan/elysia-logger";
import { and, eq } from "drizzle-orm";
import { t } from "elysia";
import {
  blacklistToken,
  isTokenBlacklisted,
} from "../../../../shared/infrastructure/database/redis";
import {
  cartItems,
  favorites,
  guestCartItems,
  guestFavorites,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { createOtp, verifyOtp } from "../../application/use-cases/otp.service";

// Artık bağımsız bir plugin
// Kendi bağımlılıklarını declare ediyor
export const authRoutes = createApp()
  .use(logger({ level: "info" }))
  // .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET! })) // KALDIRILDI - createApp'den miras alıyor
  .group("/auth", (app) =>
    app
      .post(
        "/send-otp",
        async ({ body, log }) => {
          await createOtp(body.phoneNumber);
          log.info(
            { phoneNumber: body.phoneNumber, userType: body.userType },
            `OTP sent successfully`
          );
          return { success: true, message: "OTP sent successfully" };
        },
        {
          body: t.Object({
            phoneNumber: t.String({
              pattern: "^\\+[1-9]\\d{1,14}$",
              error:
                "Invalid phone number format. Please use E.164 format (e.g., +905551234567).",
            }),
            userType: t.String({ enum: ["individual", "corporate"] }),
          }),
        }
      )
      .post(
        "/verify-otp",
        async ({ body, jwt, log, db }) => {
          log.info(
            { phoneNumber: body.phoneNumber, userType: body.userType },
            `Attempting to verify OTP`
          );
          if (await verifyOtp(body.phoneNumber, body.otpCode)) {
            // Telefon ve userType ile kullanıcı bul, yoksa oluştur
            let user = await db.query.users.findFirst({
              where: and(
                eq(users.phoneNumber, body.phoneNumber),
                eq(users.userType, body.userType)
              ),
            });

            if (!user) {
              log.info(
                `User with phone number ${body.phoneNumber} and type ${body.userType} not found. Creating new user.`
              );
              const newUser = await db
                .insert(users)
                .values({
                  phoneNumber: body.phoneNumber,
                  userType: body.userType,
                })
                .returning();
              user = newUser[0];
            }

            if (!user) {
              return {
                success: false,
                message: "Could not create or find user.",
              };
            }

            // Profil zaten tamamlanmış mı kontrol et
            if (user.firstName) {
              // Kullanıcı var ve profil tamamlanmış, full login token ver
              const token = await jwt.sign({
                userId: user.id,
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
              });
              return { success: true, message: "Login successful.", token };
            }

            // Yeni kullanıcı veya profil eksik, kısa süreli kayıt token'ı ver
            const registrationToken = await jwt.sign({
              sub: "registration", // Subject claim to identify the token's purpose
              phoneNumber: user.phoneNumber,
              userType: user.userType,
              exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes expiration
            });

            return {
              success: true,
              message: "OTP verified. Please complete your profile.",
              registrationToken,
            };
          }
          return { success: false, message: "Invalid or expired OTP code." };
        },
        {
          body: t.Object({
            phoneNumber: t.String({ pattern: "^\\+[1-9]\\d{1,14}$" }),
            otpCode: t.String({ minLength: 6, maxLength: 6 }),
            userType: t.String({ enum: ["individual", "corporate"] }),
          }),
        }
      )

      // Misafir veri geçişi - OTP doğrulandıktan sonra çağrılır
      .post(
        "/migrate-guest-data",
        async ({ body, jwt, db, log, error }) => {
          const { phoneNumber, guestId } = body;

          log.info(
            { phoneNumber, guestId },
            "Attempting to migrate guest data"
          );

          // 1. Telefon numarası ile kullanıcıyı bul
          const user = await db.query.users.findFirst({
            where: eq(users.phoneNumber, phoneNumber),
          });

          if (!user) {
            return error(404, "User not found");
          }

          // 2. Misafir sepet öğelerini al
          const guestCartData = await db.query.guestCartItems.findMany({
            where: eq(guestCartItems.guestId, guestId),
          });

          // 3. Misafir favorilerini al
          const guestFavoritesData = await db.query.guestFavorites.findMany({
            where: eq(guestFavorites.guestId, guestId),
          });

          // 4. Sepet geçişi
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

          // 5. Favori geçişi
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

          // 6. Misafir verilerini temizle
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
            phoneNumber: t.String({ pattern: "^\\+[1-9]\\d{1,14}$" }),
            guestId: t.String(),
          }),
        }
      )

      // Guard bu satırdan sonraki tüm route'lara uygulanır
      .guard({
        async beforeHandle({ jwt, headers, error }) {
          const token = headers.authorization?.replace("Bearer ", "");
          if (!token) {
            return error(401, "Unauthorized");
          }

          const profile = (await jwt.verify(token)) as {
            userId: string;
            exp: number;
          };
          if (!profile) {
            return error(401, "Unauthorized");
          }

          if (await isTokenBlacklisted(token)) {
            return error(401, "Token is blacklisted. Please log in again.");
          }
        },
      })
      .post("/logout", async ({ headers, jwt, log }) => {
        const token = headers.authorization!.replace("Bearer ", "");
        const profile = (await jwt.verify(token)) as {
          userId: string;
          exp: number;
        };

        if (!profile || typeof profile.exp !== "number") {
          // Güvenlik kontrolü, guard bu durumu zaten engellemeli
          return { success: false, message: "Invalid token." };
        }

        const expiresIn = profile.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await blacklistToken(token, expiresIn);
        }

        log.info({ userId: profile.userId }, `User logged out successfully`);
        return { success: true, message: "Logged out successfully." };
      })
  );
