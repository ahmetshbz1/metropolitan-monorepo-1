// "notification-preferences.routes.ts"
// metropolitan backend
// Notification preferences management routes

import { logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";
import { t } from "elysia";

import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { authGuard } from "../../../identity/presentation/routes/auth-guards";

export const notificationPreferencesRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authGuard)
  .group("/user/notification-preferences", (app) =>
    app
      // Get notification preferences
      .get(
        "/",
        async ({ jwt, bearer, db }) => {
          const payload = await jwt.verify(bearer!);
          if (!payload || !payload.userId) {
            return { success: false, message: "Unauthorized" };
          }

          const user = await db.query.users.findFirst({
            where: eq(users.id, payload.userId as string),
            columns: {
              smsNotifications: true,
              pushNotifications: true,
              emailNotifications: true,
            },
          });

          if (!user) {
            return { success: false, message: "User not found" };
          }

          return {
            success: true,
            preferences: {
              sms: user.smsNotifications,
              push: user.pushNotifications,
              email: user.emailNotifications,
            },
          };
        }
      )

      // Update notification preferences
      .put(
        "/",
        async ({ body, jwt, bearer, db, log }) => {
          const payload = await jwt.verify(bearer!);
          if (!payload || !payload.userId) {
            return { success: false, message: "Unauthorized" };
          }

          await db
            .update(users)
            .set({
              smsNotifications: body.sms,
              pushNotifications: body.push,
              emailNotifications: body.email,
              updatedAt: new Date(),
            })
            .where(eq(users.id, payload.userId as string));

          log.info(
            { userId: payload.userId, preferences: body },
            "Notification preferences updated"
          );

          return {
            success: true,
            message: "Notification preferences updated successfully",
          };
        },
        {
          body: t.Object({
            sms: t.Boolean(),
            push: t.Boolean(),
            email: t.Boolean(),
          }),
        }
      )
  );