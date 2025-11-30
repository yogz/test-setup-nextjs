ALTER TABLE "coach_availabilities" DROP CONSTRAINT "coach_availabilities_room_id_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "coach_availabilities" ALTER COLUMN "start_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "coach_availabilities" ALTER COLUMN "end_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "coach_availabilities" ADD COLUMN "day_of_week" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "coach_availabilities" ADD COLUMN "is_recurring" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "weekdays" jsonb;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "is_recurring" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "recurrence_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "coach_availabilities" DROP COLUMN "room_id";