import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'PROFILE_PHOTO';
  ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'ENROLLMENT_CERTIFICATE';
  ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'CV';
  CREATE INDEX IF NOT EXISTS "candidateAccount_documentType_status_idx" ON "candidate_private_documents" USING btree ("candidate_account_id","document_type","status");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "candidateAccount_documentType_status_idx";`)
}
