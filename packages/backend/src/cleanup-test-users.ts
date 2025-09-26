// cleanup-test-users.ts
// Clean up test users for Apple Sign In testing

import { db } from "./shared/infrastructure/database/connection";
import { users } from "./shared/infrastructure/database/schema";
import { or, eq, isNull } from "drizzle-orm";

async function cleanupTestUsers() {
  try {
    console.log("🧹 Cleaning up test users...\n");

    // List users that will be affected
    const testUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        authProvider: users.authProvider,
        appleUserId: users.appleUserId,
        firebaseUid: users.firebaseUid,
      })
      .from(users)
      .where(
        or(
          eq(users.email, "ahmtcanx@icloud.com"),
          eq(users.email, "umtyu58400@icloud.com"),
          eq(users.email, "info@metropolitanfg.pl")
        )
      );

    if (testUsers.length === 0) {
      console.log("No test users found to clean up.");
      return;
    }

    console.log(`Found ${testUsers.length} test users:`);
    testUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName || "Unknown"} ${user.lastName || ""}`);
      console.log(`   Email: ${user.email || "No email"}`);
      console.log(`   Phone: ${user.phoneNumber}`);
      console.log(`   Provider: ${user.authProvider || "phone"}`);
      console.log(`   Apple ID: ${user.appleUserId || "None"}`);
      console.log(`   Firebase UID: ${user.firebaseUid ? user.firebaseUid.substring(0, 10) + "..." : "None"}`);
    });

    // Ask for confirmation
    console.log("\n⚠️  These users will be DELETED from the database.");
    console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete the users
    const result = await db
      .delete(users)
      .where(
        or(
          eq(users.email, "ahmtcanx@icloud.com"),
          eq(users.email, "umtyu58400@icloud.com"),
          eq(users.email, "info@metropolitanfg.pl")
        )
      )
      .returning({ id: users.id });

    console.log(`\n✅ Successfully deleted ${result.length} users.`);

    // Also clean up any users with duplicate emails or problematic Apple IDs
    console.log("\n🔍 Checking for other problematic users...");

    const problematicUsers = await db
      .select({
        email: users.email,
        count: users.id,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .groupBy(users.email)
      .having(({ count }) => count > 1);

    if (problematicUsers.length > 0) {
      console.log(`⚠️  Found duplicate emails that might need attention:`);
      problematicUsers.forEach(u => {
        console.log(`   - ${u.email}: ${u.count} users`);
      });
    } else {
      console.log("✅ No duplicate email issues found.");
    }

    console.log("\n✨ Cleanup complete!");
    console.log("\n📱 Now you can test Apple Sign In with clean accounts:");
    console.log("   1. Clear app data on test devices");
    console.log("   2. Sign out from Apple ID if needed");
    console.log("   3. Test with fresh Apple Sign In");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    process.exit(0);
  }
}

cleanupTestUsers();