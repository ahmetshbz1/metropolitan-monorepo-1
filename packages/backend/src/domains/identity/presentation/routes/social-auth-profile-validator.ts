// "social-auth-profile-validator.ts"
// metropolitan backend
// Profile completeness validation and soft-delete handling

import { eq } from "drizzle-orm";
import type { Logger } from "@bogeychan/elysia-logger";
import { users } from "../../../../shared/infrastructure/database/schema";
import type {
  DatabaseClient,
  SocialAuthBody,
  SocialAuthIncompleteProfileResponse,
} from "./social-auth-types";
import type { User } from "./social-auth-user-resolver";

/**
 * Soft-delete durumunu kontrol eder ve gerekirse kullanıcıyı yeniden aktif eder
 *
 * Kullanıcı daha önce hesabını silmişse (soft-delete), social auth ile
 * yeniden giriş yaptığında hesabı otomatik olarak aktif edilir.
 *
 * @param db - Database client
 * @param user - Kullanıcı
 * @param log - Logger instance
 * @returns Güncellenmiş kullanıcı
 */
export async function handleSoftDeletedUser(
  db: DatabaseClient,
  user: User,
  log: Logger
): Promise<User> {
  if (!user.deletedAt) {
    return user;
  }

  log.info(
    { userId: user.id, deletedAt: user.deletedAt },
    "Reactivating soft-deleted user via social auth"
  );

  await db
    .update(users)
    .set({
      deletedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // User nesnesini güncelle
  user.deletedAt = null;
  return user;
}

/**
 * Profil tamamlanma durumunu kontrol eder
 *
 * Kullanıcının firstName alanı boşsa, profil tamamlanmamış demektir.
 * Bu durumda kullanıcıya profil tamamlama ekranı gösterilmelidir.
 *
 * @param user - Kullanıcı
 * @param log - Logger instance
 * @returns Profil eksikse incomplete response, tamamsa null
 */
export function checkProfileCompleteness(
  user: User,
  log: Logger
): SocialAuthIncompleteProfileResponse | null {
  if (!user.firstName) {
    log.info(
      {
        userId: user.id,
        hasProfile: false,
        phoneVerified: user.phoneNumberVerified,
      },
      "Social auth user needs profile completion"
    );

    return {
      success: true,
      userExists: true,
      profileComplete: false,
      message: "Please complete your profile",
    };
  }

  return null;
}

/**
 * Provider yeniden bağlama durumunu loglar
 *
 * Kullanıcı daha önce provider'ını kaldırmışsa ve şimdi yeniden bağlıyorsa,
 * bu durumu log'lar.
 *
 * @param user - Kullanıcı
 * @param body - Social auth request body
 * @param log - Logger instance
 */
export function logProviderRelinking(
  user: User,
  body: SocialAuthBody,
  log: Logger
): void {
  // Provider daha önce kaldırılmışsa ve şimdi yeniden bağlanıyorsa
  if (!user.authProvider && user.email && body.email === user.email) {
    log.info(
      {
        userId: user.id,
        provider: body.provider,
        email: user.email,
      },
      "Re-linking social provider to existing account"
    );
  }
}

/**
 * Telefon doğrulama durumunu loglar
 *
 * Social auth, kimlik doğrulaması sağladığı için telefon doğrulaması
 * yapılmamış olsa bile giriş yapılabilir.
 *
 * @param user - Kullanıcı
 * @param log - Logger instance
 */
export function logPhoneVerificationStatus(user: User, log: Logger): void {
  if (!user.phoneNumberVerified) {
    log.info(
      {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        phoneVerified: false,
      },
      "Social auth login with unverified phone (allowed)"
    );
  }
}
