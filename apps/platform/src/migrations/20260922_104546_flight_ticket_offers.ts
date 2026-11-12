import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_flight_ticket_offers_options_currency" AS ENUM('EUR', 'RSD', 'USD');
  CREATE TYPE "public"."enum_flight_ticket_offers_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_flight_ticket_offers_status" AS ENUM('PUBLISHED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
  CREATE TYPE "public"."enum_flight_ticket_offers_notification_status" AS ENUM('PENDING', 'DELIVERED', 'SKIPPED', 'FAILED');
  CREATE TYPE "public"."enum_flight_ticket_offer_responses_action" AS ENUM('ACCEPT', 'REJECT');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_OFFER_PUBLISHED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_OFFER_NOTIFICATION_SENT' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_OFFER_WITHDRAWN' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_OFFER_ACCEPTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'FLIGHT_TICKET_OFFER_REJECTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_outbox_events_event_type" ADD VALUE 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED';
  ALTER TYPE "public"."enum_message_deliveries_category" ADD VALUE 'FLIGHT_TICKET_OFFER';
  CREATE TABLE "flight_ticket_offers_options" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"option_code" varchar NOT NULL,
	"airline_name" varchar NOT NULL,
	"outbound_route" varchar NOT NULL,
	"outbound_departure_at" timestamp(3) with time zone NOT NULL,
	"outbound_arrival_at" timestamp(3) with time zone NOT NULL,
	"return_route" varchar NOT NULL,
	"return_departure_at" timestamp(3) with time zone NOT NULL,
	"return_arrival_at" timestamp(3) with time zone NOT NULL,
	"baggage_description" varchar NOT NULL,
	"fare_conditions" varchar,
	"total_price_minor" numeric NOT NULL,
	"currency" "enum_flight_ticket_offers_options_currency" NOT NULL
  );

  CREATE TABLE "flight_ticket_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"flight_ticket_request_id" integer NOT NULL,
	"candidate_process_id" integer NOT NULL,
	"candidate_account_id" integer NOT NULL,
	"applicant_id" integer NOT NULL,
	"pre_application_id" integer NOT NULL,
	"program_code" "enum_flight_ticket_offers_program_code" NOT NULL,
	"request_version" numeric NOT NULL,
	"offer_version" numeric NOT NULL,
	"status_version" numeric DEFAULT 1 NOT NULL,
	"status" "enum_flight_ticket_offers_status" NOT NULL,
	"candidate_instructions" varchar NOT NULL,
	"internal_notes" varchar,
	"response_due_at" timestamp(3) with time zone,
	"snapshot_checksum" varchar NOT NULL,
	"published_at" timestamp(3) with time zone NOT NULL,
	"published_by_id" integer NOT NULL,
	"notification_status" "enum_flight_ticket_offers_notification_status" NOT NULL,
	"notification_delivered_at" timestamp(3) with time zone,
	"message_delivery_id" integer,
	"responded_at" timestamp(3) with time zone,
	"withdrawn_at" timestamp(3) with time zone,
	"withdrawn_by_id" integer,
	"withdrawal_reason" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "flight_ticket_offer_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"flight_ticket_offer_id" integer NOT NULL,
	"candidate_account_id" integer NOT NULL,
	"candidate_process_id" integer NOT NULL,
	"pre_application_id" integer NOT NULL,
	"response_reference" varchar NOT NULL,
	"action" "enum_flight_ticket_offer_responses_action" NOT NULL,
	"selected_option_code" varchar,
	"rejection_reason" varchar,
	"responded_at" timestamp(3) with time zone NOT NULL,
	"statement_version" varchar NOT NULL,
	"statement_text" varchar NOT NULL,
	"statement_checksum" varchar NOT NULL,
	"offer_snapshot_checksum" varchar NOT NULL,
	"evidence_checksum" varchar NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  DROP INDEX "candidateAccount_status_3_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "flight_ticket_offers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "flight_ticket_offer_responses_id" integer;
  ALTER TABLE "flight_ticket_offers_options" ADD CONSTRAINT "flight_ticket_offers_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."flight_ticket_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_flight_ticket_request_id_flight_ticket_requests_id_fk" FOREIGN KEY ("flight_ticket_request_id") REFERENCES "public"."flight_ticket_requests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_message_delivery_id_message_deliveries_id_fk" FOREIGN KEY ("message_delivery_id") REFERENCES "public"."message_deliveries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offers" ADD CONSTRAINT "flight_ticket_offers_withdrawn_by_id_users_id_fk" FOREIGN KEY ("withdrawn_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offer_responses" ADD CONSTRAINT "flight_ticket_offer_responses_flight_ticket_offer_id_flight_ticket_offers_id_fk" FOREIGN KEY ("flight_ticket_offer_id") REFERENCES "public"."flight_ticket_offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offer_responses" ADD CONSTRAINT "flight_ticket_offer_responses_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offer_responses" ADD CONSTRAINT "flight_ticket_offer_responses_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "flight_ticket_offer_responses" ADD CONSTRAINT "flight_ticket_offer_responses_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "flight_ticket_offers_options_order_idx" ON "flight_ticket_offers_options" USING btree ("_order");
  CREATE INDEX "flight_ticket_offers_options_parent_id_idx" ON "flight_ticket_offers_options" USING btree ("_parent_id");
  CREATE INDEX "flight_ticket_offers_flight_ticket_request_idx" ON "flight_ticket_offers" USING btree ("flight_ticket_request_id");
  CREATE INDEX "flight_ticket_offers_candidate_process_idx" ON "flight_ticket_offers" USING btree ("candidate_process_id");
  CREATE INDEX "flight_ticket_offers_candidate_account_idx" ON "flight_ticket_offers" USING btree ("candidate_account_id");
  CREATE INDEX "flight_ticket_offers_applicant_idx" ON "flight_ticket_offers" USING btree ("applicant_id");
  CREATE INDEX "flight_ticket_offers_pre_application_idx" ON "flight_ticket_offers" USING btree ("pre_application_id");
  CREATE INDEX "flight_ticket_offers_published_by_idx" ON "flight_ticket_offers" USING btree ("published_by_id");
  CREATE INDEX "flight_ticket_offers_message_delivery_idx" ON "flight_ticket_offers" USING btree ("message_delivery_id");
  CREATE INDEX "flight_ticket_offers_withdrawn_by_idx" ON "flight_ticket_offers" USING btree ("withdrawn_by_id");
  CREATE INDEX "flight_ticket_offers_updated_at_idx" ON "flight_ticket_offers" USING btree ("updated_at");
  CREATE INDEX "flight_ticket_offers_created_at_idx" ON "flight_ticket_offers" USING btree ("created_at");
  CREATE UNIQUE INDEX "candidateProcess_offerVersion_1_idx" ON "flight_ticket_offers" USING btree ("candidate_process_id","offer_version");
  CREATE INDEX "candidateAccount_status_3_idx" ON "flight_ticket_offers" USING btree ("candidate_account_id","status");
  CREATE UNIQUE INDEX "flight_ticket_offer_responses_flight_ticket_offer_idx" ON "flight_ticket_offer_responses" USING btree ("flight_ticket_offer_id");
  CREATE INDEX "flight_ticket_offer_responses_candidate_account_idx" ON "flight_ticket_offer_responses" USING btree ("candidate_account_id");
  CREATE INDEX "flight_ticket_offer_responses_candidate_process_idx" ON "flight_ticket_offer_responses" USING btree ("candidate_process_id");
  CREATE INDEX "flight_ticket_offer_responses_pre_application_idx" ON "flight_ticket_offer_responses" USING btree ("pre_application_id");
  CREATE UNIQUE INDEX "flight_ticket_offer_responses_response_reference_idx" ON "flight_ticket_offer_responses" USING btree ("response_reference");
  CREATE INDEX "flight_ticket_offer_responses_updated_at_idx" ON "flight_ticket_offer_responses" USING btree ("updated_at");
  CREATE INDEX "flight_ticket_offer_responses_created_at_idx" ON "flight_ticket_offer_responses" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flight_ticket_offers_fk" FOREIGN KEY ("flight_ticket_offers_id") REFERENCES "public"."flight_ticket_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flight_ticket_offer_respons_fk" FOREIGN KEY ("flight_ticket_offer_responses_id") REFERENCES "public"."flight_ticket_offer_responses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "candidateAccount_status_4_idx" ON "visa_payment_orders" USING btree ("candidate_account_id","status");
  CREATE INDEX "payload_locked_documents_rels_flight_ticket_offers_id_idx" ON "payload_locked_documents_rels" USING btree ("flight_ticket_offers_id");
  CREATE INDEX "payload_locked_documents_rels_flight_ticket_offer_respon_idx" ON "payload_locked_documents_rels" USING btree ("flight_ticket_offer_responses_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_flight_ticket_offers_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_flight_ticket_offer_respons_fk";
  ALTER TABLE "flight_ticket_offers_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "flight_ticket_offers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "flight_ticket_offer_responses" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "flight_ticket_offers_options" CASCADE;
  DROP TABLE "flight_ticket_offers" CASCADE;
  DROP TABLE "flight_ticket_offer_responses" CASCADE;
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'INTERVIEW_PREPARATION_SCHEDULED', 'INTERVIEW_PREPARATION_RESCHEDULED', 'INTERVIEW_PREPARATION_CANCELLED', 'INTERVIEW_PREPARATION_COMPLETED', 'INTERVIEW_PREPARATION_NO_SHOW', 'JOB_SHORTLIST_SENT', 'JOB_SHORTLIST_NOTIFICATION_SENT', 'JOB_OPTION_PREFERENCE_UPDATED', 'JOB_OPTION_WITHDRAWN', 'EMPLOYMENT_OFFER_PUBLISHED', 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', 'EMPLOYMENT_OFFER_WITHDRAWN', 'EMPLOYMENT_OFFER_ACCEPTED', 'VISA_PAYMENT_ORDER_ISSUED', 'VISA_QUESTIONNAIRE_UPDATED', 'VISA_PAYMENT_RECORDED', 'VISA_PAYMENT_ORDER_CANCELLED', 'PASSPORT_AUTHORIZATION_TEMPLATE_DRAFTED', 'PASSPORT_AUTHORIZATION_TEMPLATE_ACTIVATED', 'PASSPORT_AUTHORIZATION_TEMPLATE_RETIRED', 'PASSPORT_AUTHORIZATION_GENERATED', 'PASSPORT_AUTHORIZATION_ACCEPTED', 'PASSPORT_AUTHORIZATION_ACCESSED', 'EMBASSY_APPOINTMENT_SCHEDULED', 'EMBASSY_APPOINTMENT_RESCHEDULED', 'EMBASSY_APPOINTMENT_CANCELLED', 'EMBASSY_REMINDER_EMAIL_SENT', 'EMBASSY_REMINDER_SMS_SENT', 'EMBASSY_REMINDER_SKIPPED', 'FLIGHT_TICKET_REQUEST_SUBMITTED', 'FLIGHT_TICKET_REQUEST_UPDATED', 'FLIGHT_TICKET_REQUEST_NOTIFICATION_SENT', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_outbox_events_event_type";
  CREATE TYPE "public"."enum_outbox_events_event_type" AS ENUM('MATERIAL_DELIVERY_REQUESTED', 'CONSULTATION_INVITATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED', 'JOB_SHORTLIST_NOTIFICATION_REQUESTED', 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED');
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_outbox_events_event_type" USING "event_type"::"public"."enum_outbox_events_event_type";
  ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_message_deliveries_category";
  CREATE TYPE "public"."enum_message_deliveries_category" AS ENUM('MATERIAL_BUNDLE', 'CONSULTATION_INVITATION', 'ACCOUNT_ACTIVATION', 'EMPLOYMENT_OFFER', 'JOB_SHORTLIST', 'FLIGHT_TICKET_REQUEST');
  ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE "public"."enum_message_deliveries_category" USING "category"::"public"."enum_message_deliveries_category";
  DROP INDEX "candidateAccount_status_4_idx";
  DROP INDEX "payload_locked_documents_rels_flight_ticket_offers_id_idx";
  DROP INDEX "payload_locked_documents_rels_flight_ticket_offer_respon_idx";
  CREATE INDEX "candidateAccount_status_3_idx" ON "visa_payment_orders" USING btree ("candidate_account_id","status");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "flight_ticket_offers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "flight_ticket_offer_responses_id";
  DROP TYPE "public"."enum_flight_ticket_offers_options_currency";
  DROP TYPE "public"."enum_flight_ticket_offers_program_code";
  DROP TYPE "public"."enum_flight_ticket_offers_status";
  DROP TYPE "public"."enum_flight_ticket_offers_notification_status";
  DROP TYPE "public"."enum_flight_ticket_offer_responses_action";`)
}
