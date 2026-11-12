import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTRACT_ACCEPTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'ACCEPTED_CONTRACT_ACCESSED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';

    CREATE TABLE "contract_acceptances" (
      "id" serial PRIMARY KEY NOT NULL,
      "contract_id" integer NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "acceptance_reference" varchar NOT NULL,
      "accepted_at" timestamp(3) with time zone NOT NULL,
      "statement_version" varchar NOT NULL,
      "statement_text" varchar NOT NULL,
      "statement_checksum" varchar NOT NULL,
      "source_pdf_sha256" varchar NOT NULL,
      "evidence_sha256" varchar NOT NULL,
      "final_pdf_file_name" varchar NOT NULL,
      "final_pdf_size_bytes" numeric NOT NULL,
      "final_pdf_sha256" varchar NOT NULL,
      "final_pdf_ciphertext" varchar NOT NULL,
      "final_pdf_iv" varchar NOT NULL,
      "final_pdf_auth_tag" varchar NOT NULL,
      "final_pdf_key_id" varchar NOT NULL,
      "retention_review_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contract_acceptances_id" integer;
    ALTER TABLE "contract_acceptances" ADD CONSTRAINT "contract_acceptances_contract_id_generated_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."generated_contracts"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "contract_acceptances" ADD CONSTRAINT "contract_acceptances_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "contract_acceptances" ADD CONSTRAINT "contract_acceptances_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contract_acceptances_fk" FOREIGN KEY ("contract_acceptances_id") REFERENCES "public"."contract_acceptances"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "contract_acceptances_contract_idx" ON "contract_acceptances" USING btree ("contract_id");
    CREATE INDEX "contract_acceptances_candidate_account_idx" ON "contract_acceptances" USING btree ("candidate_account_id");
    CREATE INDEX "contract_acceptances_pre_application_idx" ON "contract_acceptances" USING btree ("pre_application_id");
    CREATE UNIQUE INDEX "contract_acceptances_acceptance_reference_idx" ON "contract_acceptances" USING btree ("acceptance_reference");
    CREATE INDEX "contract_acceptances_accepted_at_idx" ON "contract_acceptances" USING btree ("accepted_at");
    CREATE INDEX "contract_acceptances_updated_at_idx" ON "contract_acceptances" USING btree ("updated_at");
    CREATE INDEX "contract_acceptances_created_at_idx" ON "contract_acceptances" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_contract_acceptances_id_idx" ON "payload_locked_documents_rels" USING btree ("contract_acceptances_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "audit_events" WHERE "event_type" IN ('CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED');
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contract_acceptances_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contract_acceptances_id";
    DROP TABLE "contract_acceptances" CASCADE;

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
      'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED',
      'CONTRACT_ACCESSED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED',
      'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED'
    );
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  `)
}

