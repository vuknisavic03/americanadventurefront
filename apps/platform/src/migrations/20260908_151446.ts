import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_job_openings_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_job_openings_status" AS ENUM('DRAFT', 'OPEN', 'PAUSED', 'CLOSED');
  CREATE TYPE "public"."enum_job_openings_job_category" AS ENUM('HOSPITALITY', 'FOOD_SERVICE', 'RETAIL', 'LIFEGUARD', 'HOUSEKEEPING', 'RECREATION', 'OTHER');
  CREATE TYPE "public"."enum_candidate_job_shortlists_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_candidate_job_shortlists_status" AS ENUM('OPEN', 'COMPLETED');
  CREATE TYPE "public"."enum_candidate_job_shortlists_notification_status" AS ENUM('PENDING', 'DELIVERED', 'FAILED');
  CREATE TYPE "public"."enum_candidate_job_options_status" AS ENUM('AVAILABLE', 'INTERESTED', 'NOT_INTERESTED', 'EMPLOYER_CONFIRMED', 'SELECTED', 'NOT_SELECTED', 'WITHDRAWN');
  CREATE TYPE "public"."enum_candidate_job_options_job_category" AS ENUM('HOSPITALITY', 'FOOD_SERVICE', 'RETAIL', 'LIFEGUARD', 'HOUSEKEEPING', 'RECREATION', 'OTHER');
  CREATE TYPE "public"."enum_candidate_job_options_currency" AS ENUM('USD');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'JOB_SHORTLIST_SENT' BEFORE 'EMPLOYMENT_OFFER_PUBLISHED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'JOB_SHORTLIST_NOTIFICATION_SENT' BEFORE 'EMPLOYMENT_OFFER_PUBLISHED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'JOB_OPTION_PREFERENCE_UPDATED' BEFORE 'EMPLOYMENT_OFFER_PUBLISHED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'JOB_OPTION_WITHDRAWN' BEFORE 'EMPLOYMENT_OFFER_PUBLISHED';
  ALTER TYPE "public"."enum_outbox_events_event_type" ADD VALUE 'JOB_SHORTLIST_NOTIFICATION_REQUESTED';
  ALTER TYPE "public"."enum_message_deliveries_category" ADD VALUE 'JOB_SHORTLIST';
  CREATE TABLE "job_openings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"opening_code" varchar NOT NULL,
  	"campaign_code" varchar NOT NULL,
  	"program_code" "enum_job_openings_program_code" DEFAULT 'SWT' NOT NULL,
  	"status" "enum_job_openings_status" DEFAULT 'DRAFT' NOT NULL,
  	"employer_name" varchar NOT NULL,
  	"job_title" varchar NOT NULL,
  	"job_category" "enum_job_openings_job_category" NOT NULL,
  	"work_city" varchar NOT NULL,
  	"work_state" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"hourly_wage_cents" numeric NOT NULL,
  	"expected_weekly_hours" numeric NOT NULL,
  	"housing_provided" boolean DEFAULT false NOT NULL,
  	"housing_cost_cents" numeric,
  	"housing_description" varchar,
  	"candidate_instructions" varchar NOT NULL,
  	"eligibility_notes" varchar,
  	"available_positions" numeric,
  	"revision" numeric DEFAULT 1 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "candidate_job_shortlists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_process_id" integer NOT NULL,
  	"candidate_account_id" integer NOT NULL,
  	"applicant_id" integer NOT NULL,
  	"pre_application_id" integer NOT NULL,
  	"program_code" "enum_candidate_job_shortlists_program_code" NOT NULL,
  	"shortlist_reference" varchar NOT NULL,
  	"shortlist_version" numeric NOT NULL,
  	"option_count" numeric NOT NULL,
  	"status" "enum_candidate_job_shortlists_status" NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"sent_by_id" integer NOT NULL,
  	"notification_status" "enum_candidate_job_shortlists_notification_status" NOT NULL,
  	"notification_delivered_at" timestamp(3) with time zone,
  	"message_delivery_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "candidate_job_options" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"shortlist_id" integer NOT NULL,
  	"job_opening_id" integer NOT NULL,
  	"candidate_process_id" integer NOT NULL,
  	"candidate_account_id" integer NOT NULL,
  	"pre_application_id" integer NOT NULL,
  	"status" "enum_candidate_job_options_status" NOT NULL,
  	"status_version" numeric DEFAULT 1 NOT NULL,
  	"opening_code" varchar NOT NULL,
  	"opening_revision" numeric NOT NULL,
  	"employer_name" varchar NOT NULL,
  	"job_title" varchar NOT NULL,
  	"job_category" "enum_candidate_job_options_job_category" NOT NULL,
  	"work_city" varchar NOT NULL,
  	"work_state" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"hourly_wage_cents" numeric NOT NULL,
  	"currency" "enum_candidate_job_options_currency" NOT NULL,
  	"expected_weekly_hours" numeric NOT NULL,
  	"housing_provided" boolean DEFAULT false NOT NULL,
  	"housing_cost_cents" numeric,
  	"housing_description" varchar,
  	"candidate_instructions" varchar NOT NULL,
  	"snapshot_checksum" varchar NOT NULL,
  	"assigned_at" timestamp(3) with time zone NOT NULL,
  	"assigned_by_id" integer NOT NULL,
  	"candidate_preference_updated_at" timestamp(3) with time zone,
  	"withdrawn_at" timestamp(3) with time zone,
  	"withdrawn_by_id" integer,
  	"withdrawal_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DROP INDEX "candidateAccount_status_idx";
  ALTER TABLE "employment_offers" ADD COLUMN "candidate_job_option_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "job_openings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_job_shortlists_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_job_options_id" integer;
  ALTER TABLE "candidate_job_shortlists" ADD CONSTRAINT "candidate_job_shortlists_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_shortlists" ADD CONSTRAINT "candidate_job_shortlists_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_shortlists" ADD CONSTRAINT "candidate_job_shortlists_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_shortlists" ADD CONSTRAINT "candidate_job_shortlists_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_shortlists" ADD CONSTRAINT "candidate_job_shortlists_sent_by_id_users_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_shortlists" ADD CONSTRAINT "candidate_job_shortlists_message_delivery_id_message_deliveries_id_fk" FOREIGN KEY ("message_delivery_id") REFERENCES "public"."message_deliveries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_options" ADD CONSTRAINT "candidate_job_options_shortlist_id_candidate_job_shortlists_id_fk" FOREIGN KEY ("shortlist_id") REFERENCES "public"."candidate_job_shortlists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_options" ADD CONSTRAINT "candidate_job_options_job_opening_id_job_openings_id_fk" FOREIGN KEY ("job_opening_id") REFERENCES "public"."job_openings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_options" ADD CONSTRAINT "candidate_job_options_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_options" ADD CONSTRAINT "candidate_job_options_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_options" ADD CONSTRAINT "candidate_job_options_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_options" ADD CONSTRAINT "candidate_job_options_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_job_options" ADD CONSTRAINT "candidate_job_options_withdrawn_by_id_users_id_fk" FOREIGN KEY ("withdrawn_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "job_openings_opening_code_idx" ON "job_openings" USING btree ("opening_code");
  CREATE INDEX "job_openings_campaign_code_idx" ON "job_openings" USING btree ("campaign_code");
  CREATE INDEX "job_openings_status_idx" ON "job_openings" USING btree ("status");
  CREATE INDEX "job_openings_job_category_idx" ON "job_openings" USING btree ("job_category");
  CREATE INDEX "job_openings_work_city_idx" ON "job_openings" USING btree ("work_city");
  CREATE INDEX "job_openings_work_state_idx" ON "job_openings" USING btree ("work_state");
  CREATE INDEX "job_openings_updated_at_idx" ON "job_openings" USING btree ("updated_at");
  CREATE INDEX "job_openings_created_at_idx" ON "job_openings" USING btree ("created_at");
  CREATE INDEX "campaignCode_status_idx" ON "job_openings" USING btree ("campaign_code","status");
  CREATE INDEX "workState_workCity_jobCategory_idx" ON "job_openings" USING btree ("work_state","work_city","job_category");
  CREATE INDEX "candidate_job_shortlists_candidate_process_idx" ON "candidate_job_shortlists" USING btree ("candidate_process_id");
  CREATE INDEX "candidate_job_shortlists_candidate_account_idx" ON "candidate_job_shortlists" USING btree ("candidate_account_id");
  CREATE INDEX "candidate_job_shortlists_applicant_idx" ON "candidate_job_shortlists" USING btree ("applicant_id");
  CREATE INDEX "candidate_job_shortlists_pre_application_idx" ON "candidate_job_shortlists" USING btree ("pre_application_id");
  CREATE UNIQUE INDEX "candidate_job_shortlists_shortlist_reference_idx" ON "candidate_job_shortlists" USING btree ("shortlist_reference");
  CREATE INDEX "candidate_job_shortlists_sent_by_idx" ON "candidate_job_shortlists" USING btree ("sent_by_id");
  CREATE INDEX "candidate_job_shortlists_message_delivery_idx" ON "candidate_job_shortlists" USING btree ("message_delivery_id");
  CREATE INDEX "candidate_job_shortlists_updated_at_idx" ON "candidate_job_shortlists" USING btree ("updated_at");
  CREATE INDEX "candidate_job_shortlists_created_at_idx" ON "candidate_job_shortlists" USING btree ("created_at");
  CREATE UNIQUE INDEX "candidateProcess_shortlistVersion_idx" ON "candidate_job_shortlists" USING btree ("candidate_process_id","shortlist_version");
  CREATE INDEX "candidateAccount_status_idx" ON "candidate_job_shortlists" USING btree ("candidate_account_id","status");
  CREATE INDEX "candidate_job_options_shortlist_idx" ON "candidate_job_options" USING btree ("shortlist_id");
  CREATE INDEX "candidate_job_options_job_opening_idx" ON "candidate_job_options" USING btree ("job_opening_id");
  CREATE INDEX "candidate_job_options_candidate_process_idx" ON "candidate_job_options" USING btree ("candidate_process_id");
  CREATE INDEX "candidate_job_options_candidate_account_idx" ON "candidate_job_options" USING btree ("candidate_account_id");
  CREATE INDEX "candidate_job_options_pre_application_idx" ON "candidate_job_options" USING btree ("pre_application_id");
  CREATE INDEX "candidate_job_options_assigned_by_idx" ON "candidate_job_options" USING btree ("assigned_by_id");
  CREATE INDEX "candidate_job_options_withdrawn_by_idx" ON "candidate_job_options" USING btree ("withdrawn_by_id");
  CREATE INDEX "candidate_job_options_updated_at_idx" ON "candidate_job_options" USING btree ("updated_at");
  CREATE INDEX "candidate_job_options_created_at_idx" ON "candidate_job_options" USING btree ("created_at");
  CREATE UNIQUE INDEX "candidateProcess_jobOpening_idx" ON "candidate_job_options" USING btree ("candidate_process_id","job_opening_id");
  CREATE INDEX "candidateAccount_status_1_idx" ON "candidate_job_options" USING btree ("candidate_account_id","status");
  CREATE INDEX "shortlist_status_idx" ON "candidate_job_options" USING btree ("shortlist_id","status");
  ALTER TABLE "employment_offers" ADD CONSTRAINT "employment_offers_candidate_job_option_id_candidate_job_options_id_fk" FOREIGN KEY ("candidate_job_option_id") REFERENCES "public"."candidate_job_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_openings_fk" FOREIGN KEY ("job_openings_id") REFERENCES "public"."job_openings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_job_shortlists_fk" FOREIGN KEY ("candidate_job_shortlists_id") REFERENCES "public"."candidate_job_shortlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_job_options_fk" FOREIGN KEY ("candidate_job_options_id") REFERENCES "public"."candidate_job_options"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "employment_offers_candidate_job_option_idx" ON "employment_offers" USING btree ("candidate_job_option_id");
  CREATE INDEX "candidateAccount_status_2_idx" ON "employment_offers" USING btree ("candidate_account_id","status");
  CREATE INDEX "payload_locked_documents_rels_job_openings_id_idx" ON "payload_locked_documents_rels" USING btree ("job_openings_id");
  CREATE INDEX "payload_locked_documents_rels_candidate_job_shortlists_i_idx" ON "payload_locked_documents_rels" USING btree ("candidate_job_shortlists_id");
  CREATE INDEX "payload_locked_documents_rels_candidate_job_options_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_job_options_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "employment_offers" DROP CONSTRAINT "employment_offers_candidate_job_option_id_candidate_job_options_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_job_openings_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_job_shortlists_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_job_options_fk";
  DROP INDEX "employment_offers_candidate_job_option_idx";
  DROP INDEX "candidateAccount_status_2_idx";
  DROP INDEX "payload_locked_documents_rels_job_openings_id_idx";
  DROP INDEX "payload_locked_documents_rels_candidate_job_shortlists_i_idx";
  DROP INDEX "payload_locked_documents_rels_candidate_job_options_id_idx";
  ALTER TABLE "employment_offers" DROP COLUMN "candidate_job_option_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "job_openings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_job_shortlists_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_job_options_id";
  ALTER TABLE "job_openings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_job_shortlists" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_job_options" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "job_openings" CASCADE;
  DROP TABLE "candidate_job_shortlists" CASCADE;
  DROP TABLE "candidate_job_options" CASCADE;
  DELETE FROM "audit_events" WHERE "event_type" IN ('JOB_SHORTLIST_SENT', 'JOB_SHORTLIST_NOTIFICATION_SENT', 'JOB_OPTION_PREFERENCE_UPDATED', 'JOB_OPTION_WITHDRAWN');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED', 'INTERVIEW_PREPARATION_SCHEDULED', 'INTERVIEW_PREPARATION_RESCHEDULED', 'INTERVIEW_PREPARATION_CANCELLED', 'INTERVIEW_PREPARATION_COMPLETED', 'INTERVIEW_PREPARATION_NO_SHOW', 'EMPLOYMENT_OFFER_PUBLISHED', 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', 'EMPLOYMENT_OFFER_WITHDRAWN', 'EMPLOYMENT_OFFER_ACCEPTED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  DELETE FROM "outbox_events" WHERE "event_type" = 'JOB_SHORTLIST_NOTIFICATION_REQUESTED';
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_outbox_events_event_type";
  CREATE TYPE "public"."enum_outbox_events_event_type" AS ENUM('MATERIAL_DELIVERY_REQUESTED', 'CONSULTATION_INVITATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED');
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_outbox_events_event_type" USING "event_type"::"public"."enum_outbox_events_event_type";
  DELETE FROM "message_deliveries" WHERE "category" = 'JOB_SHORTLIST';
  ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_message_deliveries_category";
  CREATE TYPE "public"."enum_message_deliveries_category" AS ENUM('MATERIAL_BUNDLE', 'CONSULTATION_INVITATION', 'ACCOUNT_ACTIVATION', 'EMPLOYMENT_OFFER');
  ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE "public"."enum_message_deliveries_category" USING "category"::"public"."enum_message_deliveries_category";
  CREATE INDEX "candidateAccount_status_idx" ON "employment_offers" USING btree ("candidate_account_id","status");
  DROP TYPE "public"."enum_job_openings_program_code";
  DROP TYPE "public"."enum_job_openings_status";
  DROP TYPE "public"."enum_job_openings_job_category";
  DROP TYPE "public"."enum_candidate_job_shortlists_program_code";
  DROP TYPE "public"."enum_candidate_job_shortlists_status";
  DROP TYPE "public"."enum_candidate_job_shortlists_notification_status";
  DROP TYPE "public"."enum_candidate_job_options_status";
  DROP TYPE "public"."enum_candidate_job_options_job_category";
  DROP TYPE "public"."enum_candidate_job_options_currency";`)
}
