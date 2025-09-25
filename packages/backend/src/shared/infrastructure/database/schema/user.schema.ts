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
    phoneNumberVerified: boolean("phone_number_verified").default(false).notNull(),
    phoneNumberChangedAt: timestamp("phone_number_changed_at"),
    previousPhoneNumber: text("previous_phone_number"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email").unique(),
    // Firebase Authentication UID
    firebaseUid: text("firebase_uid").unique(),
    // Kullanıcı tipi: 'individual' veya 'corporate'
    userType: text("user_type").notNull().default("individual"),
    profilePhotoUrl: text("profile_photo_url"),
    termsAcceptedAt: timestamp("terms_accepted_at"),
    privacyAcceptedAt: timestamp("privacy_accepted_at"),
    marketingConsentAt: timestamp("marketing_consent_at"),
    marketingConsent: boolean("marketing_consent").default(false).notNull(),
    // Bildirim tercihleri
    smsNotifications: boolean("sms_notifications").default(true).notNull(),
    pushNotifications: boolean("push_notifications").default(true).notNull(),
    emailNotifications: boolean("email_notifications").default(true).notNull(),
    deletedAt: timestamp("deleted_at"), // Soft delete için
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

// Telefon numarası değişiklik talepleri tablosu
export const phoneChangeRequests = pgTable("phone_change_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentPhone: text("current_phone").notNull(),
  newPhone: text("new_phone"),
  sessionId: text("session_id").notNull(),
  newSessionId: text("new_session_id"),
  step: text("step").notNull(), // current_verified, otp_sent, completed
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
