CREATE TYPE "public"."type" AS ENUM('SELECT', 'ASSIST', 'CODE', 'VIDEO', 'TEXT', 'IMAGE', 'PDF', 'COMPLETE', 'WRITE', 'PROJECT', 'AUDIO');--> statement-breakpoint
CREATE TYPE "public"."course_category" AS ENUM('programming', 'design', 'data');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('GLOBAL', 'CUSTOMIZE');--> statement-breakpoint
CREATE TYPE "public"."reward_source" AS ENUM('LESSON_COMPLETE', 'CHALLENGE_SUCCESS', 'CHALLENGE_FAIL', 'PRACTICE', 'SHOP_PURCHASE', 'SYSTEM_ADJUST', 'MIGRATION');--> statement-breakpoint
CREATE TABLE "challenge_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"type" "type" NOT NULL,
	"label" text NOT NULL,
	"order" integer NOT NULL,
	"explanation" text,
	"text_content" text,
	"image_content" text,
	"video_url" text,
	"pdf_url" text,
	"audio_url" text,
	"initial_code" text,
	"language" text,
	"instructions" text,
	"test_cases" text,
	"time_limit" integer,
	"memory_limit" integer,
	"complete_question" text,
	"project_structure" text,
	"project_files" text,
	"project_test_cases" text,
	"test_setup" text,
	"test_teardown" text,
	"web_view_content" text
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_src" text DEFAULT '' NOT NULL,
	"type" "course_type" DEFAULT 'GLOBAL' NOT NULL,
	"category" "course_category" DEFAULT 'programming' NOT NULL,
	"demo" text,
	"maker_id" varchar,
	"assigned_to" text[],
	"price" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"unit_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"text" text NOT NULL,
	"correct" boolean NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"image_src" text,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE "reward_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source" "reward_source" NOT NULL,
	"delta_hearts" integer DEFAULT 0 NOT NULL,
	"delta_xp" integer DEFAULT 0 NOT NULL,
	"delta_coins" integer DEFAULT 0 NOT NULL,
	"before_hearts" integer,
	"after_hearts" integer,
	"before_xp" integer,
	"after_xp" integer,
	"before_coins" integer,
	"after_coins" integer,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"course_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_name" text DEFAULT 'User' NOT NULL,
	"user_image_src" text DEFAULT '/mascot.svg' NOT NULL,
	"active_course_id" integer,
	"hearts" integer DEFAULT 5 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"word" text NOT NULL,
	"order" integer NOT NULL,
	"correct" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_challenges" ADD CONSTRAINT "lesson_challenges_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_challenges" ADD CONSTRAINT "lesson_challenges_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_active_course_id_courses_id_fk" FOREIGN KEY ("active_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_options" ADD CONSTRAINT "word_options_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reward_events_user_id_created_at_idx" ON "reward_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "reward_events_source_created_at_idx" ON "reward_events" USING btree ("source","created_at");