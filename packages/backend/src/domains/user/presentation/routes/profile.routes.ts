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
  async ({
    jwt,
    body,
    headers,
    error,
  }: {
    jwt: any;
    body: CompleteProfileRequest;
    headers: any;
    error: any;
  }) => {
    try {
      const registrationToken = headers.authorization?.replace("Bearer ", "");
      if (!registrationToken) {
        return error(401, "Registration token is required.");
      }

      // Kayıt token'ı için JWT doğrulama
      const payload = (await jwt.verify(registrationToken)) as
        | RegistrationTokenPayload
        | false;

      if (!payload || payload.sub !== "registration") {
        return error(401, "Invalid registration token.");
      }

      // Profil tamamlama service'i çağır
      const result = await ProfileCompletionService.completeProfile(
        payload.phoneNumber,
        body,
        jwt
      );

      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Profile completion failed";
      return error(400, message);
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
          "Kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz.",
      }),
    }),
  }
);

// Korumalı rotalar - Login token'ı gerekli
const protectedProfileRoutes = createApp()
  .use(isAuthenticated)

  // Kullanıcı profilini getir
  .get("/me", async ({ profile, error }) => {
    try {
      if (!profile) {
        return error(401, "Unauthorized");
      }

      const result = await ProfileUpdateService.getUserProfile(profile.userId);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get profile";
      return error(404, message);
    }
  })

  // Kullanıcı profilini güncelle
  .put(
    "/me",
    async ({
      profile,
      body,
      error,
    }: {
      profile: any;
      body: UpdateProfileRequest;
      error: any;
    }) => {
      try {
        if (!profile) {
          return error(401, "Unauthorized");
        }

        const result = await ProfileUpdateService.updateUserProfile(
          profile.userId,
          body
        );
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        return error(400, message);
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

  // Profil fotoğrafı yükle
  .post(
    "/me/profile-photo",
    async ({ profile, body, error }) => {
      try {
        if (!profile) {
          return error(401, "Unauthorized");
        }

        if (!body.photo) {
          return error(400, "No photo uploaded.");
        }

        const photoUrl = await ProfilePhotoService.uploadProfilePhoto(
          profile.userId,
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
        return error(500, message);
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
  );

// Her iki grubu tek export'ta birleştir
export const profileRoutes = createApp()
  .use(publicProfileRoutes)
  .use(protectedProfileRoutes);
