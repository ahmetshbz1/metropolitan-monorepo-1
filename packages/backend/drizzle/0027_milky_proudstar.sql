-- Add fakturownia_invoice_id to orders table for persistent invoice ID caching
ALTER TABLE "orders" ADD COLUMN "fakturownia_invoice_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_fakturownia_invoice_id" ON "orders"("fakturownia_invoice_id");