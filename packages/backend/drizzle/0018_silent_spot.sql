CREATE TABLE "guest_device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" text NOT NULL,
	"token" text NOT NULL,
	"platform" text NOT NULL,
	"device_name" text,
	"device_id" text,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"is_valid" text DEFAULT 'true' NOT NULL,
	"failure_count" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "guest_device_tokens_guest_token_unique" ON "guest_device_tokens" USING btree ("guest_id","token");