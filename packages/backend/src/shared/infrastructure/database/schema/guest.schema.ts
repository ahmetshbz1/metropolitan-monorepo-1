//  "guest.schema.ts"
//  metropolitan backend
//  Created by Ahmet on 05.06.2025.

import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { products } from "./product.schema";

// Misafir oturumları
export const guestSessions = pgTable("guest_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: text("guest_id").notNull().unique(), // Frontend'den gelen unique ID
  deviceInfo: text("device_info"), // Platform, version vb.
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Misafir sepet öğeleri
export const guestCartItems = pgTable(
  "guest_cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: text("guest_id").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    guestProductUnique: unique("guest_cart_product_unique").on(
      table.guestId,
      table.productId
    ),
  })
);

// Misafir favorileri
export const guestFavorites = pgTable(
  "guest_favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: text("guest_id").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    guestFavoriteUnique: unique("guest_favorite_product_unique").on(
      table.guestId,
      table.productId
    ),
  })
);
