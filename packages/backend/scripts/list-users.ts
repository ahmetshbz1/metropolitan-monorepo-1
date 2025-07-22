//  "list-users.ts"
//  metropolitan backend
//  Created by Ahmet on 22.06.2025.

import { db } from "../src/shared/infrastructure/database/connection";
import { users } from "../src/shared/infrastructure/database/schema";

console.log("Fetching all users from the database...");

try {
  const allUsers = await db.select().from(users);

  if (allUsers.length === 0) {
    console.log("No users found in the database.");
  } else {
    console.log(`Found ${allUsers.length} user(s):`);
    console.table(
      allUsers.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        companyId: user.companyId,
        termsAcceptedAt: user.termsAcceptedAt,
        profilePhotoUrl: user.profilePhotoUrl,
      }))
    );
  }
} catch (error) {
  console.error("Error fetching users:", error);
}

process.exit(0);
