import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     CREATE TYPE "public"."enum_usa_stay_materials_category" AS ENUM('HANDBOOK', 'INSURANCE', 'SEVIS', 'EMERGENCY', 'TAXES', 'OTHER');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;

   DO $$ BEGIN
     CREATE TYPE "public"."enum_usa_stay_materials_program_code" AS ENUM('SWT', 'ALL');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;

   DO $$ BEGIN
     CREATE TYPE "public"."enum_usa_stay_tips_category" AS ENUM('SSN', 'BANKING', 'HOUSING', 'TRANSPORT', 'WORK_CULTURE', 'HEALTH_SAFETY', 'GENERAL');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;

   CREATE TABLE IF NOT EXISTS "usa_stay_materials" (
     "id" serial PRIMARY KEY NOT NULL,
     "title" varchar NOT NULL,
     "description" varchar,
     "category" "enum_usa_stay_materials_category" DEFAULT 'HANDBOOK' NOT NULL,
     "program_code" "enum_usa_stay_materials_program_code" DEFAULT 'SWT' NOT NULL,
     "file_url" varchar NOT NULL,
     "file_name" varchar NOT NULL,
     "file_size" varchar,
     "sort_order" numeric DEFAULT 0,
     "published" boolean DEFAULT true,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "usa_stay_tips" (
     "id" serial PRIMARY KEY NOT NULL,
     "title" varchar NOT NULL,
     "category" "enum_usa_stay_tips_category" DEFAULT 'GENERAL' NOT NULL,
     "summary" varchar NOT NULL,
     "content" varchar NOT NULL,
     "pinned" boolean DEFAULT false,
     "sort_order" numeric DEFAULT 0,
     "published" boolean DEFAULT true,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   ALTER TABLE "candidate_processes" ADD COLUMN IF NOT EXISTS "peer_sharing_consent" boolean DEFAULT false;

   CREATE INDEX IF NOT EXISTS "usa_stay_materials_published_idx" ON "usa_stay_materials" ("published");
   CREATE INDEX IF NOT EXISTS "usa_stay_materials_created_at_idx" ON "usa_stay_materials" ("created_at");
   CREATE INDEX IF NOT EXISTS "usa_stay_tips_published_idx" ON "usa_stay_tips" ("published");
   CREATE INDEX IF NOT EXISTS "usa_stay_tips_created_at_idx" ON "usa_stay_tips" ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "usa_stay_materials" CASCADE;
   DROP TABLE IF EXISTS "usa_stay_tips" CASCADE;
   ALTER TABLE "candidate_processes" DROP COLUMN IF EXISTS "peer_sharing_consent";
   DROP TYPE IF EXISTS "public"."enum_usa_stay_materials_category";
   DROP TYPE IF EXISTS "public"."enum_usa_stay_materials_program_code";
   DROP TYPE IF EXISTS "public"."enum_usa_stay_tips_category";
  `)
}
