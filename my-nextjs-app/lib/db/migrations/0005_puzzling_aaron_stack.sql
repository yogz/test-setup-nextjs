CREATE TABLE "blocked_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"default_room_id" text,
	"default_duration" integer DEFAULT 60 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"is_individual" boolean DEFAULT true NOT NULL,
	"is_group" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "level" varchar(50);--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "min_participants" integer;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "visibility" varchar(20) DEFAULT 'PUBLIC';--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "material" text;--> statement-breakpoint
ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_settings" ADD CONSTRAINT "coach_settings_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_settings" ADD CONSTRAINT "coach_settings_default_room_id_rooms_id_fk" FOREIGN KEY ("default_room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_availability" ADD CONSTRAINT "weekly_availability_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;