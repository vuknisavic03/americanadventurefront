import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_candidate_sensitive_profiles_program_code" AS ENUM('SWT');
    CREATE TYPE "public"."enum_candidate_sensitive_profiles_personal_id_status" AS ENUM('MISSING', 'VALIDATED');
    CREATE TYPE "public"."enum_candidate_sensitive_profiles_contract_readiness_status" AS ENUM('INCOMPLETE', 'UNDER_REVIEW', 'READY');
    CREATE TYPE "public"."enum_candidate_private_documents_document_type" AS ENUM('PASSPORT');
    CREATE TYPE "public"."enum_candidate_private_documents_status" AS ENUM('UPLOADED', 'VERIFIED', 'REJECTED', 'SUPERSEDED');
    CREATE TYPE "public"."enum_candidate_private_documents_mime_type" AS ENUM('application/pdf', 'image/jpeg', 'image/png');
    CREATE TYPE "public"."enum_contract_templates_program_code" AS ENUM('SWT');
    CREATE TYPE "public"."enum_contract_templates_template_type" AS ENUM('STANDARD', 'PAY_WHEN_YOU_EARN');
    CREATE TYPE "public"."enum_contract_templates_status" AS ENUM('DRAFT', 'ACTIVE', 'RETIRED');

    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'SENSITIVE_PROFILE_UPDATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PRIVATE_DOCUMENT_UPLOADED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PRIVATE_DOCUMENT_ACCESSED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PRIVATE_DOCUMENT_VERIFIED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PRIVATE_DOCUMENT_REJECTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTRACT_READINESS_ACHIEVED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTRACT_TEMPLATE_DRAFTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTRACT_TEMPLATE_ACTIVATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTRACT_TEMPLATE_RETIRED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TABLE "audit_events" ALTER COLUMN "pre_application_id" DROP NOT NULL;

    CREATE TABLE "candidate_sensitive_profiles" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "applicant_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "program_code" "enum_candidate_sensitive_profiles_program_code" NOT NULL,
      "personal_id_status" "enum_candidate_sensitive_profiles_personal_id_status" DEFAULT 'MISSING' NOT NULL,
      "personal_id_updated_at" timestamp(3) with time zone,
      "personal_id_ciphertext" varchar,
      "personal_id_iv" varchar,
      "personal_id_auth_tag" varchar,
      "personal_id_key_id" varchar,
      "personal_id_fingerprint" varchar,
      "active_passport_document_id" integer,
      "contract_readiness_status" "enum_candidate_sensitive_profiles_contract_readiness_status" DEFAULT 'INCOMPLETE' NOT NULL,
      "readiness_updated_at" timestamp(3) with time zone,
      "retention_review_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "candidate_private_documents" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "sensitive_profile_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "document_type" "enum_candidate_private_documents_document_type" DEFAULT 'PASSPORT' NOT NULL,
      "status" "enum_candidate_private_documents_status" DEFAULT 'UPLOADED' NOT NULL,
      "original_file_name" varchar NOT NULL,
      "mime_type" "enum_candidate_private_documents_mime_type" NOT NULL,
      "size_bytes" numeric NOT NULL,
      "sha256" varchar NOT NULL,
      "ciphertext" varchar NOT NULL,
      "iv" varchar NOT NULL,
      "auth_tag" varchar NOT NULL,
      "key_id" varchar NOT NULL,
      "uploaded_at" timestamp(3) with time zone NOT NULL,
      "verified_at" timestamp(3) with time zone,
      "verified_by_id" integer,
      "rejection_reason" varchar,
      "superseded_at" timestamp(3) with time zone,
      "retention_review_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "contract_templates" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "program_code" "enum_contract_templates_program_code" NOT NULL,
      "template_type" "enum_contract_templates_template_type" NOT NULL,
      "version" numeric NOT NULL,
      "status" "enum_contract_templates_status" DEFAULT 'DRAFT' NOT NULL,
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

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_sensitive_profiles_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_private_documents_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contract_templates_id" integer;

    ALTER TABLE "candidate_sensitive_profiles" ADD CONSTRAINT "candidate_sensitive_profiles_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_sensitive_profiles" ADD CONSTRAINT "candidate_sensitive_profiles_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_sensitive_profiles" ADD CONSTRAINT "candidate_sensitive_profiles_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_private_documents" ADD CONSTRAINT "candidate_private_documents_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_private_documents" ADD CONSTRAINT "candidate_private_documents_sensitive_profile_id_candidate_sensitive_profiles_id_fk" FOREIGN KEY ("sensitive_profile_id") REFERENCES "public"."candidate_sensitive_profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_private_documents" ADD CONSTRAINT "candidate_private_documents_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_private_documents" ADD CONSTRAINT "candidate_private_documents_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_sensitive_profiles" ADD CONSTRAINT "candidate_sensitive_profiles_active_passport_document_id_candidate_private_documents_id_fk" FOREIGN KEY ("active_passport_document_id") REFERENCES "public"."candidate_private_documents"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_activated_by_id_users_id_fk" FOREIGN KEY ("activated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_retired_by_id_users_id_fk" FOREIGN KEY ("retired_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_sensitive_profiles_fk" FOREIGN KEY ("candidate_sensitive_profiles_id") REFERENCES "public"."candidate_sensitive_profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_private_documents_fk" FOREIGN KEY ("candidate_private_documents_id") REFERENCES "public"."candidate_private_documents"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contract_templates_fk" FOREIGN KEY ("contract_templates_id") REFERENCES "public"."contract_templates"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "candidate_sensitive_profiles_candidate_account_idx" ON "candidate_sensitive_profiles" USING btree ("candidate_account_id");
    CREATE UNIQUE INDEX "candidate_sensitive_profiles_applicant_idx" ON "candidate_sensitive_profiles" USING btree ("applicant_id");
    CREATE UNIQUE INDEX "candidate_sensitive_profiles_pre_application_idx" ON "candidate_sensitive_profiles" USING btree ("pre_application_id");
    CREATE UNIQUE INDEX "candidate_sensitive_profiles_personal_id_fingerprint_idx" ON "candidate_sensitive_profiles" USING btree ("personal_id_fingerprint");
    CREATE INDEX "candidate_sensitive_profiles_active_passport_document_idx" ON "candidate_sensitive_profiles" USING btree ("active_passport_document_id");
    CREATE INDEX "candidate_sensitive_profiles_updated_at_idx" ON "candidate_sensitive_profiles" USING btree ("updated_at");
    CREATE INDEX "candidate_sensitive_profiles_created_at_idx" ON "candidate_sensitive_profiles" USING btree ("created_at");
    CREATE INDEX "candidate_private_documents_candidate_account_idx" ON "candidate_private_documents" USING btree ("candidate_account_id");
    CREATE INDEX "candidate_private_documents_sensitive_profile_idx" ON "candidate_private_documents" USING btree ("sensitive_profile_id");
    CREATE INDEX "candidate_private_documents_pre_application_idx" ON "candidate_private_documents" USING btree ("pre_application_id");
    CREATE INDEX "candidate_private_documents_verified_by_idx" ON "candidate_private_documents" USING btree ("verified_by_id");
    CREATE INDEX "candidate_private_documents_updated_at_idx" ON "candidate_private_documents" USING btree ("updated_at");
    CREATE INDEX "candidate_private_documents_created_at_idx" ON "candidate_private_documents" USING btree ("created_at");
    CREATE UNIQUE INDEX "contract_templates_program_type_version_idx" ON "contract_templates" USING btree ("program_code", "template_type", "version");
    CREATE UNIQUE INDEX "contract_templates_one_active_idx" ON "contract_templates" USING btree ("program_code", "template_type") WHERE "status" = 'ACTIVE';
    CREATE INDEX "contract_templates_created_by_idx" ON "contract_templates" USING btree ("created_by_id");
    CREATE INDEX "contract_templates_activated_by_idx" ON "contract_templates" USING btree ("activated_by_id");
    CREATE INDEX "contract_templates_retired_by_idx" ON "contract_templates" USING btree ("retired_by_id");
    CREATE INDEX "contract_templates_updated_at_idx" ON "contract_templates" USING btree ("updated_at");
    CREATE INDEX "contract_templates_created_at_idx" ON "contract_templates" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_candidate_sensitive_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_sensitive_profiles_id");
    CREATE INDEX "payload_locked_documents_rels_candidate_private_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_private_documents_id");
    CREATE INDEX "payload_locked_documents_rels_contract_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("contract_templates_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "audit_events" WHERE "event_type" IN ('SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED');
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contract_templates_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_private_documents_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_sensitive_profiles_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contract_templates_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_private_documents_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_sensitive_profiles_id";
    DROP TABLE "contract_templates" CASCADE;
    DROP TABLE "candidate_private_documents" CASCADE;
    DROP TABLE "candidate_sensitive_profiles" CASCADE;
    DROP TYPE "public"."enum_contract_templates_status";
    DROP TYPE "public"."enum_contract_templates_template_type";
    DROP TYPE "public"."enum_contract_templates_program_code";
    DROP TYPE "public"."enum_candidate_private_documents_mime_type";
    DROP TYPE "public"."enum_candidate_private_documents_status";
    DROP TYPE "public"."enum_candidate_private_documents_document_type";
    DROP TYPE "public"."enum_candidate_sensitive_profiles_contract_readiness_status";
    DROP TYPE "public"."enum_candidate_sensitive_profiles_personal_id_status";
    DROP TYPE "public"."enum_candidate_sensitive_profiles_program_code";

    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_event_type";
    CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM(
      'PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED',
      'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED',
      'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED',
      'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED',
      'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED',
      'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED',
      'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'CANDIDATE_ACCOUNT_REGISTERED',
      'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED'
    );
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
    ALTER TABLE "audit_events" ALTER COLUMN "pre_application_id" SET NOT NULL;
  `)
}
