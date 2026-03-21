ALTER TABLE "check_ins"
ALTER COLUMN "date" TYPE date USING "date"::date;--> statement-breakpoint
ALTER TABLE "habits"
ALTER COLUMN "reminder_time"
TYPE time USING "reminder_time"::time;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "current_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "longest_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "last_completed_at" date;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;