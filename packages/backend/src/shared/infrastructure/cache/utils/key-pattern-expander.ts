//  "key-pattern-expander.ts"
//  metropolitan backend
//  Expands cache key patterns to actual keys

import { sql, desc } from "drizzle-orm";

import { db } from "../../database/connection";
import { users, products, orderItems } from "../../database/schema";

export async function expandKeyPattern(pattern: string): Promise<string[]> {
  // Handle specific patterns
  if (pattern.includes("{userId}")) {
    return expandUserPattern(pattern);
  }
  
  if (pattern.includes("{productId}")) {
    return expandProductPattern(pattern);
  }
  
  // Return pattern as-is if no expansion needed
  return [pattern];
}

async function expandUserPattern(pattern: string): Promise<string[]> {
  // Get active user IDs from database
  const activeUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.is_active} = true`)
    .limit(100); // Limit for performance
  
  return activeUsers.map(user => pattern.replace("{userId}", user.id));
}

async function expandProductPattern(pattern: string): Promise<string[]> {
  // Get popular product IDs
  const popularProducts = await db
    .select({ id: products.id })
    .from(products)
    .leftJoin(orderItems, sql`${orderItems.product_id} = ${products.id}`)
    .groupBy(products.id)
    .orderBy(desc(sql`COUNT(${orderItems.id})`))
    .limit(50); // Top 50 products
  
  return popularProducts.map(product => pattern.replace("{productId}", product.id));
}