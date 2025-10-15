// "otp-user-creator.ts"
// metropolitan backend
// New user creation with optional social auth integration

import type { Logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "../../../../shared/infrastructure/database/schema";
import type { UserRecord, VerifyOtpBody } from "./otp-types";

// Create new user from OTP verification with optional social auth
export async function createNewUserFromOtp(
  db: NodePgDatabase<Record<string, never>>,
  body: VerifyOtpBody,
  log: Logger
): Promise<UserRecord> {
  log.info(
    `User with phone number ${body.phoneNumber} and type ${body.userType} not found. Creating new user.`
  );

  const newUserData: Record<string, unknown> = {
    phoneNumber: body.phoneNumber,
    phoneNumberVerified: true,
    userType: body.userType,
  };

  // Add social auth data if provided
  if (body.firebaseUid) {
    newUserData.firebaseUid = body.firebaseUid;
    newUserData.authProvider = body.provider;
    if (body.email) newUserData.email = body.email;
    if (body.appleUserId) newUserData.appleUserId = body.appleUserId;
  }

  const newUser = await db.insert(users).values(newUserData).returning();

  return newUser[0] as UserRecord;
}

// Update phone verification status for existing user
export async function updatePhoneVerification(
  db: NodePgDatabase<Record<string, never>>,
  user: UserRecord,
  log: Logger
): Promise<UserRecord> {
  if (user.phoneNumberVerified) {
    return user;
  }

  log.info(`Updating phone verification status for user ${user.id}`);

  await db
    .update(users)
    .set({
      phoneNumberVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return { ...user, phoneNumberVerified: true };
}
