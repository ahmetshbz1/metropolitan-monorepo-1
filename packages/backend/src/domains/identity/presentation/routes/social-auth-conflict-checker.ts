// "social-auth-conflict-checker.ts"
// metropolitan backend
// Provider conflict detection for social auth

import { and, eq } from "drizzle-orm";
import type { Logger } from "@bogeychan/elysia-logger";
import { users } from "../../../../shared/infrastructure/database/schema";
import type {
  DatabaseClient,
  SocialAuthBody,
  SocialAuthProviderConflictResponse,
} from "./social-auth-types";
import type { User } from "./social-auth-user-resolver";

/**
 * Linking flow'da provider çakışması kontrolü
 *
 * Bir kullanıcı social provider bağlarken, aynı provider identifier'ın
 * başka bir kullanıcı tarafından kullanılıp kullanılmadığını kontrol eder.
 *
 * @param db - Database client
 * @param body - Social auth request body
 * @param user - Mevcut kullanıcı
 * @param log - Logger instance
 * @returns Çakışma varsa conflict response, yoksa null
 */
export async function checkLinkingConflict(
  db: DatabaseClient,
  body: SocialAuthBody,
  user: User,
  log: Logger
): Promise<SocialAuthProviderConflictResponse | null> {
  // Apple provider kontrolü
  if (body.provider === "apple" && body.appleUserId) {
    const conflict = await db.query.users.findFirst({
      where: and(
        eq(users.appleUserId, body.appleUserId),
        eq(users.userType, user.userType)
      ),
    });

    if (conflict && conflict.id !== user.id) {
      log.warn(
        {
          userId: user.id,
          conflictUserId: conflict.id,
          appleUserId: body.appleUserId,
        },
        "Apple account already linked to another user"
      );

      return {
        success: false,
        error: "PROVIDER_CONFLICT",
        message: "This Apple account is already linked to another user.",
      };
    }
  }

  // Google provider kontrolü
  if (body.provider === "google" && body.firebaseUid) {
    const conflict = await db.query.users.findFirst({
      where: and(
        eq(users.firebaseUid, body.firebaseUid),
        eq(users.userType, user.userType)
      ),
    });

    if (conflict && conflict.id !== user.id) {
      log.warn(
        {
          userId: user.id,
          conflictUserId: conflict.id,
          firebaseUid: body.firebaseUid,
        },
        "Google account already linked to another user"
      );

      return {
        success: false,
        error: "PROVIDER_CONFLICT",
        message: "This Google account is already linked to another user.",
      };
    }
  }

  return null;
}

/**
 * Sign-in flow'da provider değişimi kontrolü
 *
 * Kullanıcı farklı bir social provider ile giriş yapmaya çalıştığında,
 * mevcut provider'ı kaldırmadan yeni provider ile giriş yapılamaz.
 *
 * @param user - Mevcut kullanıcı
 * @param body - Social auth request body
 * @param log - Logger instance
 * @returns Çakışma varsa conflict response, yoksa null
 */
export async function checkProviderSwitch(
  user: User,
  body: SocialAuthBody,
  log: Logger
): Promise<SocialAuthProviderConflictResponse | null> {
  // Kullanıcının zaten bir provider'ı varsa ve farklı bir provider ile giriş yapmaya çalışıyorsa
  if (user.authProvider && user.authProvider !== body.provider) {
    log.warn(
      {
        userId: user.id,
        existingProvider: user.authProvider,
        attemptedProvider: body.provider,
      },
      "User attempting to link different social provider"
    );

    const existingProviderName =
      user.authProvider === "apple" ? "Apple" : "Google";
    const attemptedProviderName = body.provider === "apple" ? "Apple" : "Google";

    return {
      success: false,
      userExists: true,
      profileComplete: !!user.firstName,
      error: "PROVIDER_CONFLICT",
      message: `Bu hesap zaten ${existingProviderName} ile bağlı. ${attemptedProviderName} ile giriş yapmak için önce Ayarlar > Güvenlik > Bağlı Hesaplar'dan mevcut bağlantıyı kaldırın.`,
      existingProvider: user.authProvider,
      attemptedProvider: body.provider,
      suggestedAction: "unlink_first",
    };
  }

  return null;
}
