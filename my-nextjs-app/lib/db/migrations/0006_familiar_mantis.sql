CREATE TYPE "public"."recurring_booking_status" AS ENUM('ACTIVE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "availability_additions" (
	"id" text PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"room_id" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"coach_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "recurring_booking_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "status" SET DEFAULT 'scheduled'::text;--> statement-breakpoint
DROP TYPE "public"."session_status";--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"public"."session_status";--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "status" SET DATA TYPE "public"."session_status" USING "status"::"public"."session_status";--> statement-breakpoint
ALTER TABLE "weekly_availability" ALTER COLUMN "is_individual" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "weekly_availability" ALTER COLUMN "is_group" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "recurring_booking_id" text;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "one_time_booking_id" text;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "member_id" text;--> statement-breakpoint
ALTER TABLE "weekly_availability" ADD COLUMN "room_id" text;--> statement-breakpoint
ALTER TABLE "availability_additions" ADD CONSTRAINT "availability_additions_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_additions" ADD CONSTRAINT "availability_additions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_bookings" ADD CONSTRAINT "recurring_bookings_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_bookings" ADD CONSTRAINT "recurring_bookings_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_recurring_booking_id_recurring_bookings_id_fk" FOREIGN KEY ("recurring_booking_id") REFERENCES "public"."recurring_bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_one_time_booking_id_bookings_id_fk" FOREIGN KEY ("one_time_booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_availability" ADD CONSTRAINT "weekly_availability_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;