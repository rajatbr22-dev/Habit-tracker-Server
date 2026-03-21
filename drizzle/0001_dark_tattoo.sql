CREATE TYPE "public"."category" AS ENUM('health', 'productivity', 'fitness', 'mindfulness', 'financial', 'social', 'other');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('daily', 'weekly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."habit_status" AS ENUM('active', 'archived', 'deleted');--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "frequency" SET DATA TYPE "public"."frequency" USING "frequency"::"public"."frequency";--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."habit_status";--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "status" SET DATA TYPE "public"."habit_status" USING "status"::"public"."habit_status";