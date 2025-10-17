import { pgTable, foreignKey, unique, uuid, integer, timestamp, text, boolean, uniqueIndex, numeric, index, jsonb, bigint, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_items_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cart_items_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("cart_items_user_id_product_id_unique").on(table.userId, table.productId),
]);

export const adminUsers = pgTable("admin_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	failedAttemptCount: integer("failed_attempt_count").default(0).notNull(),
	lastFailedAttemptAt: timestamp("last_failed_attempt_at", { mode: 'string' }),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("admin_users_email_unique").on(table.email),
]);

export const aiSettings = pgTable("ai_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	provider: text().default('gemini').notNull(),
	apiKey: text("api_key").notNull(),
	model: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const allergenTranslations = pgTable("allergen_translations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	allergenKey: text("allergen_key").notNull(),
	languageCode: text("language_code").notNull(),
	translation: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const deviceTokens = pgTable("device_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	platform: text().notNull(),
	deviceName: text("device_name"),
	deviceId: text("device_id"),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).defaultNow().notNull(),
	isValid: text("is_valid").default('true').notNull(),
	failureCount: text("failure_count").default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	language: text().default('en').notNull(),
}, (table) => [
	uniqueIndex("device_tokens_user_token_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "device_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const guestCartItems = pgTable("guest_cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	guestId: text("guest_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "guest_cart_items_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("guest_cart_product_unique").on(table.guestId, table.productId),
]);

export const guestFavorites = pgTable("guest_favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	guestId: text("guest_id").notNull(),
	productId: uuid("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "guest_favorites_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("guest_favorite_product_unique").on(table.guestId, table.productId),
]);

export const guestDeviceTokens = pgTable("guest_device_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	guestId: text("guest_id").notNull(),
	token: text().notNull(),
	platform: text().notNull(),
	deviceName: text("device_name"),
	deviceId: text("device_id"),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).defaultNow().notNull(),
	isValid: text("is_valid").default('true').notNull(),
	failureCount: text("failure_count").default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	language: text().default('en').notNull(),
}, (table) => [
	uniqueIndex("guest_device_tokens_guest_token_unique").using("btree", table.guestId.asc().nullsLast().op("text_ops"), table.token.asc().nullsLast().op("text_ops")),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	nip: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("companies_nip_unique").on(table.nip),
]);

export const addresses = pgTable("addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	addressTitle: text("address_title").notNull(),
	street: text().notNull(),
	city: text().notNull(),
	postalCode: text("postal_code").notNull(),
	country: text().notNull(),
	isDefaultDelivery: boolean("is_default_delivery").default(false).notNull(),
	isDefaultBilling: boolean("is_default_billing").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "addresses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("categories_slug_unique").on(table.slug),
]);

export const guestSessions = pgTable("guest_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	guestId: text("guest_id").notNull(),
	deviceInfo: text("device_info"),
	lastActivity: timestamp("last_activity", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("guest_sessions_guest_id_unique").on(table.guestId),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderNumber: text("order_number").notNull(),
	userId: uuid("user_id").notNull(),
	shippingAddressId: uuid("shipping_address_id").notNull(),
	billingAddressId: uuid("billing_address_id").notNull(),
	status: text().default('pending').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	currency: text().default('PLN').notNull(),
	stripePaymentIntentId: text("stripe_payment_intent_id"),
	paymentStatus: text("payment_status").default('pending').notNull(),
	paymentMethodType: text("payment_method_type"),
	stripeClientSecret: text("stripe_client_secret"),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	trackingNumber: text("tracking_number"),
	shippingCompany: text("shipping_company"),
	estimatedDelivery: timestamp("estimated_delivery", { mode: 'string' }),
	notes: text(),
	invoicePdfPath: text("invoice_pdf_path"),
	invoicePdfGeneratedAt: timestamp("invoice_pdf_generated_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	cancelReason: text("cancel_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	paymentTermDays: integer("payment_term_days"),
	fakturowniaInvoiceId: integer("fakturownia_invoice_id"),
}, (table) => [
	foreignKey({
			columns: [table.billingAddressId],
			foreignColumns: [addresses.id],
			name: "orders_billing_address_id_addresses_id_fk"
		}),
	foreignKey({
			columns: [table.shippingAddressId],
			foreignColumns: [addresses.id],
			name: "orders_shipping_address_id_addresses_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("orders_order_number_unique").on(table.orderNumber),
]);

export const phoneChangeRequests = pgTable("phone_change_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	currentPhone: text("current_phone").notNull(),
	newPhone: text("new_phone"),
	sessionId: text("session_id").notNull(),
	newSessionId: text("new_session_id"),
	step: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "phone_change_requests_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const paymentTermsSettings = pgTable("payment_terms_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	isGlobalDefault: boolean("is_global_default").default(true).notNull(),
	availableTerms: text("available_terms").default('7,14,21').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().notNull(),
	body: text().notNull(),
	type: text().default('system').notNull(),
	data: jsonb(),
	isRead: boolean("is_read").default(false).notNull(),
	source: text().default('push').notNull(),
	pushId: text("push_id"),
	isClicked: boolean("is_clicked").default(false).notNull(),
	clickedAt: timestamp("clicked_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("notifications_user_unread_idx").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const productTranslations = pgTable("product_translations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	languageCode: text("language_code").notNull(),
	name: text().notNull(),
	fullName: text("full_name"),
	description: text(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_translations_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productCode: text("product_code").notNull(),
	categoryId: uuid("category_id"),
	brand: text(),
	size: text(),
	imageUrl: text("image_url"),
	price: numeric({ precision: 10, scale:  2 }),
	currency: text().default('PLN').notNull(),
	stock: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	allergens: text(),
	nutritionalValues: text("nutritional_values"),
	netQuantity: text("net_quantity"),
	expiryDate: timestamp("expiry_date", { mode: 'string' }),
	storageConditions: text("storage_conditions"),
	manufacturerInfo: text("manufacturer_info"),
	originCountry: text("origin_country"),
	badges: text(),
	individualPrice: numeric("individual_price", { precision: 10, scale:  2 }),
	corporatePrice: numeric("corporate_price", { precision: 10, scale:  2 }),
	minQuantityIndividual: integer("min_quantity_individual").default(1),
	minQuantityCorporate: integer("min_quantity_corporate").default(1),
	quantityPerBox: integer("quantity_per_box"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fakturowniaProductId: bigint("fakturownia_product_id", { mode: "number" }),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }),
	syncStatus: text("sync_status").default('pending'),
	tax: integer().default(23).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}).onDelete("set null"),
	unique("products_product_code_unique").on(table.productCode),
	unique("products_fakturownia_product_id_unique").on(table.fakturowniaProductId),
]);

export const storageConditionTranslations = pgTable("storage_condition_translations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conditionKey: text("condition_key").notNull(),
	languageCode: text("language_code").notNull(),
	translation: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const userPaymentTerms = pgTable("user_payment_terms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	customTerms: text("custom_terms"),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_payment_terms_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_payment_terms_user_id_unique").on(table.userId),
]);

export const trackingEvents = pgTable("tracking_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	status: text().notNull(),
	statusText: text("status_text").notNull(),
	location: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "tracking_events_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	phoneNumber: text("phone_number").notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text(),
	userType: text("user_type").default('individual').notNull(),
	profilePhotoUrl: text("profile_photo_url"),
	termsAcceptedAt: timestamp("terms_accepted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	privacyAcceptedAt: timestamp("privacy_accepted_at", { mode: 'string' }),
	marketingConsentAt: timestamp("marketing_consent_at", { mode: 'string' }),
	marketingConsent: boolean("marketing_consent").default(false).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	smsNotifications: boolean("sms_notifications").default(true).notNull(),
	pushNotifications: boolean("push_notifications").default(true).notNull(),
	emailNotifications: boolean("email_notifications").default(true).notNull(),
	phoneNumberVerified: boolean("phone_number_verified").default(false).notNull(),
	phoneNumberChangedAt: timestamp("phone_number_changed_at", { mode: 'string' }),
	previousPhoneNumber: text("previous_phone_number"),
	firebaseUid: text("firebase_uid"),
	authProvider: text("auth_provider"),
	appleUserId: text("apple_user_id"),
	shareDataWithPartners: boolean("share_data_with_partners").default(false).notNull(),
	analyticsData: boolean("analytics_data").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "users_company_id_companies_id_fk"
		}).onDelete("set null"),
	unique("users_phone_number_user_type_unique").on(table.phoneNumber, table.userType),
	unique("users_email_unique").on(table.email),
	unique("users_firebase_uid_unique").on(table.firebaseUid),
	unique("users_apple_user_id_unique").on(table.appleUserId),
]);

export const categoryTranslations = pgTable("category_translations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	languageCode: text("language_code").notNull(),
	name: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "category_translations_category_id_categories_id_fk"
		}).onDelete("cascade"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
]);

export const favorites = pgTable("favorites", {
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "favorites_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "favorites_user_id_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.productId], name: "favorites_user_id_product_id_pk"}),
]);
