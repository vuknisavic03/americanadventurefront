import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_employment_offers_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_employment_offers_status" AS ENUM('PUBLISHED', 'ACCEPTED', 'WITHDRAWN');
  CREATE TYPE "public"."enum_employment_offers_currency" AS ENUM('USD');
  CREATE TYPE "public"."enum_employment_offers_notification_status" AS ENUM('PENDING', 'DELIVERED', 'FAILED');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMPLOYMENT_OFFER_PUBLISHED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMPLOYMENT_OFFER_NOTIFICATION_SENT' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMPLOYMENT_OFFER_WITHDRAWN' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMPLOYMENT_OFFER_ACCEPTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_outbox_events_event_type" ADD VALUE 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED';
  ALTER TYPE "public"."enum_message_deliveries_category" ADD VALUE 'EMPLOYMENT_OFFER';
  CREATE TABLE "employment_offers" (
    "id" serial PRIMARY KEY NOT NULL,
    "candidate_process_id" integer NOT NULL,
    "candidate_account_id" integer NOT NULL,
    "applicant_id" integer NOT NULL,
    "pre_application_id" integer NOT NULL,
    "program_code" "enum_employment_offers_program_code" NOT NULL,
    "offer_version" numeric NOT NULL,
    "status_version" numeric DEFAULT 1 NOT NULL,
    "status" "enum_employment_offers_status" NOT NULL,
    "employer_name" varchar NOT NULL,
    "job_title" varchar NOT NULL,
    "work_city" varchar NOT NULL,
    "work_state" varchar NOT NULL,
    "start_date" timestamp(3) with time zone NOT NULL,
    "end_date" timestamp(3) with time zone NOT NULL,
    "hourly_wage_cents" numeric NOT NULL,
    "currency" "enum_employment_offers_currency" NOT NULL,
    "expected_weekly_hours" numeric NOT NULL,
    "housing_provided" boolean DEFAULT false NOT NULL,
    "housing_cost_cents" numeric,
    "housing_description" varchar,
    "candidate_instructions" varchar NOT NULL,
    "internal_notes" varchar,
    "response_due_at" timestamp(3) with time zone,
    "snapshot_checksum" varchar NOT NULL,
    "published_at" timestamp(3) with time zone NOT NULL,
    "published_by_id" integer NOT NULL,
    "notification_status" "enum_employment_offers_notification_status" NOT NULL,
    "notification_delivered_at" timestamp(3) with time zone,
    "message_delivery_id" integer,
    "withdrawn_at" timestamp(3) with time zone,
    "withdrawn_by_id" integer,
    "withdrawal_reason" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "employment_offer_acceptances" (
    "id" serial PRIMARY KEY NOT NULL,
    "employment_offer_id" integer NOT NULL,
    "candidate_account_id" integer NOT NULL,
    "candidate_process_id" integer NOT NULL,
    "pre_application_id" integer NOT NULL,
    "acceptance_reference" varchar NOT NULL,
    "accepted_at" timestamp(3) with time zone NOT NULL,
    "statement_version" varchar NOT NULL,
    "statement_text" varchar NOT NULL,
    "statement_checksum" varchar NOT NULL,
    "offer_snapshot_checksum" varchar NOT NULL,
    "evidence_checksum" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "employment_offers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "employment_offer_acceptances_id" integer;
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_message_delivery_id_message_deliveries_id_fk" FOREIGN KEY ("message_delivery_id") REFERENCES "public"."message_deliveries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_withdrawn_by_id_users_id_fk" FOREIGN KEY ("withdrawn_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offer_acceptances" ADD CONSTRAINT "employment_offer_acceptances_employment_offer_id_employment_offers_id_fk" FOREIGN KEY ("employment_offer_id") REFERENCES "public"."employment_offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offer_acceptances" ADD CONSTRAINT "employment_offer_acceptances_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offer_acceptances" ADD CONSTRAINT "employment_offer_acceptances_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_offer_acceptances" ADD CONSTRAINT "employment_offer_acceptances_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "employment_offers_candidate_process_idx" ON "employment_offers" USING btree ("candidate_process_id");
  CREATE INDEX "employment_offers_candidate_account_idx" ON "employment_offers" USING btree ("candidate_account_id");
  CREATE INDEX "employment_offers_applicant_idx" ON "employment_offers" USING btree ("applicant_id");
  CREATE INDEX "employment_offers_pre_application_idx" ON "employment_offers" USING btree ("pre_application_id");
  CREATE INDEX "employment_offers_published_by_idx" ON "employment_offers" USING btree ("published_by_id");
  CREATE INDEX "employment_offers_message_delivery_idx" ON "employment_offers" USING btree ("message_delivery_id");
  CREATE INDEX "employment_offers_withdrawn_by_idx" ON "employment_offers" USING btree ("withdrawn_by_id");
  CREATE INDEX "employment_offers_updated_at_idx" ON "employment_offers" USING btree ("updated_at");
  CREATE INDEX "employment_offers_created_at_idx" ON "employment_offers" USING btree ("created_at");
  CREATE UNIQUE INDEX "candidateProcess_offerVersion_idx" ON "employment_offers" USING btree ("candidate_process_id","offer_version");
  CREATE INDEX "candidateAccount_status_idx" ON "employment_offers" USING btree ("candidate_account_id","status");
  CREATE INDEX "employerName_workState_idx" ON "employment_offers" USING btree ("employer_name","work_state");
  CREATE UNIQUE INDEX "employment_offer_acceptances_employment_offer_idx" ON "employment_offer_acceptances" USING btree ("employment_offer_id");
  CREATE INDEX "employment_offer_acceptances_candidate_account_idx" ON "employment_offer_acceptances" USING btree ("candidate_account_id");
  CREATE INDEX "employment_offer_acceptances_candidate_process_idx" ON "employment_offer_acceptances" USING btree ("candidate_process_id");
  CREATE INDEX "employment_offer_acceptances_pre_application_idx" ON "employment_offer_acceptances" USING btree ("pre_application_id");
  CREATE UNIQUE INDEX "employment_offer_acceptances_acceptance_reference_idx" ON "employment_offer_acceptances" USING btree ("acceptance_reference");
  CREATE INDEX "employment_offer_acceptances_updated_at_idx" ON "employment_offer_acceptances" USING btree ("updated_at");
  CREATE INDEX "employment_offer_acceptances_created_at_idx" ON "employment_offer_acceptances" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_employment_offers_fk" FOREIGN KEY ("employment_offers_id") REFERENCES "public"."employment_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_employment_offer_acceptance_fk" FOREIGN KEY ("employment_offer_acceptances_id") REFERENCES "public"."employment_offer_acceptances"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_employment_offers_id_idx" ON "payload_locked_documents_rels" USING btree ("employment_offers_id");
  CREATE INDEX "payload_locked_documents_rels_employment_offer_acceptanc_idx" ON "payload_locked_documents_rels" USING btree ("employment_offer_acceptances_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_employment_offers_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_employment_offer_acceptance_fk";
  DROP INDEX "payload_locked_documents_rels_employment_offers_id_idx";
  DROP INDEX "payload_locked_documents_rels_employment_offer_acceptanc_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "employment_offers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "employment_offer_acceptances_id";
  ALTER TABLE "employment_offers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "employment_offer_acceptances" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "employment_offer_acceptances" CASCADE;
  DROP TABLE "employment_offers" CASCADE;

  DELETE FROM "audit_events" WHERE "event_type" IN ('EMPLOYMENT_OFFER_PUBLISHED', 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', 'EMPLOYMENT_OFFER_WITHDRAWN', 'EMPLOYMENT_OFFER_ACCEPTED');
  DELETE FROM "outbox_events" WHERE "event_type" = 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED';
  DELETE FROM "message_deliveries" WHERE "category" = 'EMPLOYMENT_OFFER';

  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'INTERVIEW_PREPARATION_SCHEDULED', 'INTERVIEW_PREPARATION_RESCHEDULED', 'INTERVIEW_PREPARATION_CANCELLED', 'INTERVIEW_PREPARATION_COMPLETED', 'INTERVIEW_PREPARATION_NO_SHOW', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_outbox_events_event_type";
  CREATE TYPE "public"."enum_outbox_events_event_type" AS ENUM('MATERIAL_DELIVERY_REQUESTED', 'CONSULTATION_INVITATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED');
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_outbox_events_event_type" USING "event_type"::"public"."enum_outbox_events_event_type";
  ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_message_deliveries_category";
  CREATE TYPE "public"."enum_message_deliveries_category" AS ENUM('MATERIAL_BUNDLE', 'CONSULTATION_INVITATION', 'ACCOUNT_ACTIVATION');
  ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE "public"."enum_message_deliveries_category" USING "category"::"public"."enum_message_deliveries_category";
  DROP TYPE "public"."enum_employment_offers_program_code";
  DROP TYPE "public"."enum_employment_offers_status";
  DROP TYPE "public"."enum_employment_offers_currency";
  DROP TYPE "public"."enum_employment_offers_notification_status";`)
}
