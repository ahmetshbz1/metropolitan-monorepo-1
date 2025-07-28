//  "order.schema.ts"
//  metropolitan backend
//  Created by Ahmet on 09.07.2025.

import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { products } from "./product.schema";
import { addresses, users } from "./user.schema";

// Siparişler tablosu
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shippingAddressId: uuid("shipping_address_id")
    .notNull()
    .references(() => addresses.id),
  billingAddressId: uuid("billing_address_id")
    .notNull()
    .references(() => addresses.id),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, shipped, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("PLN"),

  // Stripe payment fields
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, requires_action, succeeded, canceled, processing, requires_payment_method
  paymentMethodType: text("payment_method_type"), // card, apple_pay, google_pay, etc.
  stripeClientSecret: text("stripe_client_secret"), // Frontend için gerekli
  paidAt: timestamp("paid_at"), // Ödemenin tamamlandığı tarih

  trackingNumber: text("tracking_number"),
  shippingCompany: text("shipping_company").default("DHL Express"),
  estimatedDelivery: timestamp("estimated_delivery"),
  notes: text("notes"),
  invoicePdfPath: text("invoice_pdf_path"), // Fatura PDF dosya yolu
  invoicePdfGeneratedAt: timestamp("invoice_pdf_generated_at"), // PDF oluşturma tarihi
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sipariş öğeleri tablosu
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Takip olayları tablosu
export const trackingEvents = pgTable("tracking_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // info_received, picked_up, in_transit, arrived_at_hub, out_for_delivery, delivered
  statusText: text("status_text").notNull(),
  location: text("location").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
