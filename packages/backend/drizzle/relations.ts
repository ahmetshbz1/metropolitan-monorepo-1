import { relations } from "drizzle-orm/relations";
import { products, cartItems, users, deviceTokens, guestCartItems, guestFavorites, addresses, orders, phoneChangeRequests, notifications, productTranslations, categories, userPaymentTerms, trackingEvents, companies, categoryTranslations, orderItems, favorites } from "./schema";

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [cartItems.userId],
		references: [users.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	cartItems: many(cartItems),
	guestCartItems: many(guestCartItems),
	guestFavorites: many(guestFavorites),
	productTranslations: many(productTranslations),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	orderItems: many(orderItems),
	favorites: many(favorites),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	cartItems: many(cartItems),
	deviceTokens: many(deviceTokens),
	addresses: many(addresses),
	orders: many(orders),
	phoneChangeRequests: many(phoneChangeRequests),
	notifications: many(notifications),
	userPaymentTerms: many(userPaymentTerms),
	company: one(companies, {
		fields: [users.companyId],
		references: [companies.id]
	}),
	favorites: many(favorites),
}));

export const deviceTokensRelations = relations(deviceTokens, ({one}) => ({
	user: one(users, {
		fields: [deviceTokens.userId],
		references: [users.id]
	}),
}));

export const guestCartItemsRelations = relations(guestCartItems, ({one}) => ({
	product: one(products, {
		fields: [guestCartItems.productId],
		references: [products.id]
	}),
}));

export const guestFavoritesRelations = relations(guestFavorites, ({one}) => ({
	product: one(products, {
		fields: [guestFavorites.productId],
		references: [products.id]
	}),
}));

export const addressesRelations = relations(addresses, ({one, many}) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
	orders_billingAddressId: many(orders, {
		relationName: "orders_billingAddressId_addresses_id"
	}),
	orders_shippingAddressId: many(orders, {
		relationName: "orders_shippingAddressId_addresses_id"
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	address_billingAddressId: one(addresses, {
		fields: [orders.billingAddressId],
		references: [addresses.id],
		relationName: "orders_billingAddressId_addresses_id"
	}),
	address_shippingAddressId: one(addresses, {
		fields: [orders.shippingAddressId],
		references: [addresses.id],
		relationName: "orders_shippingAddressId_addresses_id"
	}),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	trackingEvents: many(trackingEvents),
	orderItems: many(orderItems),
}));

export const phoneChangeRequestsRelations = relations(phoneChangeRequests, ({one}) => ({
	user: one(users, {
		fields: [phoneChangeRequests.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const productTranslationsRelations = relations(productTranslations, ({one}) => ({
	product: one(products, {
		fields: [productTranslations.productId],
		references: [products.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
	categoryTranslations: many(categoryTranslations),
}));

export const userPaymentTermsRelations = relations(userPaymentTerms, ({one}) => ({
	user: one(users, {
		fields: [userPaymentTerms.userId],
		references: [users.id]
	}),
}));

export const trackingEventsRelations = relations(trackingEvents, ({one}) => ({
	order: one(orders, {
		fields: [trackingEvents.orderId],
		references: [orders.id]
	}),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	users: many(users),
}));

export const categoryTranslationsRelations = relations(categoryTranslations, ({one}) => ({
	category: one(categories, {
		fields: [categoryTranslations.categoryId],
		references: [categories.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	product: one(products, {
		fields: [favorites.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
}));