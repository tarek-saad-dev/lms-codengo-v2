DO $$ BEGIN
    CREATE TYPE "course_type" AS ENUM ('GLOBAL', 'CUSTOMIZE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "courses" ADD COLUMN "type" "course_type" NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE "courses" ADD COLUMN "maker_id" varchar;
