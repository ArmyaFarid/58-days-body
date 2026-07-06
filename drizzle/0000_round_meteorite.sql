CREATE TABLE "habit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"creatine" boolean DEFAULT false NOT NULL,
	"kcal3000" boolean DEFAULT false NOT NULL,
	"protein140" boolean DEFAULT false NOT NULL,
	"sleep_before_23" boolean DEFAULT false NOT NULL,
	CONSTRAINT "habit_logs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"shoulders" real,
	"chest" real,
	"arm" real,
	"waist" real,
	"thigh" real,
	CONSTRAINT "measurements_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"pose" text NOT NULL,
	"blob_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "set_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"exercise_key" text NOT NULL,
	"set_index" integer NOT NULL,
	"reps" integer,
	"band" text,
	"variant" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"weight_kg" real NOT NULL,
	CONSTRAINT "weight_logs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"day_type" text NOT NULL,
	"phase" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "workout_sessions_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;