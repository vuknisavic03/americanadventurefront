import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_flight_ticket_payment_orders_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_flight_ticket_payment_orders_status" AS ENUM('ISSUED', 'PAID', 'CANCELLED');
  CREATE TYPE "public"."enum_flight_ticket_payment_orders_original_currency" AS ENUM('EUR', 'RSD', 'USD');
  CREATE TYPE "public"."enum_flight_ticket_payment_orders_settlement_currency" AS ENUM('RSD');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_PAYMENT_ORDER_ISSUED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_PAYMENT_RECORDED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_PAYMENT_ORDER_CANCELLED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  CREATE TABLE "flight_ticket_payment_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_process_id" integer NOT NULL,
	"candidate_account_id" integer NOT NULL,
	"applicant_id" integer NOT NULL,
	"pre_application_id" integer NOT NULL,
	"flight_ticket_offer_id" integer NOT NULL,
	"flight_ticket_offer_response_id" integer NOT NULL,
	"program_code" "enum_flight_ticket_payment_orders_program_code" NOT NULL,
	"order_number" varchar NOT NULL,
	"order_version" numeric NOT NULL,
	"status_version" numeric DEFAULT 1 NOT NULL,
	"status" "enum_flight_ticket_payment_orders_status" NOT NULL,
	"selected_option_code" varchar NOT NULL,
	"airline_name" varchar NOT NULL,
	"outbound_route" varchar NOT NULL,
	"outbound_departure_at" timestamp(3) with time zone NOT NULL,
	"return_route" varchar NOT NULL,
	"return_departure_at" timestamp(3) with time zone NOT NULL,
	"original_amount_minor" numeric NOT NULL,
	"original_currency" "enum_flight_ticket_payment_orders_original_currency" NOT NULL,
	"settlement_amount_minor" numeric NOT NULL,
	"settlement_currency" "enum_flight_ticket_payment_orders_settlement_currency" NOT NULL,
	"exchange_rate_scaled" numeric NOT NULL,
	"exchange_rate_date" timestamp(3) with time zone NOT NULL,
	"exchange_rate_source" varchar NOT NULL,
	"exchange_rate_reference" varchar,
	"beneficiary_name" varchar NOT NULL,
	"beneficiary_address" varchar NOT NULL,
	"beneficiary_tax_id" varchar,
	"beneficiary_registration_number" varchar,
	"bank_account" varchar NOT NULL,
	"payment_model" varchar,
	"payment_reference" varchar NOT NULL,
	"payment_purpose" varchar NOT NULL,
	"candidate_instructions" varchar NOT NULL,
	"include_advance_invoice" boolean DEFAULT false,
	"advance_invoice_number" varchar,
	"candidate_name_snapshot" varchar NOT NULL,
	"candidate_address_snapshot" varchar NOT NULL,
	"due_at" timestamp(3) with time zone NOT NULL,
	"snapshot_checksum" varchar NOT NULL,
	"pdf_sha256" varchar NOT NULL,
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

  DROP INDEX "candidateProcess_orderVersion_idx";
  DROP INDEX "candidateAccount_status_4_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "flight_ticket_payment_orders_id" integer;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_flight_ticket_offer_id_flight_ticket_offers_id_fk" FOREIGN KEY ("flight_ticket_offer_id") REFERENCES "public"."flight_ticket_offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_flight_ticket_offer_response_id_flight_ticket_offer_responses_id_fk" FOREIGN KEY ("flight_ticket_offer_response_id") REFERENCES "public"."flight_ticket_offer_responses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_payment_recorded_by_id_users_id_fk" FOREIGN KEY ("payment_recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_payment_orders" ADD CONSTRAINT "flight_ticket_payment_orders_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "flight_ticket_payment_orders_candidate_process_idx" ON "flight_ticket_payment_orders" USING btree ("candidate_process_id");
  CREATE INDEX "flight_ticket_payment_orders_candidate_account_idx" ON "flight_ticket_payment_orders" USING btree ("candidate_account_id");
  CREATE INDEX "flight_ticket_payment_orders_applicant_idx" ON "flight_ticket_payment_orders" USING btree ("applicant_id");
  CREATE INDEX "flight_ticket_payment_orders_pre_application_idx" ON "flight_ticket_payment_orders" USING btree ("pre_application_id");
  CREATE INDEX "flight_ticket_payment_orders_flight_ticket_offer_idx" ON "flight_ticket_payment_orders" USING btree ("flight_ticket_offer_id");
  CREATE INDEX "flight_ticket_payment_orders_flight_ticket_offer_respons_idx" ON "flight_ticket_payment_orders" USING btree ("flight_ticket_offer_response_id");
  CREATE UNIQUE INDEX "flight_ticket_payment_orders_order_number_idx" ON "flight_ticket_payment_orders" USING btree ("order_number");
  CREATE INDEX "flight_ticket_payment_orders_status_idx" ON "flight_ticket_payment_orders" USING btree ("status");
  CREATE INDEX "flight_ticket_payment_orders_issued_by_idx" ON "flight_ticket_payment_orders" USING btree ("issued_by_id");
  CREATE INDEX "flight_ticket_payment_orders_payment_recorded_by_idx" ON "flight_ticket_payment_orders" USING btree ("payment_recorded_by_id");
  CREATE INDEX "flight_ticket_payment_orders_cancelled_by_idx" ON "flight_ticket_payment_orders" USING btree ("cancelled_by_id");
  CREATE UNIQUE INDEX "flight_ticket_payment_orders_idempotency_key_idx" ON "flight_ticket_payment_orders" USING btree ("idempotency_key");
  CREATE INDEX "flight_ticket_payment_orders_updated_at_idx" ON "flight_ticket_payment_orders" USING btree ("updated_at");
  CREATE INDEX "flight_ticket_payment_orders_created_at_idx" ON "flight_ticket_payment_orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "candidateProcess_orderVersion_idx" ON "flight_ticket_payment_orders" USING btree ("candidate_process_id","order_version");
  CREATE INDEX "candidateAccount_status_4_idx" ON "flight_ticket_payment_orders" USING btree ("candidate_account_id","status");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flight_ticket_payment_order_fk" FOREIGN KEY ("flight_ticket_payment_orders_id") REFERENCES "public"."flight_ticket_payment_orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "candidateProcess_orderVersion_1_idx" ON "visa_payment_orders" USING btree ("candidate_process_id","order_version");
  CREATE INDEX "candidateAccount_status_5_idx" ON "visa_payment_orders" USING btree ("candidate_account_id","status");
  CREATE INDEX "payload_locked_documents_rels_flight_ticket_payment_orde_idx" ON "payload_locked_documents_rels" USING btree ("flight_ticket_payment_orders_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flight_ticket_payment_orders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "flight_ticket_payment_orders" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_flight_ticket_payment_order_fk";

  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'INTERVIEW_PREPARATION_SCHEDULED', 'INTERVIEW_PREPARATION_RESCHEDULED', 'INTERVIEW_PREPARATION_CANCELLED', 'INTERVIEW_PREPARATION_COMPLETED', 'INTERVIEW_PREPARATION_NO_SHOW', 'JOB_SHORTLIST_SENT', 'JOB_SHORTLIST_NOTIFICATION_SENT', 'JOB_OPTION_PREFERENCE_UPDATED', 'JOB_OPTION_WITHDRAWN', 'EMPLOYMENT_OFFER_PUBLISHED', 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', 'EMPLOYMENT_OFFER_WITHDRAWN', 'EMPLOYMENT_OFFER_ACCEPTED', 'VISA_PAYMENT_ORDER_ISSUED', 'VISA_QUESTIONNAIRE_UPDATED', 'VISA_PAYMENT_RECORDED', 'VISA_PAYMENT_ORDER_CANCELLED', 'PASSPORT_AUTHORIZATION_TEMPLATE_DRAFTED', 'PASSPORT_AUTHORIZATION_TEMPLATE_ACTIVATED', 'PASSPORT_AUTHORIZATION_TEMPLATE_RETIRED', 'PASSPORT_AUTHORIZATION_GENERATED', 'PASSPORT_AUTHORIZATION_ACCEPTED', 'PASSPORT_AUTHORIZATION_ACCESSED', 'EMBASSY_APPOINTMENT_SCHEDULED', 'EMBASSY_APPOINTMENT_RESCHEDULED', 'EMBASSY_APPOINTMENT_CANCELLED', 'EMBASSY_REMINDER_EMAIL_SENT', 'EMBASSY_REMINDER_SMS_SENT', 'EMBASSY_REMINDER_SKIPPED', 'FLIGHT_TICKET_REQUEST_SUBMITTED', 'FLIGHT_TICKET_REQUEST_UPDATED', 'FLIGHT_TICKET_REQUEST_NOTIFICATION_SENT', 'FLIGHT_TICKET_OFFER_PUBLISHED', 'FLIGHT_TICKET_OFFER_NOTIFICATION_SENT', 'FLIGHT_TICKET_OFFER_WITHDRAWN', 'FLIGHT_TICKET_OFFER_ACCEPTED', 'FLIGHT_TICKET_OFFER_REJECTED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  DROP INDEX "candidateProcess_orderVersion_1_idx";
  DROP INDEX "candidateAccount_status_5_idx";
  DROP INDEX "payload_locked_documents_rels_flight_ticket_payment_orde_idx";
  CREATE UNIQUE INDEX "candidateProcess_orderVersion_idx" ON "visa_payment_orders" USING btree ("candidate_process_id","order_version");
  CREATE INDEX "candidateAccount_status_4_idx" ON "visa_payment_orders" USING btree ("candidate_account_id","status");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "flight_ticket_payment_orders_id";
  DROP TYPE "public"."enum_flight_ticket_payment_orders_program_code";
  DROP TYPE "public"."enum_flight_ticket_payment_orders_status";
  DROP TYPE "public"."enum_flight_ticket_payment_orders_original_currency";
  DROP TYPE "public"."enum_flight_ticket_payment_orders_settlement_currency";`)
}
