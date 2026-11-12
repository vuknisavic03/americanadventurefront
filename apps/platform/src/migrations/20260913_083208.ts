import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'VISA_DS160_CONFIRMATION';
  ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'VISA_DS2019';
  ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'VISA_FEE_RECEIPT';
  ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'VISA_PHOTO';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM candidate_private_documents
      WHERE document_type::text IN ('VISA_DS160_CONFIRMATION', 'VISA_DS2019', 'VISA_FEE_RECEIPT', 'VISA_PHOTO')
    ) THEN
      RAISE EXCEPTION 'Cannot roll back the visa document checklist while candidate visa documents exist.';
    END IF;
  END $$;
  ALTER TABLE "candidate_private_documents" ALTER COLUMN "document_type" SET DATA TYPE text;
  ALTER TABLE "candidate_private_documents" ALTER COLUMN "document_type" SET DEFAULT 'PASSPORT'::text;
  DROP TYPE "public"."enum_candidate_private_documents_document_type";
  CREATE TYPE "public"."enum_candidate_private_documents_document_type" AS ENUM('PASSPORT', 'PROFILE_PHOTO', 'ENROLLMENT_CERTIFICATE', 'CV');
  ALTER TABLE "candidate_private_documents" ALTER COLUMN "document_type" SET DEFAULT 'PASSPORT'::"public"."enum_candidate_private_documents_document_type";
  ALTER TABLE "candidate_private_documents" ALTER COLUMN "document_type" SET DATA TYPE "public"."enum_candidate_private_documents_document_type" USING "document_type"::"public"."enum_candidate_private_documents_document_type";`)
}
