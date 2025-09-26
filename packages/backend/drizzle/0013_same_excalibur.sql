ALTER TABLE "users" ADD COLUMN "share_data_with_partners" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "analytics_data" boolean DEFAULT false NOT NULL;