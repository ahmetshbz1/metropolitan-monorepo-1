-- Migration: Add Performance Indexes
-- Date: 2025-10-14
-- Purpose: Optimize query performance for orders, products, and order_items

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_status
  ON orders(user_id, status);

-- OrderItems table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_product
  ON order_items(order_id, product_id);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_stock
  ON products(stock)
  WHERE stock > 0;

CREATE INDEX IF NOT EXISTS idx_products_category_stock
  ON products(category_id, stock);

-- Analyze tables for better query planning
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
