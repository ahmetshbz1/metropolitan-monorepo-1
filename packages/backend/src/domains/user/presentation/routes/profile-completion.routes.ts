//  "profile-completion.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import { t } from "elysia";

import { createApp } from "../../../../shared/infrastructure/web/app";
import { ProfileCompletionService } from "../../application/use-cases/profile-completion.service";

// JWT payload for registration token
export interface RegistrationTokenPayload {
  sub: string;
  userId?: string;
  phoneNumber: string;
  userType?: string;
}

// Public route - Registration token required
export const profileCompletionRoutes = createApp().post(
  "/complete-profile",
  async ({ jwt, body, headers, set }) => {
    try {
      const registrationToken = headers.authorization?.replace("Bearer ", "");
      if (!registrationToken) {
        set.status = 401;
        return { success: false, message: "Registration token is required." };
      }

      // Validate registration JWT token
      const payload = (await jwt.verify(registrationToken)) as
        | RegistrationTokenPayload
        | false;

      if (!payload || payload.sub !== "registration") {
        set.status = 401;
        return { success: false, message: "Invalid registration token." };
      }

      // Call profile completion service
      // Use userId if available (prevents race conditions), otherwise use phoneNumber
      const result = await ProfileCompletionService.completeProfile(
        payload.userId || payload.phoneNumber,
        body,
        jwt,
        headers,
        !!payload.userId
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
      nip: t.Optional(t.String({ minLength: 10, maxLength: 10 })),
      termsAccepted: t.Boolean({
        error: "Kullanım koşullarını kabul etmelisiniz.",
      }),
      privacyAccepted: t.Boolean({
        error: "Gizlilik politikasını kabul etmelisiniz.",
      }),
      marketingConsent: t.Optional(t.Boolean()),
      firebaseUid: t.Optional(t.String()),
      authProvider: t.Optional(t.String()),
      appleUserId: t.Optional(t.String()),
    }),
  }
);
