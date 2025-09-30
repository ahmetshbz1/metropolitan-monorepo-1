-- Migration: Clean up price fields
-- Date: 2025-09-30
-- Purpose: Remove redundant "price" column and ensure data integrity

-- Step 1: Copy price to individual_price where null
UPDATE products
SET individual_price = COALESCE(individual_price, price)
WHERE individual_price IS NULL AND price IS NOT NULL;

-- Step 2: Ensure corporate_price is set (85% of individual price where null)
UPDATE products
SET corporate_price = COALESCE(
    corporate_price,
    ROUND(CAST(individual_price * 0.85 AS numeric), 2)
)
WHERE corporate_price IS NULL AND individual_price IS NOT NULL;

-- Step 3: Set default min quantities where null
UPDATE products
SET min_quantity_individual = COALESCE(min_quantity_individual, 1);

UPDATE products
SET min_quantity_corporate = COALESCE(min_quantity_corporate, 6);

-- Step 4: Set quantity_per_box to match min_quantity_corporate where null
UPDATE products
SET quantity_per_box = COALESCE(quantity_per_box, min_quantity_corporate);

-- Step 5: Create a backup table before dropping price column (optional)
-- CREATE TABLE products_price_backup AS
-- SELECT id, price FROM products;

-- Step 6: Drop the redundant price column
-- WARNING: This is irreversible! Make sure all systems are updated first
-- ALTER TABLE products DROP COLUMN price;

-- Verification query:
SELECT
    COUNT(*) as total_products,
    COUNT(individual_price) as with_individual_price,
    COUNT(corporate_price) as with_corporate_price,
    COUNT(price) as with_old_price,
    COUNT(CASE WHEN individual_price IS NULL THEN 1 END) as missing_individual,
    COUNT(CASE WHEN corporate_price IS NULL THEN 1 END) as missing_corporate
FROM products;