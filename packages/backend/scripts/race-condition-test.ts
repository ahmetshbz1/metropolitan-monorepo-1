//  "race-condition-test.ts"
//  Stock race condition test helper
//  Run: bun run scripts/race-condition-test.ts

import { eq } from "drizzle-orm";
import { db } from "../src/shared/infrastructure/database/connection";
import { products, orders, orderItems } from "../src/shared/infrastructure/database/schema";

async function setupTestProducts() {
  console.log("🔧 Setting up test products for race condition test...");
  
  // Set specific products to low stock for testing
  const testProducts = [
    { id: "test-product-1", name: "Race Test Product 1", stock: 1 },
    { id: "test-product-2", name: "Race Test Product 2", stock: 2 },
    { id: "test-product-3", name: "Race Test Product 3", stock: 3 },
  ];

  for (const product of testProducts) {
    try {
      await db
        .update(products)
        .set({ 
          stock: product.stock,
          updatedAt: new Date()
        })
        .where(eq(products.id, product.id));
      
      console.log(`✅ ${product.name}: Stock set to ${product.stock}`);
    } catch (_error) {
      console.log(`ℹ️  Product ${product.id} not found, skipping...`);
    }
  }
}

async function monitorStock() {
  console.log("📊 Current stock levels:");
  
  const stockLevels = await db
    .select({
      id: products.id,
      name: products.name,
      stock: products.stock,
      updatedAt: products.updatedAt
    })
    .from(products)
    .where(eq(products.stock, 5)); // Show products with stock <= 5

  stockLevels.forEach(product => {
    const stockEmoji = product.stock === 0 ? "🔴" : product.stock <= 2 ? "🟡" : "🟢";
    console.log(`${stockEmoji} ${product.name}: ${product.stock} units`);
  });
}

async function showRecentOrders() {
  console.log("\n📋 Recent orders (last 10):");
  
  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt
    })
    .from(orders)
    .orderBy(orders.createdAt)
    .limit(10);

  recentOrders.forEach(order => {
    const statusEmoji = order.status === "pending" ? "⏳" : 
                       order.status === "confirmed" ? "✅" : 
                       order.status === "cancelled" ? "❌" : "🔄";
    
    console.log(`${statusEmoji} ${order.orderNumber} - ${order.status}/${order.paymentStatus} - ${order.totalAmount} PLN`);
  });
}

async function showOrderItems(orderId?: string) {
  if (!orderId) {
    console.log("ℹ️  Provide order ID to see items: bun run scripts/race-condition-test.ts <order-id>");
    return;
  }

  console.log(`\n📦 Order items for ${orderId}:`);
  
  const items = await db
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  items.forEach(item => {
    console.log(`  - Product ${item.productId}: ${item.quantity} x ${item.unitPrice} = ${item.totalPrice} PLN`);
  });
}

// Main execution
async function main() {
  const command = process.argv[2];
  const orderId = process.argv[3];

  try {
    switch (command) {
      case "setup":
        await setupTestProducts();
        break;
      case "monitor":
        await monitorStock();
        break;
      case "orders":
        await showRecentOrders();
        break;
      case "items":
        await showOrderItems(orderId);
        break;
      case "full":
        await setupTestProducts();
        await monitorStock();
        await showRecentOrders();
        break;
      default:
        console.log(`
🧪 Race Condition Test Helper

Commands:
  setup   - Set test products to low stock
  monitor - Show current stock levels  
  orders  - Show recent orders
  items   - Show order items (requires order ID)
  full    - Run setup + monitor + orders

Usage:
  bun run scripts/race-condition-test.ts setup
  bun run scripts/race-condition-test.ts monitor
  bun run scripts/race-condition-test.ts orders
  bun run scripts/race-condition-test.ts items <order-id>
  bun run scripts/race-condition-test.ts full
        `);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

main();