//  "cart.schema.ts"
//  metropolitan backend
//  Created by Ahmet on 07.07.2025.

import {
  integer,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./product.schema";
import { users } from "./user.schema";

// Favoriler tablosu
export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey(table.userId, table.productId),
  })
);

// Sepet öğeleri tablosu
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userProductUnique: unique().on(table.userId, table.productId),
  })
);
