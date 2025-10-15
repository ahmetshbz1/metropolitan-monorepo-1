// "social-auth-user-resolver.ts"
// metropolitan backend
// User resolution logic based on social provider identifiers

import { eq } from "drizzle-orm";
import { users } from "../../../../shared/infrastructure/database/schema";
import type { DatabaseClient, SocialAuthBody } from "./social-auth-types";

export interface User {
  id: string;
  companyId: string | null;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  phoneNumberChangedAt: Date | null;
  previousPhoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  firebaseUid: string | null;
  appleUserId: string | null;
  authProvider: string | null;
  userType: string;
  profilePhotoUrl: string | null;
  termsAcceptedAt: Date | null;
  privacyAcceptedAt: Date | null;
  marketingConsentAt: Date | null;
  marketingConsent: boolean;
  shareDataWithPartners: boolean;
  analyticsData: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Social provider identifier'larına göre kullanıcıyı bulur
 *
 * İki farklı flow desteklenir:
 * 1. Linking flow: currentUserId varsa, o kullanıcıyı döner
 * 2. Sign-in flow: Provider-specific identifier'a göre kullanıcı arar
 *
 * Önemli: Email ile otomatik linking YAPILMAZ, sadece provider identifier'ları kullanılır
 * - Apple için: appleUserId
 * - Google için: firebaseUid
 *
 * @param db - Database client
 * @param body - Social auth request body
 * @param currentUserId - Mevcut kullanıcı ID'si (linking flow için)
 * @returns Kullanıcı veya undefined
 */
export async function resolveUserByProvider(
  db: DatabaseClient,
  body: SocialAuthBody,
  currentUserId?: string
): Promise<User | undefined> {
  // Linking flow: Mevcut kullanıcıyı getir
  if (currentUserId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUserId),
    });
    return user as User | undefined;
  }

  // Sign-in flow: Provider-specific identifier'a göre kullanıcı bul
  // Email ile otomatik linking YAPILMAZ - bu güvenlik riski yaratır
  if (body.provider === "apple" && body.appleUserId) {
    // Apple için SADECE appleUserId kullan
    const user = await db.query.users.findFirst({
      where: eq(users.appleUserId, body.appleUserId),
    });
    return user as User | undefined;
  }

  if (body.provider === "google" && body.firebaseUid) {
    // Google için SADECE firebaseUid kullan
    const user = await db.query.users.findFirst({
      where: eq(users.firebaseUid, body.firebaseUid),
    });
    return user as User | undefined;
  }

  return undefined;
}
