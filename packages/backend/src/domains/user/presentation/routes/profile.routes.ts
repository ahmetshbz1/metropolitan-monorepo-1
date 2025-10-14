//  "profile.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import type {
  CompleteProfilePayload as CompleteProfileRequest,
  UpdateProfileRequest,
} from "@metropolitan/shared/types/user";
import { t } from "elysia";
import { logger } from "@bogeychan/elysia-logger";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { db } from "../../../../shared/infrastructure/database/connection";
import { deviceTokens, notifications, users } from "../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "./notifications.routes";
import { ProfileCompletionService } from "../../application/use-cases/profile-completion.service";
import { ProfilePhotoService } from "../../application/use-cases/profile-photo.service";
import { ProfileUpdateService } from "../../application/use-cases/profile-update.service";
import { getNotificationTranslation } from "../../../../shared/application/services/notification-translations";

// Bu tip backend'e özel kalabilir, çünkü JWT payload'u ile ilgili.
export interface RegistrationTokenPayload {
  sub: string;
  userId?: string; // User ID to prevent race conditions
  phoneNumber: string;
  userType?: string;
}

// Açık rotalar - Kayıt token'ı gerekli
const publicProfileRoutes = createApp()
  .use(logger({ level: "info" }))
  .post(
  "/complete-profile",
  async ({ jwt, body, headers, set }) => {
    try {
      const registrationToken = headers.authorization?.replace("Bearer ", "");
      if (!registrationToken) {
        set.status = 401;
        return { success: false, message: "Registration token is required." };
      }

      // Kayıt token'ı için JWT doğrulama
      const payload = (await jwt.verify(registrationToken)) as
        | RegistrationTokenPayload
        | false;

      if (!payload || payload.sub !== "registration") {
        set.status = 401;
        return { success: false, message: "Invalid registration token." };
      }

      // Profil tamamlama service'i çağır
      // userId varsa onu kullan (race condition önleme), yoksa phoneNumber ile devam et
      const result = await ProfileCompletionService.completeProfile(
        payload.userId || payload.phoneNumber,
        body,
        jwt,
        headers,
        !!payload.userId // Pass flag to indicate if we're using userId
      );

      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Profile completion failed";
      set.status = 400;
      return { success: false, message };
    }
  },
  {
    body: t.Object({
      userType: t.String({ enum: ["individual", "corporate"] }),
      firstName: t.String(),
      lastName: t.String(),
      email: t.String({ format: "email" }),
      // Kurumsal kullanıcılar için zorunlu, bireysel için optional
      nip: t.Optional(t.String({ minLength: 10, maxLength: 10 })),
      termsAccepted: t.Boolean({
        error:
          "Kullanım koşullarını kabul etmelisiniz.",
      }),
      privacyAccepted: t.Boolean({
        error:
          "Gizlilik politikasını kabul etmelisiniz.",
      }),
      marketingConsent: t.Optional(t.Boolean()),
      firebaseUid: t.Optional(t.String()),
      authProvider: t.Optional(t.String()),
      appleUserId: t.Optional(t.String()), // Apple's unique user ID
    }),
  }
);

// Korumalı rotalar - Login token'ı gerekli
const protectedProfileRoutes = createApp()
  .use(logger({ level: "info" }))
  .use(isAuthenticated)

  // Kullanıcı profilini getir
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

  // Kullanıcı profilini güncelle
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

  // Push notification token kaydet
  .post(
    "/device-token",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        // Önce bu token bu kullanıcıda var mı kontrol et
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
          // Token zaten var, sadece son kullanım zamanını güncelle
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

          logger.info({ userId, tokenId: existingToken[0].id }, "Device token updated");
        } else {
          // Yeni token ekle
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

          // Sadece yeni token için hoş geldiniz bildirimi gönder
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
            logger.info({ userId, pushResult: result.data?.status }, "Welcome notification sent");

            // Bildirimi veritabanına da kaydet
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

  // Profil fotoğrafı yükle
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

        // Photo file validation logging
        logger.info({
          userId,
          mimeType: body.photo.type,
          size: body.photo.size,
          fileName: body.photo.name
        }, "Profile photo upload initiated");

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
          // TEMPORARY: No validation - just accept everything for debugging
          maxSize: 10 * 1024 * 1024, // 10MB
        }),
      }),
    }
  )

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
        const updateData: any = {
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

  // Privacy settings güncelleme
  .put(
    "/privacy-settings",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        // Güncelleme verilerini hazırla
        const updateData: any = {
          updatedAt: new Date(),
        };

        // Privacy settings'leri güncelle - artık 3 ayrı alan var
        if (body.shareDataWithPartners !== undefined) {
          updateData.shareDataWithPartners = body.shareDataWithPartners;
        }

        if (body.analyticsData !== undefined) {
          updateData.analyticsData = body.analyticsData;
        }

        if (body.marketingEmails !== undefined) {
          updateData.marketingConsent = body.marketingEmails;
        }

        // Kullanıcıyı güncelle
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
  )

  // Test push notification gönder
  .post(
    "/test-push",
    async ({ profile, body, set }) => {
      try {
        const userId = profile?.sub || profile?.userId;
        if (!userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        logger.info({ userId, tokenPreview: body.token.substring(0, 20) }, "Sending test push notification");

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: body.token,
            title: body.title || '🔔 Test Bildirimi',
            body: body.body || 'Bu bir test bildirimidir.',
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

// Her iki grubu tek export'ta birleştir
export const profileRoutes = createApp()
  .use(publicProfileRoutes)
  .use(protectedProfileRoutes);
