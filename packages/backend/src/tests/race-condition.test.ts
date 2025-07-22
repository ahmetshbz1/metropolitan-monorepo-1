//  "race-condition.test.ts"
//  Automated race condition test
//  Run: bun test src/tests/race-condition.test.ts

import { beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../shared/infrastructure/database/connection";
import { 
  products, 
  users, 
  cartItems,
  orders,
  orderItems 
} from "../shared/infrastructure/database/schema";
import { OrderCreationService } from "../domains/order/application/use-cases/order-creation.service";

// Test data
const TEST_USERS = [
  { id: "test-user-1", email: "user1@test.com", phone: "+48123456789" },
  { id: "test-user-2", email: "user2@test.com", phone: "+48987654321" }
];

const TEST_PRODUCT = {
  id: "test-race-product",
  name: "Race Test Product",
  initialStock: 1,
  price: 99.99
};

const TEST_ORDER_REQUEST = {
  shippingAddressId: "test-address-1",
  paymentMethodId: "card",
  notes: "Race condition test order"
};

describe("🏁 Stock Race Condition Tests", () => {
  
  beforeAll(async () => {
    console.log("🔧 Setting up race condition test...");
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test users
    await setupTestUsers();
    
    // Create test product with stock = 1
    await setupTestProduct();
    
    console.log("✅ Test setup complete!");
  });

  test("🚨 Two users ordering same product simultaneously - Should prevent over-selling", async () => {
    console.log("\n🎯 Starting race condition test...");
    
    // Add product to both users' carts
    await addToCart(TEST_USERS[0].id, TEST_PRODUCT.id, 1);
    await addToCart(TEST_USERS[1].id, TEST_PRODUCT.id, 1);
    
    console.log("🛒 Both users have product in cart");
    
    // Prepare order data for both users
    const cartItems1 = await getCartItems(TEST_USERS[0].id);
    const cartItems2 = await getCartItems(TEST_USERS[1].id);
    
    const orderItems1 = cartItems1.map(item => ({
      product: { id: item.productId, name: TEST_PRODUCT.name, price: TEST_PRODUCT.price },
      quantity: item.quantity,
      unitPrice: TEST_PRODUCT.price.toString(),
      totalPrice: (TEST_PRODUCT.price * item.quantity).toString()
    }));
    
    const orderItems2 = cartItems2.map(item => ({
      product: { id: item.productId, name: TEST_PRODUCT.name, price: TEST_PRODUCT.price },
      quantity: item.quantity,
      unitPrice: TEST_PRODUCT.price.toString(),
      totalPrice: (TEST_PRODUCT.price * item.quantity).toString()
    }));

    console.log("⏰ Simulating concurrent order creation...");
    
    // 🚀 THE CRITICAL TEST: Simultaneous order creation
    const [result1, result2] = await Promise.allSettled([
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[0].id,
        TEST_ORDER_REQUEST,
        orderItems1,
        cartItems1,
        TEST_PRODUCT.price
      ),
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[1].id,
        TEST_ORDER_REQUEST,
        orderItems2,
        cartItems2,
        TEST_PRODUCT.price
      )
    ]);

    console.log("📊 Race condition test results:");
    
    // Analyze results
    const successCount = [result1, result2].filter(r => r.status === 'fulfilled').length;
    const failureCount = [result1, result2].filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Successful orders: ${successCount}`);
    console.log(`❌ Failed orders: ${failureCount}`);
    
    if (result1.status === 'fulfilled') {
      console.log(`🏆 User 1 order successful: ${result1.value.order.orderNumber}`);
    } else {
      console.log(`💥 User 1 order failed: ${result1.reason.message}`);
    }
    
    if (result2.status === 'fulfilled') {
      console.log(`🏆 User 2 order successful: ${result2.value.order.orderNumber}`);
    } else {
      console.log(`💥 User 2 order failed: ${result2.reason.message}`);
    }

    // Verify stock after race condition
    const finalStock = await getCurrentStock(TEST_PRODUCT.id);
    console.log(`📦 Final stock: ${finalStock}`);
    
    // 🧪 ASSERTIONS
    expect(successCount).toBe(1); // Only one order should succeed
    expect(failureCount).toBe(1); // One order should fail
    expect(finalStock).toBe(0); // Stock should be 0 (1 - 1 = 0)
    
    // Verify error message contains "Insufficient stock"
    const failedResult = [result1, result2].find(r => r.status === 'rejected');
    expect(failedResult?.status).toBe('rejected');
    if (failedResult?.status === 'rejected') {
      expect(failedResult.reason.message).toContain('Insufficient stock');
    }
    
    console.log("🎉 Race condition test PASSED! No over-selling occurred!");
  });

  test("🔄 Payment failure stock rollback test", async () => {
    console.log("\n🎯 Testing payment failure stock rollback...");
    
    // Reset product stock to 1
    await resetProductStock(TEST_PRODUCT.id, 1);
    
    // Add product to cart
    await addToCart(TEST_USERS[0].id, TEST_PRODUCT.id, 1);
    const cartItems = await getCartItems(TEST_USERS[0].id);
    
    const orderItems = cartItems.map(item => ({
      product: { id: item.productId, name: TEST_PRODUCT.name, price: TEST_PRODUCT.price },
      quantity: item.quantity,
      unitPrice: TEST_PRODUCT.price.toString(),
      totalPrice: (TEST_PRODUCT.price * item.quantity).toString()
    }));

    // Create order (this will reserve stock)
    const orderResult = await OrderCreationService.createOrderWithStripe(
      TEST_USERS[0].id,
      TEST_ORDER_REQUEST,
      orderItems,
      cartItems,
      TEST_PRODUCT.price
    );
    
    console.log(`📦 Order created: ${orderResult.order.orderNumber}`);
    
    // Verify stock is reserved (should be 0)
    const stockAfterOrder = await getCurrentStock(TEST_PRODUCT.id);
    expect(stockAfterOrder).toBe(0);
    console.log(`📉 Stock after order: ${stockAfterOrder}`);
    
    // Simulate payment failure by calling rollback
    await OrderCreationService.rollbackStock(orderResult.order.id);
    console.log(`🔄 Payment failed - stock rollback executed`);
    
    // Verify stock is restored
    const stockAfterRollback = await getCurrentStock(TEST_PRODUCT.id);
    expect(stockAfterRollback).toBe(1);
    console.log(`📈 Stock after rollback: ${stockAfterRollback}`);
    
    // Verify order is cancelled
    const orderStatus = await getOrderStatus(orderResult.order.id);
    expect(orderStatus?.status).toBe('cancelled');
    expect(orderStatus?.paymentStatus).toBe('failed');
    
    console.log("🎉 Payment failure rollback test PASSED!");
  });

  test("🎪 Multiple products race condition test", async () => {
    console.log("\n🎯 Testing multiple products race condition...");
    
    const MULTI_PRODUCTS = [
      { id: "multi-test-1", name: "Multi Test 1", stock: 2, price: 50.0 },
      { id: "multi-test-2", name: "Multi Test 2", stock: 1, price: 75.0 }
    ];
    
    // Setup multiple test products
    for (const product of MULTI_PRODUCTS) {
      await setupTestProduct(product);
    }
    
    // User 1: 2x Product 1, 1x Product 2
    await addToCart(TEST_USERS[0].id, MULTI_PRODUCTS[0].id, 2);
    await addToCart(TEST_USERS[0].id, MULTI_PRODUCTS[1].id, 1);
    
    // User 2: 1x Product 1, 1x Product 2  
    await addToCart(TEST_USERS[1].id, MULTI_PRODUCTS[0].id, 1);
    await addToCart(TEST_USERS[1].id, MULTI_PRODUCTS[1].id, 1);
    
    const cartItems1 = await getCartItems(TEST_USERS[0].id);
    const cartItems2 = await getCartItems(TEST_USERS[1].id);
    
    // Create order items
    const orderItems1 = cartItems1.map(item => {
      const product = MULTI_PRODUCTS.find(p => p.id === item.productId)!;
      return {
        product: { id: item.productId, name: product.name, price: product.price },
        quantity: item.quantity,
        unitPrice: product.price.toString(),
        totalPrice: (product.price * item.quantity).toString()
      };
    });
    
    const orderItems2 = cartItems2.map(item => {
      const product = MULTI_PRODUCTS.find(p => p.id === item.productId)!;
      return {
        product: { id: item.productId, name: product.name, price: product.price },
        quantity: item.quantity,
        unitPrice: product.price.toString(),
        totalPrice: (product.price * item.quantity).toString()
      };
    });

    // Concurrent orders
    const [result1, result2] = await Promise.allSettled([
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[0].id,
        TEST_ORDER_REQUEST,
        orderItems1,
        cartItems1,
        125.0 // 2*50 + 1*75
      ),
      OrderCreationService.createOrderWithStripe(
        TEST_USERS[1].id,
        TEST_ORDER_REQUEST,
        orderItems2,
        cartItems2,
        125.0 // 1*50 + 1*75
      )
    ]);

    console.log("📊 Multiple products race test results:");
    
    // One should succeed (user 1 gets everything)
    // One should fail (user 2 can't get Product 2 because user 1 took it)
    expect([result1, result2].filter(r => r.status === 'fulfilled').length).toBe(1);
    expect([result1, result2].filter(r => r.status === 'rejected').length).toBe(1);
    
    console.log("🎉 Multiple products race condition test PASSED!");
  });
});

// Helper functions
async function cleanupTestData() {
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

async function setupTestUsers() {
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

async function setupTestProduct(product = TEST_PRODUCT) {
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

async function addToCart(userId: string, productId: string, quantity: number) {
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

async function getCartItems(userId: string) {
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

async function getCurrentStock(productId: string): Promise<number> {
  const [product] = await db
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  return product?.stock || 0;
}

async function resetProductStock(productId: string, stock: number) {
  await db
    .update(products)
    .set({ stock, updatedAt: new Date() })
    .where(eq(products.id, productId));
}

async function getOrderStatus(orderId: string) {
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