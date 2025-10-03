//  "device-tokens.schema.ts"
//  metropolitan backend
//  Created by Ahmet on 26.09.2025.

import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

// Cihaz token'ları tablosu - Push notification için
export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Expo push token
    token: text("token").notNull(),
    // Platform: ios, android
    platform: text("platform").notNull(),
    // Cihaz adı: iPhone 15 Pro, Samsung Galaxy S24, vb.
    deviceName: text("device_name"),
    // Cihazın benzersiz kimliği (opsiyonel)
    deviceId: text("device_id"),
    // Uygulama dili: tr, en, pl
    language: text("language").notNull().default("en"),
    // Son kullanım zamanı - aktif olmayan tokenları temizlemek için
    lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
    // Token'ın geçersiz olup olmadığı (push hatası aldığımızda)
    isValid: text("is_valid").notNull().default("true"), // "true", "false", "unknown"
    // Push hatası sayacı
    failureCount: text("failure_count").notNull().default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Aynı kullanıcı ve token kombinasyonu tekil olmalı
    // NOT: Aynı token farklı kullanıcılarda OLABİLİR (aynı cihaz, farklı hesaplar)
    userTokenUnique: uniqueIndex("device_tokens_user_token_unique").on(
      table.userId,
      table.token
    ),
  })
);