import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_invitations_package_id" AS ENUM('swt-full', 'swt-self', 'swt-lifeguard', 'camp-usa', 'other');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_invitations_status" AS ENUM('pending', 'registered');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_applications_package_id" AS ENUM('swt-full', 'swt-self', 'swt-lifeguard', 'camp-usa', 'other');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_applications_payment_method" AS ENUM('now', 'installments', 'later');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_applications_preferences_english_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_applications_status" AS ENUM('applying', 'review', 'docs', 'job', 'departure', 'ready');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "candidate_invitations" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "email" varchar NOT NULL,
      "candidate_name" varchar,
      "package_id" "enum_candidate_invitations_package_id" DEFAULT 'swt-full' NOT NULL,
      "package_name" varchar DEFAULT 'Work & Travel USA — Full Placement' NOT NULL,
      "base_price" numeric DEFAULT 1850 NOT NULL,
      "discount" numeric DEFAULT 0,
      "discount_note" varchar,
      "final_price" numeric DEFAULT 1850 NOT NULL,
      "status" "enum_candidate_invitations_status" DEFAULT 'pending' NOT NULL,
      "registered_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "candidate_invitations_code_idx" ON "candidate_invitations" USING btree ("code");
    CREATE INDEX IF NOT EXISTS "candidate_invitations_email_idx" ON "candidate_invitations" USING btree ("email");
    CREATE INDEX IF NOT EXISTS "candidate_invitations_status_idx" ON "candidate_invitations" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "candidate_invitations_updated_at_idx" ON "candidate_invitations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "candidate_invitations_created_at_idx" ON "candidate_invitations" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "candidate_applications" (
      "id" serial PRIMARY KEY NOT NULL,
      "full_name" varchar,
      "first_name" varchar NOT NULL,
      "last_name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar,
      "jmbg" varchar,
      "id_card_number" varchar,
      "package_id" "enum_candidate_applications_package_id" DEFAULT 'swt-full' NOT NULL,
      "package_name" varchar DEFAULT 'Work & Travel USA — Full Placement' NOT NULL,
      "base_price" numeric DEFAULT 1850,
      "discount" numeric DEFAULT 0,
      "discount_note" varchar,
      "final_price" numeric DEFAULT 1850,
      "payment_method" "enum_candidate_applications_payment_method" DEFAULT 'now' NOT NULL,
      "guarantor_name" varchar,
      "guarantor_id_card_number" varchar,
      "guarantor_jmbg" varchar,
      "guarantor_promissory_notes_count" numeric DEFAULT 2,
      "preferences_location" varchar,
      "preferences_position" varchar,
      "preferences_english_level" "enum_candidate_applications_preferences_english_level" DEFAULT 'B2',
      "preferences_test_link" varchar,
      "youtube_url" varchar,
      "cv_file_name" varchar,
      "faculty_cert_file_name" varchar,
      "faculty_cert_ai_translation" boolean DEFAULT false,
      "status" "enum_candidate_applications_status" DEFAULT 'review' NOT NULL,
      "progress" numeric DEFAULT 30 NOT NULL,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "candidate_applications_email_idx" ON "candidate_applications" USING btree ("email");
    CREATE INDEX IF NOT EXISTS "candidate_applications_status_idx" ON "candidate_applications" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "candidate_applications_updated_at_idx" ON "candidate_applications" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "candidate_applications_created_at_idx" ON "candidate_applications" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_applications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_invitations_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_applications_fk" FOREIGN KEY ("candidate_applications_id") REFERENCES "public"."candidate_applications"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_invitations_fk" FOREIGN KEY ("candidate_invitations_id") REFERENCES "public"."candidate_invitations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_applications_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_invitations_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_candidate_invitations_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_candidate_applications_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "candidate_invitations_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "candidate_applications_id";

    DROP TABLE IF EXISTS "candidate_invitations" CASCADE;
    DROP TABLE IF EXISTS "candidate_applications" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_candidate_invitations_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_invitations_package_id";
    DROP TYPE IF EXISTS "public"."enum_candidate_applications_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_applications_preferences_english_level";
    DROP TYPE IF EXISTS "public"."enum_candidate_applications_payment_method";
    DROP TYPE IF EXISTS "public"."enum_candidate_applications_package_id";
  `)
}
