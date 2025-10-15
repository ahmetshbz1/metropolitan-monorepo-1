// "security-settings.routes.ts"
// metropolitan backend
// Security settings management routes

import { logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";
import { t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  deviceTracking: boolean;
}

export const securitySettingsRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(isAuthenticated)
  .group("/user", (app) =>
    app
      // Get security settings
      .get("/security-settings", async ({ profile, db, set }) => {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            twoFactorEnabled: true,
            loginAlerts: true,
            deviceTracking: true,
          },
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        const settings: SecuritySettings = {
          twoFactorEnabled: user.twoFactorEnabled ?? false,
          loginAlerts: user.loginAlerts ?? true,
          deviceTracking: user.deviceTracking ?? true,
        };

        return {
          success: true,
          data: settings,
        };
      })

      // Update security settings
      .put(
        "/security-settings",
        async ({ body, profile, db, log, set }) => {
          const userId = profile?.sub || profile?.userId;
          if (!userId) {
            set.status = 401;
            return { success: false, message: "Unauthorized" };
          }

          try {
            // Update security settings in database
            await db
              .update(users)
              .set({
                twoFactorEnabled: body.twoFactorEnabled ?? false,
                loginAlerts: body.loginAlerts ?? true,
                deviceTracking: body.deviceTracking ?? true,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));

            log.info(
              {
                userId,
                settings: body
              },
              "Security settings updated"
            );

            return {
              success: true,
              message: "Security settings updated successfully",
            };
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            log.error(
              {
                userId,
                error: message
              },
              "Failed to update security settings"
            );

            set.status = 500;
            return {
              success: false,
              message: "Failed to update security settings",
            };
          }
        },
        {
          body: t.Object({
            twoFactorEnabled: t.Optional(t.Boolean()),
            loginAlerts: t.Optional(t.Boolean()),
            deviceTracking: t.Optional(t.Boolean()),
          }),
        }
      )
  );