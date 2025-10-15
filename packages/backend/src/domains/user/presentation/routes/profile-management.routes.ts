//  "profile-management.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import { t } from "elysia";
import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { ProfilePhotoService } from "../../application/use-cases/profile-photo.service";
import { ProfileUpdateService } from "../../application/use-cases/profile-update.service";

// Protected routes - Login token required
export const profileManagementRoutes = createApp()
  .use(isAuthenticated)

  // Get user profile
  .get("/me", async ({ profile, set }) => {
    try {
      const userId = profile?.sub || profile?.userId;
      if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const result = await ProfileUpdateService.getUserProfile(userId);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get profile";
      set.status = 404;
      return { success: false, message };
    }
  })

  // Update user profile
  .put(
    "/me",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const result = await ProfileUpdateService.updateUserProfile(
          userId,
          body
        );
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        set.status = 400;
        return { success: false, message };
      }
    },
    {
      body: t.Object({
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
      }),
    }
  )

  // Upload profile photo
  .post(
    "/me/profile-photo",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        if (!body.photo) {
          set.status = 400;
          return { success: false, message: "No photo uploaded." };
        }

        logger.debug({
          userId,
          mimeType: body.photo.type,
          size: body.photo.size,
          name: body.photo.name
        }, "Profile photo upload request");

        const photoUrl = await ProfilePhotoService.uploadProfilePhoto(
          userId,
          body.photo
        );

        return {
          success: true,
          message: "Profile photo updated successfully.",
          data: { photoUrl },
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload photo";
        set.status = 500;
        return { success: false, message };
      }
    },
    {
      body: t.Object({
        photo: t.File({
          maxSize: 10 * 1024 * 1024, // 10MB
        }),
      }),
    }
  );
