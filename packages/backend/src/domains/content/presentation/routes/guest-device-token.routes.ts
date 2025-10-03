//  "guest-device-token.routes.ts"
//  metropolitan backend
//  Guest device token routes

import { logger } from "@bogeychan/elysia-logger";
import { eq, and } from "drizzle-orm";
import { t } from "elysia";

import { guestDeviceTokens } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

export const guestDeviceTokenRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/guest", (app) =>
    app.post(
      "/device-token",
      async ({ body, db, log, set }) => {
        const { guestId, token, platform, deviceName, deviceId, language } = body;

        try {
          // Önce bu token bu guest'te var mı kontrol et
          const existingToken = await db
            .select()
            .from(guestDeviceTokens)
            .where(
              and(
                eq(guestDeviceTokens.guestId, guestId),
                eq(guestDeviceTokens.token, token)
              )
            )
            .limit(1);

          if (existingToken.length > 0) {
            // Token zaten var, sadece son kullanım zamanını güncelle
            await db
              .update(guestDeviceTokens)
              .set({
                lastUsedAt: new Date(),
                platform,
                deviceName: deviceName || existingToken[0].deviceName,
                language: language || existingToken[0].language,
                isValid: "true",
                failureCount: "0",
                updatedAt: new Date(),
              })
              .where(eq(guestDeviceTokens.id, existingToken[0].id));

            log.info(
              { guestId, token: token.substring(0, 20) + "..." },
              "Guest device token updated"
            );
          } else {
            // Yeni token ekle
            await db.insert(guestDeviceTokens).values({
              guestId,
              token,
              platform,
              deviceName: deviceName || "Unknown Device",
              deviceId,
              language: language || "en",
              isValid: "true",
              failureCount: "0",
            });

            log.info(
              { guestId, token: token.substring(0, 20) + "..." },
              "New guest device token saved"
            );
          }

          return {
            success: true,
            message: "Guest device token saved successfully.",
          };
        } catch (err) {
          log.error({ error: err, guestId }, "Failed to save guest device token");
          set.status = 500;
          return {
            success: false,
            message: "Failed to save guest device token",
          };
        }
      },
      {
        body: t.Object({
          guestId: t.String(),
          token: t.String(),
          platform: t.String({ enum: ["ios", "android"] }),
          deviceName: t.Optional(t.String()),
          deviceId: t.Optional(t.String()),
        }),
      }
    )
  );
