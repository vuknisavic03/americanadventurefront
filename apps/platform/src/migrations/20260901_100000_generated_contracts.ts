import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE SEQUENCE "contract_number_sequence" START WITH 1 INCREMENT BY 1 NO CYCLE;
    CREATE TYPE "public"."enum_generated_contracts_program_code" AS ENUM('SWT');
    CREATE TYPE "public"."enum_generated_contracts_template_type" AS ENUM('STANDARD', 'PAY_WHEN_YOU_EARN');
    CREATE TYPE "public"."enum_generated_contracts_status" AS ENUM('GENERATED');
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTRACT_GENERATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTRACT_ACCESSED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';

    CREATE TABLE "generated_contracts" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "sensitive_profile_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "program_offer_selection_id" integer NOT NULL,
      "contract_template_id" integer NOT NULL,
      "generated_by_id" integer NOT NULL,
      "program_code" "enum_generated_contracts_program_code" NOT NULL,
      "template_type" "enum_generated_contracts_template_type" NOT NULL,
      "status" "enum_generated_contracts_status" DEFAULT 'GENERATED' NOT NULL,
      "contract_number" varchar NOT NULL,
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
      "retention_review_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "generated_contracts_id" integer;
    ALTER TABLE "generated_contracts" ADD CONSTRAINT "generated_contracts_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "generated_contracts" ADD CONSTRAINT "generated_contracts_sensitive_profile_id_candidate_sensitive_profiles_id_fk" FOREIGN KEY ("sensitive_profile_id") REFERENCES "public"."candidate_sensitive_profiles"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "generated_contracts" ADD CONSTRAINT "generated_contracts_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "generated_contracts" ADD CONSTRAINT "generated_contracts_program_offer_selection_id_program_offer_selections_id_fk" FOREIGN KEY ("program_offer_selection_id") REFERENCES "public"."program_offer_selections"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "generated_contracts" ADD CONSTRAINT "generated_contracts_contract_template_id_contract_templates_id_fk" FOREIGN KEY ("contract_template_id") REFERENCES "public"."contract_templates"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "generated_contracts" ADD CONSTRAINT "generated_contracts_generated_by_id_users_id_fk" FOREIGN KEY ("generated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_generated_contracts_fk" FOREIGN KEY ("generated_contracts_id") REFERENCES "public"."generated_contracts"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "generated_contracts_candidate_account_idx" ON "generated_contracts" USING btree ("candidate_account_id");
    CREATE INDEX "generated_contracts_sensitive_profile_idx" ON "generated_contracts" USING btree ("sensitive_profile_id");
    CREATE INDEX "generated_contracts_pre_application_idx" ON "generated_contracts" USING btree ("pre_application_id");
    CREATE UNIQUE INDEX "generated_contracts_program_offer_selection_idx" ON "generated_contracts" USING btree ("program_offer_selection_id");
    CREATE INDEX "generated_contracts_contract_template_idx" ON "generated_contracts" USING btree ("contract_template_id");
    CREATE INDEX "generated_contracts_generated_by_idx" ON "generated_contracts" USING btree ("generated_by_id");
    CREATE UNIQUE INDEX "generated_contracts_contract_number_idx" ON "generated_contracts" USING btree ("contract_number");
    CREATE UNIQUE INDEX "generated_contracts_generation_key_idx" ON "generated_contracts" USING btree ("generation_key");
    CREATE INDEX "generated_contracts_generated_at_idx" ON "generated_contracts" USING btree ("generated_at");
    CREATE INDEX "generated_contracts_updated_at_idx" ON "generated_contracts" USING btree ("updated_at");
    CREATE INDEX "generated_contracts_created_at_idx" ON "generated_contracts" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_generated_contracts_id_idx" ON "payload_locked_documents_rels" USING btree ("generated_contracts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "audit_events" WHERE "event_type" IN ('CONTRACT_GENERATED', 'CONTRACT_ACCESSED');
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_generated_contracts_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "generated_contracts_id";
    DROP TABLE "generated_contracts" CASCADE;
    DROP TYPE "public"."enum_generated_contracts_status";
    DROP TYPE "public"."enum_generated_contracts_template_type";
    DROP TYPE "public"."enum_generated_contracts_program_code";
    DROP SEQUENCE "contract_number_sequence";

    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_event_type";
    CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM(
      'PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED',
      'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED',
      'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED',
      'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED',
      'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED',
      'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED',
      'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED',
      'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED',
      'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED',
      'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CANDIDATE_ACCOUNT_REGISTERED',
      'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED'
    );
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  `)
}

