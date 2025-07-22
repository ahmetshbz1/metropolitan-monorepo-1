//  "delete-all-users.ts"
//  metropolitan backend
//  Created by Ahmet on 28.06.2025.

import { getTableName, sql } from "drizzle-orm";
import { db } from "../src/shared/infrastructure/database/connection";
import * as schema from "../src/shared/infrastructure/database/schema";

console.log("🔥 Deleting all users (normal + guest) and their related data...");

// Foreign key kısıtlamaları nedeniyle sıra önemli
// Bu script kullanıcılarla ve misafir kullanıcılarla direkt ilişkili verileri siler
const userRelatedTables = [
  schema.trackingEvents,
  schema.orderItems,
  schema.orders,
  schema.cartItems,
  schema.favorites,
  schema.addresses,
  schema.guestCartItems,
  schema.guestFavorites,
  schema.guestSessions,
  schema.users,
];

async function deleteAllUsers() {
  try {
    console.log("Disabling triggers for user-related tables...");
    await db.execute(sql`SET session_replication_role = 'replica';`);

    for (const table of userRelatedTables) {
      const tableName = getTableName(table);
      console.log(`- Deleting from ${tableName}...`);
      await db.delete(table);
    }

    console.log("Re-enabling triggers...");
    await db.execute(sql`SET session_replication_role = 'origin';`);

    console.log(
      "✅ All users (normal + guest) and their associated data have been successfully deleted."
    );
  } catch (error) {
    console.error("❌ Error deleting user data:", error);
    // Hata olsa bile trigger'ların tekrar aktif olduğundan emin ol
    await db.execute(sql`SET session_replication_role = 'origin';`);
  }
}

deleteAllUsers().finally(() => {
  process.exit(0);
});
