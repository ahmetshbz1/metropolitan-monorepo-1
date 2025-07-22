//  "user.schema.ts"
//  metropolitan backend
//  Created by Ahmet on 08.06.2025.

import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Şirketler tablosu
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nip: text("nip").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Kullanıcılar tablosu
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    phoneNumber: text("phone_number").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email").unique(),
    // Kullanıcı tipi: 'individual' veya 'corporate'
    userType: text("user_type").notNull().default("individual"),
    profilePhotoUrl: text("profile_photo_url"),
    termsAcceptedAt: timestamp("terms_accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Aynı telefon numarası farklı user type'lar için kullanılabilir
    phoneUserTypeUnique: unique().on(table.phoneNumber, table.userType),
  })
);

// Adresler tablosu
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addressTitle: text("address_title").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  isDefaultDelivery: boolean("is_default_delivery").default(false).notNull(),
  isDefaultBilling: boolean("is_default_billing").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
