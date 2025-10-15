// "otp-social-updater.ts"
// metropolitan backend
// Update social auth data for existing users

import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "../../../../shared/infrastructure/database/schema";
import type { UserRecord, VerifyOtpBody } from "./otp-types";

// Update existing user's social auth data if provided
export async function updateExistingSocialAuth(
  db: NodePgDatabase<Record<string, never>>,
  user: UserRecord,
  body: VerifyOtpBody,
  existingUser: UserRecord
): Promise<UserRecord> {
  // Only update if this is an existing user and social auth data is provided
  if (!existingUser || !body.firebaseUid) {
    return user;
  }

  const socialUpdateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Check and add fields that need updating
  if (body.firebaseUid && user.firebaseUid !== body.firebaseUid) {
    socialUpdateData.firebaseUid = body.firebaseUid;
  }
  if (body.provider && user.authProvider !== body.provider) {
    socialUpdateData.authProvider = body.provider;
  }
  if (body.email && body.email !== user.email) {
    socialUpdateData.email = body.email;
  }
  if (body.appleUserId && user.appleUserId !== body.appleUserId) {
    socialUpdateData.appleUserId = body.appleUserId;
  }

  // Only update if there are changes (more than just updatedAt)
  if (Object.keys(socialUpdateData).length > 1) {
    await db
      .update(users)
      .set(socialUpdateData)
      .where(eq(users.id, user.id));

    return { ...user, ...socialUpdateData } as UserRecord;
  }

  return user;
}
