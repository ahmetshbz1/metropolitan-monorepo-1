-- Migration: Refactor Tax System
-- Date: 2025-10-12
-- Description:
--   - Convert tax field from decimal to integer
--   - Remove fakturowniaTax field (redundant)
--   - Add lastSyncedAt and syncStatus fields for Fakturownia sync tracking
--   - Add unique constraint to fakturowniaProductId

-- Step 1: Backup current tax values to temporary column
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_backup numeric(5,2);
UPDATE products SET tax_backup = tax;

-- Step 2: Add new columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_synced_at timestamp;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'pending';

-- Step 3: Drop old tax column and recreate as integer
ALTER TABLE products DROP COLUMN IF EXISTS tax;
ALTER TABLE products ADD COLUMN tax integer NOT NULL DEFAULT 23;

-- Step 4: Migrate tax values from backup (convert decimal to integer)
UPDATE products SET tax = ROUND(COALESCE(tax_backup, 23))::integer;

-- Step 5: Drop fakturowniaTax column (no longer needed)
ALTER TABLE products DROP COLUMN IF EXISTS fakturownia_tax;

-- Step 6: Drop backup column
ALTER TABLE products DROP COLUMN tax_backup;

-- Step 7: Add unique constraint to fakturowniaProductId
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_fakturownia_product_id_unique;
ALTER TABLE products ADD CONSTRAINT products_fakturownia_product_id_unique UNIQUE (fakturownia_product_id);

-- Step 8: Update sync status for products with fakturowniaProductId
UPDATE products
SET sync_status = 'synced', last_synced_at = updated_at
WHERE fakturownia_product_id IS NOT NULL;
