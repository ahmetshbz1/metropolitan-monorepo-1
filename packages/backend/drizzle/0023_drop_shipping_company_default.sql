ALTER TABLE "orders"
ALTER COLUMN "shipping_company" DROP DEFAULT;

UPDATE "orders"
SET "shipping_company" = NULL
WHERE TRIM(LOWER("shipping_company")) = 'dhl express';
