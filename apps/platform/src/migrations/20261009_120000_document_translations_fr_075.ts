import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_translated_documents_document_type" AS ENUM('STUDENT_STATUS_CERTIFICATE', 'GUARANTOR_STATEMENT', 'GENERAL_DOCUMENT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_translated_documents_source_language" AS ENUM('sr');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_translated_documents_target_language" AS ENUM('en');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_translated_documents_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DOCUMENT_TRANSLATION_REQUESTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DOCUMENT_TRANSLATION_UPDATED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DOCUMENT_TRANSLATION_APPROVED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DOCUMENT_TRANSLATION_REJECTED';

    CREATE TABLE IF NOT EXISTS "translated_documents" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "candidate_process_id" integer NOT NULL,
      "candidate_account_id" integer,
      "document_type" "enum_translated_documents_document_type" DEFAULT 'STUDENT_STATUS_CERTIFICATE' NOT NULL,
      "source_language" "enum_translated_documents_source_language" DEFAULT 'sr' NOT NULL,
      "target_language" "enum_translated_documents_target_language" DEFAULT 'en' NOT NULL,
      "status" "enum_translated_documents_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
      "source_data" jsonb NOT NULL,
      "translated_data" jsonb NOT NULL,
      "admin_notes" varchar,
      "rejection_reason" varchar,
      "reviewed_by_id" integer,
      "reviewed_at" timestamp(3) with time zone,
      "pdf_checksum" varchar,
      "pdf_generated_at" timestamp(3) with time zone,
      "version" numeric DEFAULT 1,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "translated_documents" ADD CONSTRAINT "translated_documents_candidate_process_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "translated_documents" ADD CONSTRAINT "translated_documents_candidate_account_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "translated_documents" ADD CONSTRAINT "translated_documents_reviewed_by_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "translated_documents_candidate_process_idx" ON "translated_documents" ("candidate_process_id");
    CREATE INDEX IF NOT EXISTS "translated_documents_candidate_account_idx" ON "translated_documents" ("candidate_account_id");
    CREATE INDEX IF NOT EXISTS "translated_documents_status_idx" ON "translated_documents" ("status");
    CREATE INDEX IF NOT EXISTS "translated_documents_document_type_idx" ON "translated_documents" ("document_type");
    CREATE INDEX IF NOT EXISTS "translated_documents_created_at_idx" ON "translated_documents" ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "translated_documents" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_translated_documents_document_type";
    DROP TYPE IF EXISTS "public"."enum_translated_documents_source_language";
    DROP TYPE IF EXISTS "public"."enum_translated_documents_target_language";
    DROP TYPE IF EXISTS "public"."enum_translated_documents_status";
  `)
}
