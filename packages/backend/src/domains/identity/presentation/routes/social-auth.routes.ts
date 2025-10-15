// "social-auth.routes.ts"
// metropolitan backend
// Social authentication routes (Apple, Google via Firebase)

import { logger } from "@bogeychan/elysia-logger";
import { createApp } from "../../../../shared/infrastructure/web/app";
import {
  socialAuthBodySchema,
  type SocialAuthResponse,
  type SocialAuthNewUserResponse,
  type SocialAuthLinkingSuccessResponse,
  type SocialAuthLoginSuccessResponse,
} from "./social-auth-types";
import { extractCurrentUserId } from "./social-auth-token-extractor";
import { resolveUserByProvider } from "./social-auth-user-resolver";
import {
  checkLinkingConflict,
  checkProviderSwitch,
} from "./social-auth-conflict-checker";
import {
  handleSoftDeletedUser,
  checkProfileCompleteness,
  logProviderRelinking,
  logPhoneVerificationStatus,
} from "./social-auth-profile-validator";
import { updateUserProviderInfo } from "./social-auth-user-updater";
import { generateSocialAuthTokens } from "./social-auth-token-generator";

export const socialAuthRoutes = createApp()
  .use(logger({ level: "info" }))
  .group("/auth", (app) =>
    app.post(
      "/social-signin",
      async ({ body, headers, jwt, log, db, error }): Promise<SocialAuthResponse> => {
        log.info(
          {
            firebaseUid: body.firebaseUid,
            email: body.email,
            provider: body.provider,
            appleUserId: body.appleUserId,
          },
          "Social auth attempt"
        );

        // 1. Token'dan mevcut kullanıcı ID'sini çıkar (linking flow için)
        const currentUserId = await extractCurrentUserId(headers, jwt);

        // 2. Provider identifier'a göre kullanıcıyı çöz
        let user = await resolveUserByProvider(db, body, currentUserId);

        // 3. Linking flow için session kontrolü
        if (currentUserId && !user) {
          return error(401, "Invalid session for social linking");
        }

        // 4. Linking flow: Provider çakışması kontrolü
        if (currentUserId && user) {
          const linkingConflict = await checkLinkingConflict(db, body, user, log);
          if (linkingConflict) {
            return linkingConflict;
          }
        }

        // 5. Yeni kullanıcı - kayıt ekranına yönlendir
        if (!user) {
          log.info(
            { firebaseUid: body.firebaseUid, email: body.email },
            "New social auth user - needs registration"
          );

          const newUserResponse: SocialAuthNewUserResponse = {
            success: true,
            userExists: false,
            profileComplete: false,
            message: "Please complete registration",
          };
          return newUserResponse;
        }

        // 6. Soft-delete kontrolü ve reaktivasyon
        user = await handleSoftDeletedUser(db, user, log);

        // 7. Sign-in flow: Provider değişimi kontrolü
        if (!currentUserId) {
          const switchConflict = await checkProviderSwitch(user, body, log);
          if (switchConflict) {
            return switchConflict;
          }
        }

        // 8. Provider yeniden bağlama durumunu logla
        logProviderRelinking(user, body, log);

        // 9. Profil tamamlanma kontrolü
        const incompleteProfile = checkProfileCompleteness(user, log);
        if (incompleteProfile) {
          return incompleteProfile;
        }

        // 10. Telefon doğrulama durumunu logla (opsiyonel)
        logPhoneVerificationStatus(user, log);

        // 11. Kullanıcı bilgilerini güncelle
        await updateUserProviderInfo(db, user, body, currentUserId);

        // 12. Token'ları oluştur ve session kaydet
        const tokens = await generateSocialAuthTokens(user, headers, jwt, log, body);

        // 13. Hassas alanları çıkar
        const { password: _, ...safeUser } = user;

        // 14. Response hazırla
        if (currentUserId) {
          // Linking flow response
          const linkingResponse: SocialAuthLinkingSuccessResponse = {
            success: true,
            linked: true,
            message: "Social account linked successfully",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: safeUser,
          };
          return linkingResponse;
        }

        // Sign-in flow response
        const loginResponse: SocialAuthLoginSuccessResponse = {
          success: true,
          userExists: true,
          profileComplete: true,
          message: "Login successful",
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user: safeUser,
        };
        return loginResponse;
      },
      {
        body: socialAuthBodySchema,
      }
    )
  );
