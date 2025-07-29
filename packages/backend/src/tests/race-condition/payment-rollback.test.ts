// "payment-rollback.test.ts"
// Payment failure and stock rollback tests

import { beforeAll, describe, expect, test } from "bun:test";
import { OrderCreationService } from "../../domains/order/application/use-cases/order-creation.service";
import {
  TEST_USERS,
  TEST_PRODUCT,
  TEST_ORDER_REQUEST,
  cleanupTestData,
  setupTestUsers,
  setupTestProduct,
  addToCart,
  getCartItems,
  getCurrentStock,
  resetProductStock,
  getOrderStatus
} from './test-helpers';

describe("🔄 Payment Rollback Tests", () => {
  
  beforeAll(async () => {
    console.log("🔧 Setting up payment rollback test...");
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test users
    await setupTestUsers();
    
    // Create test product
    await setupTestProduct();
    
    console.log("✅ Test setup complete!");
  });

  test("Payment failure stock rollback test", async () => {
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

  test("Multiple rollback scenario", async () => {
    console.log("\n🎯 Testing multiple rollback scenario...");
    
    // Reset product stock to 5
    await resetProductStock(TEST_PRODUCT.id, 5);
    
    // Create 3 orders
    const orderPromises = [];
    for (let i = 0; i < 3; i++) {
      await addToCart(TEST_USERS[0].id, TEST_PRODUCT.id, 1);
      const cartItems = await getCartItems(TEST_USERS[0].id);
      
      const orderItems = cartItems.map(item => ({
        product: { id: item.productId, name: TEST_PRODUCT.name, price: TEST_PRODUCT.price },
        quantity: item.quantity,
        unitPrice: TEST_PRODUCT.price.toString(),
        totalPrice: (TEST_PRODUCT.price * item.quantity).toString()
      }));
      
      orderPromises.push(
        OrderCreationService.createOrderWithStripe(
          TEST_USERS[0].id,
          TEST_ORDER_REQUEST,
          orderItems,
          cartItems,
          TEST_PRODUCT.price
        )
      );
    }
    
    const orders = await Promise.all(orderPromises);
    console.log(`📦 Created ${orders.length} orders`);
    
    // Stock should be reduced by 3
    const stockAfterOrders = await getCurrentStock(TEST_PRODUCT.id);
    expect(stockAfterOrders).toBe(2); // 5 - 3 = 2
    
    // Rollback first two orders
    await OrderCreationService.rollbackStock(orders[0].order.id);
    await OrderCreationService.rollbackStock(orders[1].order.id);
    
    // Stock should be restored by 2
    const finalStock = await getCurrentStock(TEST_PRODUCT.id);
    expect(finalStock).toBe(4); // 2 + 2 = 4
    
    console.log("🎉 Multiple rollback scenario test PASSED!");
  });
});