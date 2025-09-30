import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./user.schema";

export const paymentTermsSettings = pgTable("payment_terms_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  isGlobalDefault: boolean("is_global_default").notNull().default(true),
  availableTerms: text("available_terms").notNull().default("7,14,21"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userPaymentTerms = pgTable("user_payment_terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  customTerms: text("custom_terms"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
