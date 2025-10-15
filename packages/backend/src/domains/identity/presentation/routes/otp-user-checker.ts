// "otp-user-checker.ts"
// metropolitan backend
// User registration status checker for OTP operations

import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "../../../../shared/infrastructure/database/schema";
import type { UserCheckResult } from "./otp-types";

// Check user registration status and profile completion
export async function checkUserRegistrationStatus(
  db: NodePgDatabase<Record<string, never>>,
  phoneNumber: string,
  userType: string
): Promise<UserCheckResult> {
  const existingUser = await db.query.users.findFirst({
    where: and(eq(users.phoneNumber, phoneNumber), eq(users.userType, userType)),
  });

  // Clear logic: separate user existence from profile completion
  const isRegisteredUser = !!existingUser;
  const hasCompleteProfile = existingUser?.firstName ? true : false;
  const needsRegistration = !isRegisteredUser;

  return {
    existingUser,
    isRegisteredUser,
    hasCompleteProfile,
    needsRegistration,
  };
}
