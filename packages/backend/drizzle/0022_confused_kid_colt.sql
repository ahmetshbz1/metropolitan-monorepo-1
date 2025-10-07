CREATE TABLE "ai_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'gemini' NOT NULL,
	"api_key" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
