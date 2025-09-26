//  "profile.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import type {
  CompleteProfilePayload as CompleteProfileRequest,
  UpdateProfileRequest,
} from "@metropolitan/shared/types/user";
import { t } from "elysia";

import { isAuthenticated } from "../../../../shared/application/guards/auth.guard";
import { createApp } from "../../../../shared/infrastructure/web/app";
import { db } from "../../../../shared/infrastructure/database/connection";
import { deviceTokens, notifications } from "../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "./notifications.routes";
import { ProfileCompletionService } from "../../application/use-cases/profile-completion.service";
import { ProfilePhotoService } from "../../application/use-cases/profile-photo.service";
import { ProfileUpdateService } from "../../application/use-cases/profile-update.service";

// Bu tip backend'e özel kalabilir, çünkü JWT payload'u ile ilgili.
export interface RegistrationTokenPayload {
  sub: string;
  phoneNumber: string;
}

// Açık rotalar - Kayıt token'ı gerekli
const publicProfileRoutes = createApp().post(
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
      const result = await ProfileCompletionService.completeProfile(
        payload.phoneNumber,
        body,
        jwt,
        headers
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
    }),
  }
);

// Korumalı rotalar - Login token'ı gerekli
const protectedProfileRoutes = createApp()
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
              isValid: "true",
              failureCount: "0",
              updatedAt: new Date(),
            })
            .where(eq(deviceTokens.id, existingToken[0].id));

          console.log(`Device token updated for user ${userId}`);
        } else {
          // Yeni token ekle
          await db.insert(deviceTokens).values({
            userId: userId,
            token: body.token,
            platform: body.platform,
            deviceName: body.deviceName || "Unknown Device",
            deviceId: body.deviceId,
            isValid: "true",
            failureCount: "0",
          });

          console.log(`New device token saved for user ${userId}`);
        }

        // Test bildirimi gönder
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: body.token,
              title: '🎉 Metropolitan\'e Hoş Geldiniz!',
              body: 'Push bildirimleri başarıyla aktifleştirildi.',
              data: { screen: '/(tabs)' },
              sound: 'default',
              badge: 1,
            }),
          });

          const result = await response.json();
          console.log('Test notification sent:', result);

          // Bildirimi veritabanına da kaydet
          if (result.data && result.data.status === 'ok') {
            await createNotification(userId, {
              title: '🎉 Metropolitan\'e Hoş Geldiniz!',
              body: 'Push bildirimleri başarıyla aktifleştirildi.',
              type: 'system',
              data: { screen: '/(tabs)' },
              source: 'push',
              pushId: result.data.id,
            });
          }
        } catch (error) {
          console.error('Test notification error:', error);
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
          type: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          maxSize: 2 * 1024 * 1024, // 2MB
          error: 'Invalid file. Must be JPEG, PNG, or WebP under 2MB.'
        }),
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

        console.log(`Sending test push to token: ${body.token}`);

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
