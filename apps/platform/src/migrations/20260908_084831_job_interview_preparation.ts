import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_interview_preparation_appointments_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_interview_preparation_appointments_status" AS ENUM('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');
  CREATE TYPE "public"."enum_interview_preparation_appointments_delivery_mode" AS ENUM('IN_PERSON', 'ONLINE');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'INTERVIEW_PREPARATION_SCHEDULED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'INTERVIEW_PREPARATION_RESCHEDULED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'INTERVIEW_PREPARATION_CANCELLED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'INTERVIEW_PREPARATION_COMPLETED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'INTERVIEW_PREPARATION_NO_SHOW' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  CREATE TABLE "interview_preparation_appointments" (
    "id" serial PRIMARY KEY NOT NULL,
    "candidate_process_id" integer NOT NULL,
    "candidate_account_id" integer NOT NULL,
    "applicant_id" integer NOT NULL,
    "pre_application_id" integer NOT NULL,
    "program_code" "enum_interview_preparation_appointments_program_code" NOT NULL,
    "attempt_number" numeric NOT NULL,
    "status" "enum_interview_preparation_appointments_status" NOT NULL,
    "starts_at" timestamp(3) with time zone NOT NULL,
    "ends_at" timestamp(3) with time zone,
    "time_zone" varchar NOT NULL,
    "delivery_mode" "enum_interview_preparation_appointments_delivery_mode" NOT NULL,
    "location_details" varchar NOT NULL,
    "candidate_instructions" varchar,
    "internal_notes" varchar,
    "version" numeric DEFAULT 1 NOT NULL,
    "scheduled_at" timestamp(3) with time zone NOT NULL,
    "scheduled_by_id" integer NOT NULL,
    "outcome_recorded_at" timestamp(3) with time zone,
    "outcome_recorded_by_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "interview_preparation_appointments_id" integer;
  ALTER TABLE "interview_preparation_appointments" ADD CONSTRAINT "interview_preparation_appointments_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interview_preparation_appointments" ADD CONSTRAINT "interview_preparation_appointments_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interview_preparation_appointments" ADD CONSTRAINT "interview_preparation_appointments_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interview_preparation_appointments" ADD CONSTRAINT "interview_preparation_appointments_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interview_preparation_appointments" ADD CONSTRAINT "interview_preparation_appointments_scheduled_by_id_users_id_fk" FOREIGN KEY ("scheduled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interview_preparation_appointments" ADD CONSTRAINT "interview_preparation_appointments_outcome_recorded_by_id_users_id_fk" FOREIGN KEY ("outcome_recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "interview_preparation_appointments_candidate_process_idx" ON "interview_preparation_appointments" USING btree ("candidate_process_id");
  CREATE INDEX "interview_preparation_appointments_candidate_account_idx" ON "interview_preparation_appointments" USING btree ("candidate_account_id");
  CREATE INDEX "interview_preparation_appointments_applicant_idx" ON "interview_preparation_appointments" USING btree ("applicant_id");
  CREATE INDEX "interview_preparation_appointments_pre_application_idx" ON "interview_preparation_appointments" USING btree ("pre_application_id");
  CREATE INDEX "interview_preparation_appointments_scheduled_by_idx" ON "interview_preparation_appointments" USING btree ("scheduled_by_id");
  CREATE INDEX "interview_preparation_appointments_outcome_recorded_by_idx" ON "interview_preparation_appointments" USING btree ("outcome_recorded_by_id");
  CREATE INDEX "interview_preparation_appointments_updated_at_idx" ON "interview_preparation_appointments" USING btree ("updated_at");
  CREATE INDEX "interview_preparation_appointments_created_at_idx" ON "interview_preparation_appointments" USING btree ("created_at");
  CREATE INDEX "candidateProcess_status_idx" ON "interview_preparation_appointments" USING btree ("candidate_process_id","status");
  CREATE INDEX "candidateAccount_startsAt_idx" ON "interview_preparation_appointments" USING btree ("candidate_account_id","starts_at");
  CREATE UNIQUE INDEX "candidateProcess_attemptNumber_idx" ON "interview_preparation_appointments" USING btree ("candidate_process_id","attempt_number");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_interview_preparation_appoi_fk" FOREIGN KEY ("interview_preparation_appointments_id") REFERENCES "public"."interview_preparation_appointments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_interview_preparation_appo_idx" ON "payload_locked_documents_rels" USING btree ("interview_preparation_appointments_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_interview_preparation_appoi_fk";
  DROP INDEX "payload_locked_documents_rels_interview_preparation_appo_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "interview_preparation_appointments_id";
  ALTER TABLE "interview_preparation_appointments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "interview_preparation_appointments" CASCADE;

  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  DROP TYPE "public"."enum_interview_preparation_appointments_program_code";
  DROP TYPE "public"."enum_interview_preparation_appointments_status";
  DROP TYPE "public"."enum_interview_preparation_appointments_delivery_mode";`)
}
