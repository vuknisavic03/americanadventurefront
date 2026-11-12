import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_passport_authorization_templates_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_passport_authorization_templates_status" AS ENUM('DRAFT', 'ACTIVE', 'RETIRED');
  CREATE TYPE "public"."enum_passport_collection_authorizations_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_passport_collection_authorizations_status" AS ENUM('GENERATED', 'ACCEPTED');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PASSPORT_AUTHORIZATION_TEMPLATE_DRAFTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PASSPORT_AUTHORIZATION_TEMPLATE_ACTIVATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PASSPORT_AUTHORIZATION_TEMPLATE_RETIRED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PASSPORT_AUTHORIZATION_GENERATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PASSPORT_AUTHORIZATION_ACCEPTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PASSPORT_AUTHORIZATION_ACCESSED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  CREATE TABLE "passport_authorization_templates" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "program_code" "enum_passport_authorization_templates_program_code" NOT NULL,
    "version" numeric NOT NULL,
    "status" "enum_passport_authorization_templates_status" DEFAULT 'DRAFT' NOT NULL,
    "body" varchar NOT NULL,
    "content_checksum" varchar NOT NULL,
    "created_by_id" integer,
    "activated_at" timestamp(3) with time zone,
    "activated_by_id" integer,
    "retired_at" timestamp(3) with time zone,
    "retired_by_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "passport_collection_authorizations" (
    "id" serial PRIMARY KEY NOT NULL,
    "candidate_process_id" integer NOT NULL,
    "candidate_account_id" integer NOT NULL,
    "applicant_id" integer NOT NULL,
    "sensitive_profile_id" integer NOT NULL,
    "pre_application_id" integer NOT NULL,
    "template_id" integer NOT NULL,
    "generated_by_id" integer NOT NULL,
    "program_code" "enum_passport_collection_authorizations_program_code" NOT NULL,
    "status" "enum_passport_collection_authorizations_status" DEFAULT 'GENERATED' NOT NULL,
    "authorization_number" varchar NOT NULL,
    "generation_key" varchar NOT NULL,
    "template_version" numeric NOT NULL,
    "template_checksum" varchar NOT NULL,
    "snapshot_sha256" varchar NOT NULL,
    "snapshot_ciphertext" varchar NOT NULL,
    "snapshot_iv" varchar NOT NULL,
    "snapshot_auth_tag" varchar NOT NULL,
    "snapshot_key_id" varchar NOT NULL,
    "pdf_file_name" varchar NOT NULL,
    "pdf_size_bytes" numeric NOT NULL,
    "pdf_sha256" varchar NOT NULL,
    "pdf_ciphertext" varchar NOT NULL,
    "pdf_iv" varchar NOT NULL,
    "pdf_auth_tag" varchar NOT NULL,
    "pdf_key_id" varchar NOT NULL,
    "generated_at" timestamp(3) with time zone NOT NULL,
    "accepted_at" timestamp(3) with time zone,
    "acceptance_reference" varchar,
    "statement_version" varchar,
    "statement_text" varchar,
    "statement_checksum" varchar,
    "evidence_sha256" varchar,
    "final_pdf_file_name" varchar,
    "final_pdf_size_bytes" numeric,
    "final_pdf_sha256" varchar,
    "final_pdf_ciphertext" varchar,
    "final_pdf_iv" varchar,
    "final_pdf_auth_tag" varchar,
    "final_pdf_key_id" varchar,
    "retention_review_at" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "passport_authorization_templates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "passport_collection_authorizations_id" integer;
  ALTER TABLE "passport_authorization_templates" ADD CONSTRAINT "passport_authorization_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_authorization_templates" ADD CONSTRAINT "passport_authorization_templates_activated_by_id_users_id_fk" FOREIGN KEY ("activated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_authorization_templates" ADD CONSTRAINT "passport_authorization_templates_retired_by_id_users_id_fk" FOREIGN KEY ("retired_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_collection_authorizations" ADD CONSTRAINT "passport_collection_authorizations_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_collection_authorizations" ADD CONSTRAINT "passport_collection_authorizations_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_collection_authorizations" ADD CONSTRAINT "passport_collection_authorizations_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_collection_authorizations" ADD CONSTRAINT "passport_collection_authorizations_sensitive_profile_id_candidate_sensitive_profiles_id_fk" FOREIGN KEY ("sensitive_profile_id") REFERENCES "public"."candidate_sensitive_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_collection_authorizations" ADD CONSTRAINT "passport_collection_authorizations_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_collection_authorizations" ADD CONSTRAINT "passport_collection_authorizations_template_id_passport_authorization_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."passport_authorization_templates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passport_collection_authorizations" ADD CONSTRAINT "passport_collection_authorizations_generated_by_id_users_id_fk" FOREIGN KEY ("generated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "passport_authorization_templates_created_by_idx" ON "passport_authorization_templates" USING btree ("created_by_id");
  CREATE INDEX "passport_authorization_templates_activated_by_idx" ON "passport_authorization_templates" USING btree ("activated_by_id");
  CREATE INDEX "passport_authorization_templates_retired_by_idx" ON "passport_authorization_templates" USING btree ("retired_by_id");
  CREATE INDEX "passport_authorization_templates_updated_at_idx" ON "passport_authorization_templates" USING btree ("updated_at");
  CREATE INDEX "passport_authorization_templates_created_at_idx" ON "passport_authorization_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "passport_collection_authorizations_candidate_process_idx" ON "passport_collection_authorizations" USING btree ("candidate_process_id");
  CREATE INDEX "passport_collection_authorizations_candidate_account_idx" ON "passport_collection_authorizations" USING btree ("candidate_account_id");
  CREATE INDEX "passport_collection_authorizations_applicant_idx" ON "passport_collection_authorizations" USING btree ("applicant_id");
  CREATE INDEX "passport_collection_authorizations_sensitive_profile_idx" ON "passport_collection_authorizations" USING btree ("sensitive_profile_id");
  CREATE INDEX "passport_collection_authorizations_pre_application_idx" ON "passport_collection_authorizations" USING btree ("pre_application_id");
  CREATE INDEX "passport_collection_authorizations_template_idx" ON "passport_collection_authorizations" USING btree ("template_id");
  CREATE INDEX "passport_collection_authorizations_generated_by_idx" ON "passport_collection_authorizations" USING btree ("generated_by_id");
  CREATE UNIQUE INDEX "passport_collection_authorizations_authorization_number_idx" ON "passport_collection_authorizations" USING btree ("authorization_number");
  CREATE UNIQUE INDEX "passport_collection_authorizations_generation_key_idx" ON "passport_collection_authorizations" USING btree ("generation_key");
  CREATE UNIQUE INDEX "passport_collection_authorizations_acceptance_reference_idx" ON "passport_collection_authorizations" USING btree ("acceptance_reference");
  CREATE INDEX "passport_collection_authorizations_updated_at_idx" ON "passport_collection_authorizations" USING btree ("updated_at");
  CREATE INDEX "passport_collection_authorizations_created_at_idx" ON "passport_collection_authorizations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passport_authorization_temp_fk" FOREIGN KEY ("passport_authorization_templates_id") REFERENCES "public"."passport_authorization_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passport_collection_authori_fk" FOREIGN KEY ("passport_collection_authorizations_id") REFERENCES "public"."passport_collection_authorizations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_passport_authorization_tem_idx" ON "payload_locked_documents_rels" USING btree ("passport_authorization_templates_id");
  CREATE INDEX "payload_locked_documents_rels_passport_collection_author_idx" ON "payload_locked_documents_rels" USING btree ("passport_collection_authorizations_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM passport_collection_authorizations) THEN
      RAISE EXCEPTION 'Cannot roll back passport collection authorizations while archived authorizations exist.';
    END IF;
  END $$;
  ALTER TABLE "passport_authorization_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "passport_collection_authorizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_passport_authorization_temp_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_passport_collection_authori_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_passport_authorization_tem_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_passport_collection_author_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "passport_authorization_templates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "passport_collection_authorizations_id";
  DROP TABLE "passport_collection_authorizations";
  DROP TABLE "passport_authorization_templates";

  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'INTERVIEW_PREPARATION_SCHEDULED', 'INTERVIEW_PREPARATION_RESCHEDULED', 'INTERVIEW_PREPARATION_CANCELLED', 'INTERVIEW_PREPARATION_COMPLETED', 'INTERVIEW_PREPARATION_NO_SHOW', 'JOB_SHORTLIST_SENT', 'JOB_SHORTLIST_NOTIFICATION_SENT', 'JOB_OPTION_PREFERENCE_UPDATED', 'JOB_OPTION_WITHDRAWN', 'EMPLOYMENT_OFFER_PUBLISHED', 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', 'EMPLOYMENT_OFFER_WITHDRAWN', 'EMPLOYMENT_OFFER_ACCEPTED', 'VISA_PAYMENT_ORDER_ISSUED', 'VISA_QUESTIONNAIRE_UPDATED', 'VISA_PAYMENT_RECORDED', 'VISA_PAYMENT_ORDER_CANCELLED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  DROP TYPE "public"."enum_passport_authorization_templates_program_code";
  DROP TYPE "public"."enum_passport_authorization_templates_status";
  DROP TYPE "public"."enum_passport_collection_authorizations_program_code";
  DROP TYPE "public"."enum_passport_collection_authorizations_status";`)
}
