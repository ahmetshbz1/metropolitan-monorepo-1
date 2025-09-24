//  "product.schema.ts"
//  metropolitan backend
//  Created by Ahmet on 06.06.2025.

import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Kategoriler tablosu
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Kategori çevirileri tablosu
export const categoryTranslations = pgTable("category_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  languageCode: text("language_code").notNull(),
  name: text("name").notNull(),
});

// Ürünler tablosu
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  productCode: text("product_code").unique().notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  brand: text("brand"),
  size: text("size"),
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("PLN"),
  stock: integer("stock").default(0),
  // Ürün detay bilgileri
  allergens: text("allergens"), // Alerjen maddeler listesi
  nutritionalValues: text("nutritional_values"), // JSON string olarak besin değerleri
  netQuantity: text("net_quantity"), // Net miktar (örn: 500g, 1L)
  expiryDate: timestamp("expiry_date"), // Son kullanma tarihi
  storageConditions: text("storage_conditions"), // Saklama koşulları
  manufacturerInfo: text("manufacturer_info"), // JSON string olarak üretici bilgileri
  originCountry: text("origin_country"), // Menşe ülkesi
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ürün çevirileri tablosu
export const productTranslations = pgTable("product_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  languageCode: text("language_code").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name"),
  description: text("description"),
});
