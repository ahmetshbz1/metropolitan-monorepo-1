CREATE TABLE "storage_condition_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condition_key" text NOT NULL,
	"language_code" text NOT NULL,
	"translation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
