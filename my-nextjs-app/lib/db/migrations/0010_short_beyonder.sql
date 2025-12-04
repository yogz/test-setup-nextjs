ALTER TABLE "coach_availabilities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "coach_availabilities" CASCADE;--> statement-breakpoint
ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_member_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_member_idx" ON "bookings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "sessions_coach_start_idx" ON "training_sessions" USING btree ("coach_id","start_time");--> statement-breakpoint
CREATE INDEX "sessions_member_idx" ON "training_sessions" USING btree ("member_id");--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "one_time_booking_id";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_session_member_unique" UNIQUE("session_id","member_id");--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "sessions_recurring_starttime_unique" UNIQUE("recurring_booking_id","start_time");