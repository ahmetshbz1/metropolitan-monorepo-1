-- Migration: Performance Critical Indexes
-- Created: 2025-01-17
-- Description: Add critical indexes for performance optimization

-- Products table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Orders table indexes (critical for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);

-- Order items indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Cart items indexes (high frequency access)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- Favorites indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Tracking events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_order_id ON tracking_events(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_status ON tracking_events(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);

-- Product translations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_language ON product_translations(language_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_product_lang ON product_translations(product_id, language_code);

-- Category translations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_translations_language ON category_translations(language_code);

-- Users table indexes (if not already present)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Addresses indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_stock ON products(category_id, stock) WHERE stock > 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Performance boost comments
COMMENT ON INDEX idx_products_category_id IS 'Optimize product filtering by category';
COMMENT ON INDEX idx_orders_user_status IS 'Optimize user order queries with status filtering';
COMMENT ON INDEX idx_cart_items_user_id IS 'Optimize cart loading for users';
COMMENT ON INDEX idx_products_category_stock IS 'Optimize category product listing with stock filtering';
COMMENT ON INDEX idx_orders_user_created IS 'Optimize user order history with date sorting';