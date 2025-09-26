ALTER TABLE "users" ADD COLUMN "apple_user_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_apple_user_id_unique" UNIQUE("apple_user_id");