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
  badges: text("badges"), // JSON string olarak badge bilgileri (halal, vegan, vs.)
  // User type bazlı fiyatlandırma ve miktar kontrolleri
  individualPrice: decimal("individual_price", { precision: 10, scale: 2 }), // Bireysel kullanıcı fiyatı
  corporatePrice: decimal("corporate_price", { precision: 10, scale: 2 }), // Kurumsal kullanıcı fiyatı
  minQuantityIndividual: integer("min_quantity_individual").default(1), // Bireysel min adet
  minQuantityCorporate: integer("min_quantity_corporate").default(1), // Kurumsal min adet
  quantityPerBox: integer("quantity_per_box"), // Karton/koli başına adet
  tax: decimal("tax", { precision: 5, scale: 2 }).default("23.00"), // VAT oranı (%) - Polonya PTU
  fakturowniaProductId: integer("fakturownia_product_id"), // Fakturownia'daki ürün ID'si (sync için)
  fakturowniaTax: decimal("fakturownia_tax", { precision: 5, scale: 2 }), // Fakturownia'daki VAT oranı (sync için)
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

// Alerjen çevirileri tablosu
export const allergenTranslations = pgTable("allergen_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  allergenKey: text("allergen_key").notNull(),
  languageCode: text("language_code").notNull(),
  translation: text("translation").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Saklama koşulları çevirileri tablosu
export const storageConditionTranslations = pgTable(
  "storage_condition_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conditionKey: text("condition_key").notNull(),
    languageCode: text("language_code").notNull(),
    translation: text("translation").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);
