ALTER TABLE "products" ADD COLUMN "individual_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "corporate_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_quantity_individual" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_quantity_corporate" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quantity_per_box" integer;