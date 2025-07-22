//  "count-users.ts"
//  metropolitan backend
//  Created by Ahmet on 29.06.2025.

import { count } from "drizzle-orm";
import { db } from "../src/shared/infrastructure/database/connection";
import { users } from "../src/shared/infrastructure/database/schema";

console.log("Counting total users in the database...");

try {
  const result = await db.select({ value: count() }).from(users);
  const totalUsers = result[0]?.value ?? 0;

  console.log(`There are currently ${totalUsers} user(s) in the database.`);
} catch (error) {
  console.error("Error counting users:", error);
}

process.exit(0);
