//  "guest-device-tokens.schema.ts"
//  metropolitan backend
//  Guest device tokens schema

import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const guestDeviceTokens = pgTable(
  "guest_device_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: text("guest_id").notNull(),
    token: text("token").notNull(),
    platform: text("platform").notNull(),
    deviceName: text("device_name"),
    deviceId: text("device_id"),
    language: text("language").notNull().default("tr"),
    lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
    isValid: text("is_valid").notNull().default("true"),
    failureCount: text("failure_count").notNull().default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    guestTokenUnique: uniqueIndex("guest_device_tokens_guest_token_unique").on(
      table.guestId,
      table.token
    ),
  })
);
