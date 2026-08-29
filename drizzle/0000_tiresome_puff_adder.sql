CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"participant_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_data" text DEFAULT '' NOT NULL,
	"kcal" double precision DEFAULT 0 NOT NULL,
	"protein_g" double precision DEFAULT 0 NOT NULL,
	"fat_g" double precision DEFAULT 0 NOT NULL,
	"carbs_g" double precision DEFAULT 0 NOT NULL,
	"sugar_g" double precision DEFAULT 0 NOT NULL,
	"sodium_mg" double precision DEFAULT 0 NOT NULL,
	"meal_name" text DEFAULT '' NOT NULL,
	"portion" text DEFAULT '' NOT NULL,
	"confidence" text DEFAULT 'low' NOT NULL,
	"source" text DEFAULT 'ai' NOT NULL,
	"suggestion" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"goals" text DEFAULT '' NOT NULL,
	"diet" text DEFAULT '' NOT NULL,
	"target_kcal" integer DEFAULT 2000 NOT NULL,
	"target_protein_g" integer DEFAULT 50 NOT NULL,
	"target_fat_g" integer DEFAULT 70 NOT NULL,
	"target_carbs_g" integer DEFAULT 250 NOT NULL,
	"target_sugar_g" integer DEFAULT 25 NOT NULL,
	"target_sodium_mg" integer DEFAULT 2300 NOT NULL,
	"gemini_api_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;