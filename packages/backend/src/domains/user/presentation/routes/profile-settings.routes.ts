//  "profile-settings.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import { eq } from "drizzle-orm";
import { t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";
import { createApp } from "../../../../shared/infrastructure/web/app";

// Protected routes - Login token required
export const profileSettingsRoutes = createApp()
  .use(isAuthenticated)

  // Link social provider
  .post(
    "/me/link-provider",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        // Get current user
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        // Check if user already has a different provider
        if (user.authProvider && user.authProvider !== body.provider) {
          set.status = 400;
          return {
            success: false,
            error: "PROVIDER_CONFLICT",
            message: `Your account is already linked to ${user.authProvider}`,
          };
        }

        // Check if another user already uses this social account
        const existingUserWithProvider = await db.query.users.findFirst({
          where: body.provider === 'apple' && body.appleUserId
            ? eq(users.appleUserId, body.appleUserId)
            : eq(users.firebaseUid, body.firebaseUid),
        });

        if (existingUserWithProvider && existingUserWithProvider.id !== userId) {
          set.status = 400;
          return {
            success: false,
            error: "ALREADY_LINKED",
            message: `Bu ${body.provider === 'apple' ? 'Apple' : 'Google'} hesabı zaten başka bir kullanıcıya bağlı. Önce diğer hesaptan bağlantıyı kaldırmanız gerekiyor.`,
          };
        }

        // Link the provider
        interface UpdateData {
          authProvider: string;
          firebaseUid: string;
          updatedAt: Date;
          appleUserId?: string;
          email?: string;
        }

        const updateData: UpdateData = {
          authProvider: body.provider,
          firebaseUid: body.firebaseUid,
          updatedAt: new Date(),
        };

        if (body.provider === 'apple' && body.appleUserId) {
          updateData.appleUserId = body.appleUserId;
        }

        // In linking flow, always update email from OAuth provider if different
        if (body.email && body.email !== user.email) {
          updateData.email = body.email;
        }

        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));

        return {
          success: true,
          message: `Successfully linked ${body.provider} to your account`,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to link social provider";
        set.status = 500;
        return { success: false, message };
      }
    },
    {
      body: t.Object({
        provider: t.String({ enum: ["apple", "google"] }),
        firebaseUid: t.String(),
        appleUserId: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
      }),
    }
  )

  // Unlink social provider
  .delete(
    "/me/social-provider",
    async ({ profile, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        // Get current user
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        // Check if user has social provider
        if (!user.authProvider) {
          set.status = 400;
          return { success: false, message: "No social provider linked to this account" };
        }

        // Remove social provider links
        await db
          .update(users)
          .set({
            authProvider: null,
            firebaseUid: null,
            appleUserId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        return {
          success: true,
          message: `Successfully unlinked ${user.authProvider} from your account`,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to unlink social provider";
        set.status = 500;
        return { success: false, message };
      }
    }
  )

  // Update privacy settings
  .put(
    "/privacy-settings",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        // Prepare update data
        interface PrivacyUpdateData {
          updatedAt: Date;
          shareDataWithPartners?: boolean;
          analyticsData?: boolean;
          marketingConsent?: boolean;
        }

        const updateData: PrivacyUpdateData = {
          updatedAt: new Date(),
        };

        // Update privacy settings - now 3 separate fields
        if (body.shareDataWithPartners !== undefined) {
          updateData.shareDataWithPartners = body.shareDataWithPartners;
        }

        if (body.analyticsData !== undefined) {
          updateData.analyticsData = body.analyticsData;
        }

        if (body.marketingEmails !== undefined) {
          updateData.marketingConsent = body.marketingEmails;
        }

        // Update user
        const updatedUser = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId))
          .returning();

        if (!updatedUser[0]) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        return {
          success: true,
          message: "Privacy settings updated successfully",
          data: {
            shareDataWithPartners: updatedUser[0].shareDataWithPartners || false,
            analyticsData: updatedUser[0].analyticsData || false,
            marketingEmails: updatedUser[0].marketingConsent || false,
          },
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update privacy settings";
        set.status = 500;
        return { success: false, message };
      }
    },
    {
      body: t.Object({
        shareDataWithPartners: t.Optional(t.Boolean()),
        analyticsData: t.Optional(t.Boolean()),
        marketingEmails: t.Optional(t.Boolean()),
      }),
    }
  );
