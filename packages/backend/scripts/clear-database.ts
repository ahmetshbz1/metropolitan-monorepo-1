//  "clear-database.ts"
//  metropolitan backend
//  Created by Ahmet on 18.06.2025.

import { getTableName, sql } from "drizzle-orm";
import { db } from "../src/shared/infrastructure/database/connection";
import * as schema from "../src/shared/infrastructure/database/schema";

console.log("🔥 Deleting all data from the database...");

// Foreign key kısıtlamaları nedeniyle sıra önemli
const tablesToDelete = [
  schema.trackingEvents,
  schema.orderItems,
  schema.orders,
  schema.cartItems,
  schema.favorites,
  schema.addresses,
  schema.users,
  schema.companies,
  schema.productTranslations,
  schema.categoryTranslations,
  schema.products,
  schema.categories,
];

async function deleteAllData() {
  try {
    console.log("Disabling triggers for all tables...");
    await db.execute(sql`SET session_replication_role = 'replica';`);

    for (const table of tablesToDelete) {
      const tableName = getTableName(table);
      console.log(`- Deleting from ${tableName}...`);
      await db.delete(table);
    }

    console.log("Re-enabling triggers...");
    await db.execute(sql`SET session_replication_role = 'origin';`);

    console.log("✅ All data has been successfully deleted.");
  } catch (error) {
    console.error("❌ Error deleting data:", error);
    // Hata olsa bile trigger'ların tekrar aktif olduğundan emin ol
    await db.execute(sql`SET session_replication_role = 'origin';`);
  }
}

deleteAllData().finally(() => {
  process.exit(0);
});
