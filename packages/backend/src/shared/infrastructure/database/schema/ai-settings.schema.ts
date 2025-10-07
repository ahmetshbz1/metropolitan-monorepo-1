import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const aiSettings = pgTable("ai_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().default("gemini"),
  apiKey: text("api_key").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
