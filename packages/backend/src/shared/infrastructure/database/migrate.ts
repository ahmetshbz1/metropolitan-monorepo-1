//  "migrate.ts"
//  metropolitan backend
//  Created by Ahmet on 25.06.2025.

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationClient = postgres({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  database: process.env.POSTGRES_DB!,
  max: 1, // We only need one connection for migrations
});

async function runMigrations() {
  console.log("Running database migrations...");
  try {
    await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Error running migrations:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
