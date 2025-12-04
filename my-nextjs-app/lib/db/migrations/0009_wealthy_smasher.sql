ALTER TABLE "coach_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "coach_members" CASCADE;--> statement-breakpoint
ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_one_time_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_coach_id" text;--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "weekdays";--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "recurrence_end_date";--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "level";--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "min_participants";--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "frequency";--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "visibility";--> statement-breakpoint
ALTER TABLE "training_sessions" DROP COLUMN "material";