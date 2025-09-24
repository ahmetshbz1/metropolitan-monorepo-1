CREATE TABLE "phone_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_phone" text NOT NULL,
	"new_phone" text,
	"session_id" text NOT NULL,
	"new_session_id" text,
	"step" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "previous_phone_number" text;--> statement-breakpoint
ALTER TABLE "phone_change_requests" ADD CONSTRAINT "phone_change_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;