ALTER TABLE "device_tokens" ADD COLUMN "language" text DEFAULT 'tr' NOT NULL;--> statement-breakpoint
ALTER TABLE "guest_device_tokens" ADD COLUMN "language" text DEFAULT 'tr' NOT NULL;