ALTER TABLE "availability_additions" ADD COLUMN "is_individual" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "availability_additions" ADD COLUMN "is_group" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_bookings" ADD COLUMN "frequency" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "frequency" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "weekly_availability" ADD COLUMN "duration" integer;