CREATE TYPE "public"."subscription_status" AS ENUM('none', 'active', 'expired', 'past_due', 'trialing');--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"adapty_profile_id" text,
	"event_type" text NOT NULL,
	"payload" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" "subscription_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "premium_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "adapty_id" text;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;