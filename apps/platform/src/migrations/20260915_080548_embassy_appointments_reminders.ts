import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_embassy_appointments_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_embassy_appointments_status" AS ENUM('SCHEDULED', 'CANCELLED');
  CREATE TYPE "public"."enum_embassy_reminder_deliveries_channel" AS ENUM('EMAIL', 'SMS');
  CREATE TYPE "public"."enum_embassy_reminder_deliveries_status" AS ENUM('PROCESSING', 'DELIVERED', 'FAILED', 'SKIPPED');
  CREATE TYPE "public"."enum_embassy_reminder_deliveries_provider" AS ENUM('capture', 'resend', 'webhook');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMBASSY_APPOINTMENT_SCHEDULED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMBASSY_APPOINTMENT_RESCHEDULED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMBASSY_APPOINTMENT_CANCELLED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMBASSY_REMINDER_EMAIL_SENT' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMBASSY_REMINDER_SMS_SENT' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'EMBASSY_REMINDER_SKIPPED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'sendEmbassyAppointmentReminder';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'sendEmbassyAppointmentReminder';
  CREATE TABLE "embassy_appointments" (
    "id" serial PRIMARY KEY NOT NULL,
    "candidate_process_id" integer NOT NULL,
    "candidate_account_id" integer NOT NULL,
    "applicant_id" integer NOT NULL,
    "pre_application_id" integer NOT NULL,
    "program_code" "enum_embassy_appointments_program_code" NOT NULL,
    "status" "enum_embassy_appointments_status" NOT NULL,
    "appointment_date" varchar NOT NULL,
    "appointment_time" varchar NOT NULL,
    "appointment_at" timestamp(3) with time zone NOT NULL,
    "time_zone" varchar DEFAULT 'Europe/Belgrade' NOT NULL,
    "reminder_at" timestamp(3) with time zone NOT NULL,
    "version" numeric DEFAULT 1 NOT NULL,
    "scheduled_at" timestamp(3) with time zone NOT NULL,
    "cancelled_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "embassy_reminder_deliveries" (
    "id" serial PRIMARY KEY NOT NULL,
    "embassy_appointment_id" integer NOT NULL,
    "pre_application_id" integer NOT NULL,
    "appointment_version" numeric NOT NULL,
    "idempotency_key" varchar NOT NULL,
    "channel" "enum_embassy_reminder_deliveries_channel" NOT NULL,
    "status" "enum_embassy_reminder_deliveries_status" NOT NULL,
    "recipient" varchar NOT NULL,
    "subject" varchar,
    "template_key" varchar NOT NULL,
    "template_version" varchar NOT NULL,
    "content_hash" varchar NOT NULL,
    "provider" "enum_embassy_reminder_deliveries_provider" NOT NULL,
    "provider_message_id" varchar,
    "attempt_count" numeric DEFAULT 1 NOT NULL,
    "last_attempt_at" timestamp(3) with time zone NOT NULL,
    "delivered_at" timestamp(3) with time zone,
    "last_error_code" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "embassy_appointments_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "embassy_reminder_deliveries_id" integer;
  ALTER TABLE "embassy_appointments" ADD CONSTRAINT "embassy_appointments_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "embassy_appointments" ADD CONSTRAINT "embassy_appointments_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "embassy_appointments" ADD CONSTRAINT "embassy_appointments_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "embassy_appointments" ADD CONSTRAINT "embassy_appointments_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "embassy_reminder_deliveries" ADD CONSTRAINT "embassy_reminder_deliveries_embassy_appointment_id_embassy_appointments_id_fk" FOREIGN KEY ("embassy_appointment_id") REFERENCES "public"."embassy_appointments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "embassy_reminder_deliveries" ADD CONSTRAINT "embassy_reminder_deliveries_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "embassy_appointments_candidate_process_idx" ON "embassy_appointments" USING btree ("candidate_process_id");
  CREATE UNIQUE INDEX "embassy_appointments_candidate_account_idx" ON "embassy_appointments" USING btree ("candidate_account_id");
  CREATE INDEX "embassy_appointments_applicant_idx" ON "embassy_appointments" USING btree ("applicant_id");
  CREATE INDEX "embassy_appointments_pre_application_idx" ON "embassy_appointments" USING btree ("pre_application_id");
  CREATE INDEX "embassy_appointments_appointment_at_idx" ON "embassy_appointments" USING btree ("appointment_at");
  CREATE INDEX "embassy_appointments_reminder_at_idx" ON "embassy_appointments" USING btree ("reminder_at");
  CREATE INDEX "embassy_appointments_updated_at_idx" ON "embassy_appointments" USING btree ("updated_at");
  CREATE INDEX "embassy_appointments_created_at_idx" ON "embassy_appointments" USING btree ("created_at");
  CREATE INDEX "status_reminderAt_idx" ON "embassy_appointments" USING btree ("status","reminder_at");
  CREATE INDEX "embassy_reminder_deliveries_embassy_appointment_idx" ON "embassy_reminder_deliveries" USING btree ("embassy_appointment_id");
  CREATE INDEX "embassy_reminder_deliveries_pre_application_idx" ON "embassy_reminder_deliveries" USING btree ("pre_application_id");
  CREATE UNIQUE INDEX "embassy_reminder_deliveries_idempotency_key_idx" ON "embassy_reminder_deliveries" USING btree ("idempotency_key");
  CREATE INDEX "embassy_reminder_deliveries_updated_at_idx" ON "embassy_reminder_deliveries" USING btree ("updated_at");
  CREATE INDEX "embassy_reminder_deliveries_created_at_idx" ON "embassy_reminder_deliveries" USING btree ("created_at");
  CREATE UNIQUE INDEX "embassyAppointment_appointmentVersion_channel_idx" ON "embassy_reminder_deliveries" USING btree ("embassy_appointment_id","appointment_version","channel");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_embassy_appointments_fk" FOREIGN KEY ("embassy_appointments_id") REFERENCES "public"."embassy_appointments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_embassy_reminder_deliveries_fk" FOREIGN KEY ("embassy_reminder_deliveries_id") REFERENCES "public"."embassy_reminder_deliveries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_embassy_appointments_id_idx" ON "payload_locked_documents_rels" USING btree ("embassy_appointments_id");
  CREATE INDEX "payload_locked_documents_rels_embassy_reminder_deliverie_idx" ON "payload_locked_documents_rels" USING btree ("embassy_reminder_deliveries_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "embassy_appointments") OR EXISTS (SELECT 1 FROM "embassy_reminder_deliveries") THEN
      RAISE EXCEPTION 'Refusing FR-053/FR-054 rollback because embassy appointment or reminder data exists.';
    END IF;
    IF EXISTS (SELECT 1 FROM "audit_events" WHERE "event_type" IN ('EMBASSY_APPOINTMENT_SCHEDULED', 'EMBASSY_APPOINTMENT_RESCHEDULED', 'EMBASSY_APPOINTMENT_CANCELLED', 'EMBASSY_REMINDER_EMAIL_SENT', 'EMBASSY_REMINDER_SMS_SENT', 'EMBASSY_REMINDER_SKIPPED')) THEN
      RAISE EXCEPTION 'Refusing FR-053/FR-054 rollback because related audit events exist.';
    END IF;
    IF EXISTS (SELECT 1 FROM "payload_jobs" WHERE "task_slug" = 'sendEmbassyAppointmentReminder') OR EXISTS (SELECT 1 FROM "payload_jobs_log" WHERE "task_slug" = 'sendEmbassyAppointmentReminder') THEN
      RAISE EXCEPTION 'Refusing FR-053/FR-054 rollback because related background jobs exist.';
    END IF;
  END $$;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_embassy_appointments_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_embassy_reminder_deliveries_fk";
  DROP INDEX "payload_locked_documents_rels_embassy_appointments_id_idx";
  DROP INDEX "payload_locked_documents_rels_embassy_reminder_deliverie_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "embassy_appointments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "embassy_reminder_deliveries_id";
  ALTER TABLE "embassy_appointments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "embassy_reminder_deliveries" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "embassy_appointments" CASCADE;
  DROP TABLE "embassy_reminder_deliveries" CASCADE;
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'INTERVIEW_PREPARATION_SCHEDULED', 'INTERVIEW_PREPARATION_RESCHEDULED', 'INTERVIEW_PREPARATION_CANCELLED', 'INTERVIEW_PREPARATION_COMPLETED', 'INTERVIEW_PREPARATION_NO_SHOW', 'JOB_SHORTLIST_SENT', 'JOB_SHORTLIST_NOTIFICATION_SENT', 'JOB_OPTION_PREFERENCE_UPDATED', 'JOB_OPTION_WITHDRAWN', 'EMPLOYMENT_OFFER_PUBLISHED', 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', 'EMPLOYMENT_OFFER_WITHDRAWN', 'EMPLOYMENT_OFFER_ACCEPTED', 'VISA_PAYMENT_ORDER_ISSUED', 'VISA_QUESTIONNAIRE_UPDATED', 'VISA_PAYMENT_RECORDED', 'VISA_PAYMENT_ORDER_CANCELLED', 'PASSPORT_AUTHORIZATION_TEMPLATE_DRAFTED', 'PASSPORT_AUTHORIZATION_TEMPLATE_ACTIVATED', 'PASSPORT_AUTHORIZATION_TEMPLATE_RETIRED', 'PASSPORT_AUTHORIZATION_GENERATED', 'PASSPORT_AUTHORIZATION_ACCEPTED', 'PASSPORT_AUTHORIZATION_ACCESSED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'sendCandidateCommunication');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'sendCandidateCommunication');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_embassy_appointments_program_code";
  DROP TYPE "public"."enum_embassy_appointments_status";
  DROP TYPE "public"."enum_embassy_reminder_deliveries_channel";
  DROP TYPE "public"."enum_embassy_reminder_deliveries_status";
  DROP TYPE "public"."enum_embassy_reminder_deliveries_provider";`)
}
