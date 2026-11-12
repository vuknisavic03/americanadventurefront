import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PASSPORT_OCR_PROCESSED';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_private_documents_ocr_status" AS ENUM(
        'NOT_APPLICABLE',
        'PENDING',
        'COMPLETED',
        'NO_MRZ_DETECTED',
        'FAILED'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "candidate_private_documents"
      ADD COLUMN IF NOT EXISTS "ocr_status" "public"."enum_candidate_private_documents_ocr_status" DEFAULT 'NOT_APPLICABLE',
      ADD COLUMN IF NOT EXISTS "ocr_passport_number" varchar,
      ADD COLUMN IF NOT EXISTS "ocr_expiration_date" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "ocr_data" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidate_private_documents"
      DROP COLUMN IF EXISTS "ocr_data",
      DROP COLUMN IF EXISTS "ocr_expiration_date",
      DROP COLUMN IF EXISTS "ocr_passport_number",
      DROP COLUMN IF EXISTS "ocr_status";

    DROP TYPE IF EXISTS "public"."enum_candidate_private_documents_ocr_status";
  `)
}
