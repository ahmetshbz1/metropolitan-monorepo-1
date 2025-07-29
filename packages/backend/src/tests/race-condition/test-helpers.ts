// "test-helpers.ts"
// Shared test helpers for race condition tests

import { eq } from "drizzle-orm";
import { db } from "../../shared/infrastructure/database/connection";
import { 
  products, 
  users, 
  cartItems,
  orders,
  orderItems 
} from "../../shared/infrastructure/database/schema";

// Test data constants
export const TEST_USERS = [
  { id: "test-user-1", email: "user1@test.com", phone: "+48123456789" },
  { id: "test-user-2", email: "user2@test.com", phone: "+48987654321" }
];

export const TEST_PRODUCT = {
  id: "test-race-product",
  name: "Race Test Product",
  initialStock: 1,
  price: 99.99
};

export const TEST_ORDER_REQUEST = {
  shippingAddressId: "test-address-1",
  paymentMethodId: "card",
  notes: "Race condition test order"
};

// Helper functions
export async function cleanupTestData() {
  // Clean up in correct order (foreign key constraints)
  await db.delete(orderItems).where(eq(orderItems.orderId, 'test-order'));
  await db.delete(orders).where(eq(orders.userId, TEST_USERS[0].id));
  await db.delete(orders).where(eq(orders.userId, TEST_USERS[1].id));
  await db.delete(cartItems).where(eq(cartItems.userId, TEST_USERS[0].id));
  await db.delete(cartItems).where(eq(cartItems.userId, TEST_USERS[1].id));
  await db.delete(products).where(eq(products.id, TEST_PRODUCT.id));
  await db.delete(products).where(eq(products.id, 'multi-test-1'));
  await db.delete(products).where(eq(products.id, 'multi-test-2'));
  await db.delete(users).where(eq(users.id, TEST_USERS[0].id));
  await db.delete(users).where(eq(users.id, TEST_USERS[1].id));
}

export async function setupTestUsers() {
  for (const user of TEST_USERS) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
      phone: user.phone,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
  }
}

export async function setupTestProduct(product = TEST_PRODUCT) {
  await db.insert(products).values({
    id: product.id,
    name: product.name,
    stock: product.initialStock || product.stock,
    price: product.price.toString(),
    currency: 'PLN',
    createdAt: new Date(),
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: products.id,
    set: {
      stock: product.initialStock || product.stock,
      updatedAt: new Date()
    }
  });
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  await db.insert(cartItems).values({
    id: `cart-${userId}-${productId}`,
    userId,
    productId,
    quantity,
    createdAt: new Date(),
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: [cartItems.userId, cartItems.productId],
    set: { quantity, updatedAt: new Date() }
  });
}

export async function getCartItems(userId: string) {
  return await db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      product: {
        id: products.id,
        name: products.name,
        price: products.price
      }
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
}

export async function getCurrentStock(productId: string): Promise<number> {
  const [product] = await db
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  return product?.stock || 0;
}

export async function resetProductStock(productId: string, stock: number) {
  await db
    .update(products)
    .set({ stock, updatedAt: new Date() })
    .where(eq(products.id, productId));
}

export async function getOrderStatus(orderId: string) {
  const [order] = await db
    .select({
      status: orders.status,
      paymentStatus: orders.paymentStatus
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  
  return order;
}