import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_visa_payment_orders_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_visa_payment_orders_status" AS ENUM('ISSUED', 'PAID', 'CANCELLED');
  CREATE TYPE "public"."enum_visa_payment_orders_currency" AS ENUM('RSD', 'USD');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'VISA_PAYMENT_ORDER_ISSUED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'VISA_PAYMENT_RECORDED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'VISA_PAYMENT_ORDER_CANCELLED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  CREATE TABLE "visa_payment_orders" (
    "id" serial PRIMARY KEY NOT NULL,
    "candidate_process_id" integer NOT NULL,
    "candidate_account_id" integer NOT NULL,
    "applicant_id" integer NOT NULL,
    "pre_application_id" integer NOT NULL,
    "program_code" "enum_visa_payment_orders_program_code" NOT NULL,
    "order_number" varchar NOT NULL,
    "order_version" numeric NOT NULL,
    "status_version" numeric DEFAULT 1 NOT NULL,
    "status" "enum_visa_payment_orders_status" NOT NULL,
    "amount_minor" numeric NOT NULL,
    "currency" "enum_visa_payment_orders_currency" NOT NULL,
    "beneficiary_name" varchar NOT NULL,
    "beneficiary_address" varchar,
    "bank_account" varchar NOT NULL,
    "payment_model" varchar,
    "payment_reference" varchar NOT NULL,
    "payment_purpose" varchar NOT NULL,
    "candidate_instructions" varchar NOT NULL,
    "due_at" timestamp(3) with time zone NOT NULL,
    "snapshot_checksum" varchar NOT NULL,
    "issued_at" timestamp(3) with time zone NOT NULL,
    "issued_by_id" integer NOT NULL,
    "paid_at" timestamp(3) with time zone,
    "payment_recorded_by_id" integer,
    "external_payment_reference" varchar,
    "payment_note" varchar,
    "cancelled_at" timestamp(3) with time zone,
    "cancelled_by_id" integer,
    "cancellation_reason" varchar,
    "idempotency_key" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "visa_payment_orders_id" integer;
  ALTER TABLE "visa_payment_orders" ADD CONSTRAINT "visa_payment_orders_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_payment_orders" ADD CONSTRAINT "visa_payment_orders_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_payment_orders" ADD CONSTRAINT "visa_payment_orders_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_payment_orders" ADD CONSTRAINT "visa_payment_orders_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_payment_orders" ADD CONSTRAINT "visa_payment_orders_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_payment_orders" ADD CONSTRAINT "visa_payment_orders_payment_recorded_by_id_users_id_fk" FOREIGN KEY ("payment_recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_payment_orders" ADD CONSTRAINT "visa_payment_orders_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "visa_payment_orders_candidate_process_idx" ON "visa_payment_orders" USING btree ("candidate_process_id");
  CREATE INDEX "visa_payment_orders_candidate_account_idx" ON "visa_payment_orders" USING btree ("candidate_account_id");
  CREATE INDEX "visa_payment_orders_applicant_idx" ON "visa_payment_orders" USING btree ("applicant_id");
  CREATE INDEX "visa_payment_orders_pre_application_idx" ON "visa_payment_orders" USING btree ("pre_application_id");
  CREATE UNIQUE INDEX "visa_payment_orders_order_number_idx" ON "visa_payment_orders" USING btree ("order_number");
  CREATE INDEX "visa_payment_orders_status_idx" ON "visa_payment_orders" USING btree ("status");
  CREATE INDEX "visa_payment_orders_issued_by_idx" ON "visa_payment_orders" USING btree ("issued_by_id");
  CREATE INDEX "visa_payment_orders_payment_recorded_by_idx" ON "visa_payment_orders" USING btree ("payment_recorded_by_id");
  CREATE INDEX "visa_payment_orders_cancelled_by_idx" ON "visa_payment_orders" USING btree ("cancelled_by_id");
  CREATE UNIQUE INDEX "visa_payment_orders_idempotency_key_idx" ON "visa_payment_orders" USING btree ("idempotency_key");
  CREATE INDEX "visa_payment_orders_updated_at_idx" ON "visa_payment_orders" USING btree ("updated_at");
  CREATE INDEX "visa_payment_orders_created_at_idx" ON "visa_payment_orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "candidateProcess_orderVersion_idx" ON "visa_payment_orders" USING btree ("candidate_process_id","order_version");
  CREATE INDEX "candidateAccount_status_3_idx" ON "visa_payment_orders" USING btree ("candidate_account_id","status");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_visa_payment_orders_fk" FOREIGN KEY ("visa_payment_orders_id") REFERENCES "public"."visa_payment_orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_visa_payment_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("visa_payment_orders_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_visa_payment_orders_fk";
  DROP INDEX "payload_locked_documents_rels_visa_payment_orders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "visa_payment_orders_id";
  ALTER TABLE "visa_payment_orders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "visa_payment_orders";

  DELETE FROM "audit_events"
  WHERE "event_type" IN ('VISA_PAYMENT_ORDER_ISSUED', 'VISA_PAYMENT_RECORDED', 'VISA_PAYMENT_ORDER_CANCELLED');

  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'INTERVIEW_PREPARATION_SCHEDULED', 'INTERVIEW_PREPARATION_RESCHEDULED', 'INTERVIEW_PREPARATION_CANCELLED', 'INTERVIEW_PREPARATION_COMPLETED', 'INTERVIEW_PREPARATION_NO_SHOW', 'JOB_SHORTLIST_SENT', 'JOB_SHORTLIST_NOTIFICATION_SENT', 'JOB_OPTION_PREFERENCE_UPDATED', 'JOB_OPTION_WITHDRAWN', 'EMPLOYMENT_OFFER_PUBLISHED', 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', 'EMPLOYMENT_OFFER_WITHDRAWN', 'EMPLOYMENT_OFFER_ACCEPTED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  DROP TYPE "public"."enum_visa_payment_orders_program_code";
  DROP TYPE "public"."enum_visa_payment_orders_status";
  DROP TYPE "public"."enum_visa_payment_orders_currency";`)
}
