// "cleanup-deleted-accounts.ts"
// metropolitan backend
// Cleanup permanently deleted accounts after 20 days

import { and, isNotNull, lt } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";

/**
 * Permanently delete accounts that have been soft-deleted for more than 20 days
 * This should be run as a cron job daily
 */
export async function cleanupDeletedAccounts(): Promise<void> {
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

  try {
    // Find and delete users who have been soft-deleted for more than 20 days
    const deletedUsers = await db
      .delete(users)
      .where(
        and(
          isNotNull(users.deletedAt),
          lt(users.deletedAt, twentyDaysAgo)
        )
      )
      .returning({ id: users.id, phoneNumber: users.phoneNumber });

    if (deletedUsers.length > 0) {
      console.log(
        `Permanently deleted ${deletedUsers.length} accounts:`,
        deletedUsers.map(u => u.phoneNumber)
      );
    }
  } catch (error) {
    console.error("Error cleaning up deleted accounts:", error);
    throw error;
  }
}

/**
 * Check if an account is eligible for permanent deletion
 * @param userId - The user ID to check
 * @returns true if the account can be permanently deleted
 */
export async function isEligibleForPermanentDeletion(userId: string): Promise<boolean> {
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

  const user = await db.query.users.findFirst({
    where: and(
      isNotNull(users.deletedAt),
      lt(users.deletedAt, twentyDaysAgo)
    ),
  });

  return !!user;
}