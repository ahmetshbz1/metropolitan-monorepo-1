//  "delete-user.ts"
//  metropolitan backend
//  Created by Ahmet on 21.06.2025.

import { eq } from "drizzle-orm";
import { db } from "../src/shared/infrastructure/database/connection";
import { users } from "../src/shared/infrastructure/database/schema";

const phoneNumberToDelete = process.argv[2];

if (!phoneNumberToDelete) {
  console.error("Please provide a phone number as an argument.");
  process.exit(1);
}

console.log(
  `Attempting to delete user with phone number: ${phoneNumberToDelete}...`
);

try {
  const deletedUser = await db
    .delete(users)
    .where(eq(users.phoneNumber, phoneNumberToDelete))
    .returning();

  if (deletedUser.length > 0) {
    console.log("Successfully deleted user:", deletedUser[0]);
  } else {
    console.log("User not found.");
  }
} catch (error) {
  console.error("Error deleting user:", error);
}

process.exit(0);
