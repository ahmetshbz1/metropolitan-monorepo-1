// "otp-user-reactivator.ts"
// metropolitan backend
// Soft-deleted user reactivation logic

import type { Logger } from "@bogeychan/elysia-logger";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "../../../../shared/infrastructure/database/schema";
import type { UserRecord } from "./otp-types";

// Reactivate soft-deleted user account
export async function reactivateSoftDeletedUser(
  db: NodePgDatabase<Record<string, never>>,
  user: UserRecord,
  log: Logger
): Promise<UserRecord | undefined> {
  // If user is not soft-deleted, return as-is
  if (!user.deletedAt) {
    return user;
  }

  log.info(`Reactivating soft-deleted account for ${user.phoneNumber}`);

  await db
    .update(users)
    .set({
      deletedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Refresh user data
  const reactivatedUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  return reactivatedUser as UserRecord | undefined;
}
