// "privacy-settings.routes.ts"
// metropolitan backend
// Privacy settings management routes

import { logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";
import { t } from "elysia";

import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { authTokenGuard } from "../../../identity/presentation/routes/auth-guards";

export const privacySettingsRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(authTokenGuard)
  .group("/user/privacy-settings", (app) =>
    app
      // Get privacy settings
      .get(
        "/",
        async ({ profile, db }) => {
          const userId = profile?.sub || profile?.userId;
          if (!userId) {
            return { success: false, message: "Unauthorized" };
          }

          const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
              marketingConsent: true,
              privacyAcceptedAt: true,
            },
          });

          if (!user) {
            return { success: false, message: "User not found" };
          }

          return {
            success: true,
            settings: {
              shareDataWithPartners: user.privacyAcceptedAt ? true : false,
              analyticsData: user.privacyAcceptedAt ? true : false,
              marketingEmails: user.marketingConsent,
            },
          };
        }
      )

      // Update privacy settings
      .put(
        "/",
        async ({ body, profile, db, log }) => {
          const userId = profile?.sub || profile?.userId;
          if (!userId) {
            return { success: false, message: "Unauthorized" };
          }

          // Update privacy settings
          const updateData: any = {
            marketingConsent: body.marketingEmails,
            updatedAt: new Date(),
          };

          // Eğer marketing consent true ise, marketing consent timestamp'ini de güncelle
          if (body.marketingEmails) {
            updateData.marketingConsentAt = new Date();
          }

          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId));

          log.info(
            { userId, settings: body },
            "Privacy settings updated"
          );

          return {
            success: true,
            message: "Privacy settings updated successfully",
          };
        },
        {
          body: t.Object({
            shareDataWithPartners: t.Boolean(),
            analyticsData: t.Boolean(),
            marketingEmails: t.Boolean(),
          }),
        }
      )
  );