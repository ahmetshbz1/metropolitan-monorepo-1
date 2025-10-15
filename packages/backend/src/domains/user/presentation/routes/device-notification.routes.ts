//  "device-notification.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import { and, eq } from "drizzle-orm";
import { t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { getNotificationTranslation } from "../../../../shared/application/services/notification-translations";
import { db } from "../../../../shared/infrastructure/database/connection";
import { deviceTokens } from "../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { createApp } from "../../../../shared/infrastructure/web/app";

import { createNotification } from "./notifications.routes";

// Protected routes - Login token required
export const deviceNotificationRoutes = createApp()
  .use(isAuthenticated)

  // Save push notification token
  .post(
    "/device-token",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        // Check if this token already exists for this user
        const existingToken = await db
          .select()
          .from(deviceTokens)
          .where(
            and(
              eq(deviceTokens.userId, userId),
              eq(deviceTokens.token, body.token)
            )
          )
          .limit(1);

        if (existingToken.length > 0) {
          // Token already exists, just update last used time
          await db
            .update(deviceTokens)
            .set({
              lastUsedAt: new Date(),
              platform: body.platform,
              deviceName: body.deviceName || existingToken[0].deviceName,
              language: body.language || existingToken[0].language,
              isValid: "true",
              failureCount: "0",
              updatedAt: new Date(),
            })
            .where(eq(deviceTokens.id, existingToken[0].id));

          logger.debug({ userId, platform: body.platform }, "Device token updated");
        } else {
          // Add new token
          await db.insert(deviceTokens).values({
            userId: userId,
            token: body.token,
            platform: body.platform,
            deviceName: body.deviceName || "Unknown Device",
            deviceId: body.deviceId,
            language: body.language || "en",
            isValid: "true",
            failureCount: "0",
          });

          logger.info({ userId, platform: body.platform }, "New device token saved");

          // Send welcome notification only for new tokens
          try {
            const welcomeNotification = getNotificationTranslation(
              'welcome',
              body.language || 'en'
            );

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: body.token,
                title: welcomeNotification.title,
                body: welcomeNotification.body,
                data: { screen: '/(tabs)' },
                sound: 'default',
                badge: 1,
              }),
            });

            const result = await response.json();
            logger.info({ userId, status: result.data?.status }, "Welcome notification sent");

            // Save notification to database
            if (result.data && result.data.status === 'ok') {
              await createNotification(userId, {
                title: welcomeNotification.title,
                body: welcomeNotification.body,
                type: 'system',
                data: { screen: '/(tabs)' },
                source: 'push',
                pushId: result.data.id,
              });
            }
          } catch (error) {
            logger.error({ userId, error: error instanceof Error ? error.message : String(error) }, "Welcome notification error");
          }
        }

        return {
          success: true,
          message: "Device token saved successfully.",
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save device token";
        set.status = 500;
        return { success: false, message };
      }
    },
    {
      body: t.Object({
        token: t.String(),
        platform: t.String({ enum: ["ios", "android"] }),
        deviceName: t.Optional(t.String()),
        deviceId: t.Optional(t.String()),
        language: t.Optional(t.String({ enum: ["tr", "en", "pl"] })),
      }),
    }
  )

  // Send test push notification
  .post(
    "/test-push",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        logger.info({ userId, hasToken: !!body.token }, "Sending test push notification");

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: body.token,
            title: body.title || 'Test Notification',
            body: body.body || 'This is a test notification.',
            data: body.data || { test: true },
            sound: 'default',
            badge: 1,
          }),
        });

        const result = await response.json();

        if (result.data?.status === 'ok') {
          return {
            success: true,
            message: "Test notification sent successfully",
            result,
          };
        } else {
          return {
            success: false,
            message: "Failed to send test notification",
            result,
          };
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send test notification";
        set.status = 500;
        return { success: false, message };
      }
    },
    {
      body: t.Object({
        token: t.String(),
        title: t.Optional(t.String()),
        body: t.Optional(t.String()),
        data: t.Optional(t.Object({})),
      }),
    }
  );
