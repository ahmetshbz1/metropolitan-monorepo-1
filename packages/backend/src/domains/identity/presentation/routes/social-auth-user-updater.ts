// "social-auth-user-updater.ts"
// metropolitan backend
// User update logic for social auth provider information

import { eq } from "drizzle-orm";
import { users } from "../../../../shared/infrastructure/database/schema";
import type { DatabaseClient, SocialAuthBody } from "./social-auth-types";
import type { User } from "./social-auth-user-resolver";

/**
 * Kullanıcının social provider bilgilerini günceller
 *
 * Güncelleme kuralları:
 * 1. Provider değişmişse güncellenir
 * 2. Apple User ID değişmişse güncellenir
 * 3. Firebase UID değişmişse güncellenir
 * 4. Email güncellemesi:
 *    - Linking flow'da (currentUserId varsa): Email her zaman güncellenir
 *    - Sign-in flow'da: Sadece kullanıcının emaili yoksa güncellenir
 *
 * @param db - Database client
 * @param user - Kullanıcı
 * @param body - Social auth request body
 * @param currentUserId - Mevcut kullanıcı ID'si (linking flow için)
 */
export async function updateUserProviderInfo(
  db: DatabaseClient,
  user: User,
  body: SocialAuthBody,
  currentUserId?: string
): Promise<void> {
  const updateData: Partial<{
    authProvider: string;
    appleUserId: string;
    firebaseUid: string;
    email: string;
    updatedAt: Date;
  }> = {};

  // Provider güncelleme
  if (user.authProvider !== body.provider) {
    updateData.authProvider = body.provider;
  }

  // Apple User ID güncelleme
  if (
    body.provider === "apple" &&
    body.appleUserId &&
    user.appleUserId !== body.appleUserId
  ) {
    updateData.appleUserId = body.appleUserId;
  }

  // Firebase UID güncelleme
  if (body.firebaseUid && user.firebaseUid !== body.firebaseUid) {
    updateData.firebaseUid = body.firebaseUid;
  }

  // Email güncelleme kuralları
  if (body.email) {
    // Linking flow: OAuth provider'dan gelen email her zaman güncellenir
    if (currentUserId && body.email !== user.email) {
      updateData.email = body.email;
    }
    // Sign-in flow: Sadece kullanıcının emaili yoksa güncellenir
    else if (!currentUserId && !user.email) {
      updateData.email = body.email;
    }
  }

  // Güncelleme varsa veritabanına yaz
  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db.update(users).set(updateData).where(eq(users.id, user.id));
  }
}
