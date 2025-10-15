//  "notifications.schema.ts"
//  metropolitan backend
//  Created by Ahmet on 26.09.2025.

import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./user.schema";

// Bildirimler tablosu - Push notification geçmişi
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Bildirim başlığı
    title: text("title").notNull(),
    // Bildirim içeriği
    body: text("body").notNull(),
    // Bildirim tipi: order_update, promotion, price_alert, new_product, system
    type: text("type").notNull().default("system"),
    // Ekstra data (JSON): screen, orderId, productId, vb.
    data: jsonb("data"),
    // Okundu mu?
    isRead: boolean("is_read").notNull().default(false),
    // Bildirim kaynağı: push, in_app, email, sms
    source: text("source").notNull().default("push"),
    // Push notification ID (Expo'dan gelen)
    pushId: text("push_id"),
    // Bildirim tıklandı mı?
    isClicked: boolean("is_clicked").notNull().default(false),
    clickedAt: timestamp("clicked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Kullanıcının bildirimlerini hızlıca çekmek için
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    // Okunmamış bildirimleri hızlıca bulmak için
    userUnreadIdx: index("notifications_user_unread_idx").on(
      table.userId,
      table.isRead
    ),
    // Tarih bazlı sıralama için
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  })
);