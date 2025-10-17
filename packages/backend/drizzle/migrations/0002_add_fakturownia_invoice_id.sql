-- Migration: Add fakturownia_invoice_id to orders table
-- Date: 2025-10-17
-- Description: Store Fakturownia invoice ID in database for persistent caching

ALTER TABLE orders
ADD COLUMN fakturownia_invoice_id INTEGER;

-- Add index for faster lookups
CREATE INDEX idx_orders_fakturownia_invoice_id ON orders(fakturownia_invoice_id);

-- Add comment
COMMENT ON COLUMN orders.fakturownia_invoice_id IS 'Fakturownia API invoice ID for persistent caching';
