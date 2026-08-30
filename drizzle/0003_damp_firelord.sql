CREATE TABLE "day_overrides" (
	"user_id" uuid NOT NULL,
	"day_key" text NOT NULL,
	"mode" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_overrides_pk" PRIMARY KEY("user_id","day_key")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "target_kcal" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "target_kcal" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activity" text DEFAULT 'sedentary' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "goal" text DEFAULT 'maintain' NOT NULL;--> statement-breakpoint
ALTER TABLE "day_overrides" ADD CONSTRAINT "day_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;