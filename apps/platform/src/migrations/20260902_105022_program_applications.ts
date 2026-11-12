import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_program_application_templates_fields_field_type" AS ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'DATE');
  CREATE TYPE "public"."enum_program_application_templates_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_program_application_templates_status" AS ENUM('DRAFT', 'ACTIVE', 'RETIRED');
  CREATE TYPE "public"."enum_candidate_program_applications_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_candidate_program_applications_status" AS ENUM('DRAFT', 'SUBMITTED');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_APPLICATION_TEMPLATE_RETIRED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_APPLICATION_CREATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_APPLICATION_DRAFT_SAVED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_APPLICATION_SUBMITTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
  CREATE TABLE "program_application_templates_fields" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "key" varchar NOT NULL,
   "label" varchar NOT NULL,
   "field_type" "enum_program_application_templates_fields_field_type" NOT NULL,
   "required" boolean DEFAULT false,
   "help_text" varchar,
   "max_length" numeric
  );

  CREATE TABLE "program_application_templates" (
   "id" serial PRIMARY KEY NOT NULL,
   "name" varchar NOT NULL,
   "program_code" "enum_program_application_templates_program_code" NOT NULL,
   "version" numeric NOT NULL,
   "status" "enum_program_application_templates_status" DEFAULT 'DRAFT' NOT NULL,
   "instructions" varchar,
   "schema_checksum" varchar NOT NULL,
   "created_by_id" integer,
   "activated_at" timestamp(3) with time zone,
   "activated_by_id" integer,
   "retired_at" timestamp(3) with time zone,
   "retired_by_id" integer,
   "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "candidate_program_applications" (
   "id" serial PRIMARY KEY NOT NULL,
   "candidate_account_id" integer NOT NULL,
   "candidate_process_id" integer NOT NULL,
   "pre_application_id" integer NOT NULL,
   "template_id" integer NOT NULL,
   "program_code" "enum_candidate_program_applications_program_code" NOT NULL,
   "template_name" varchar NOT NULL,
   "template_version" numeric NOT NULL,
   "instructions_snapshot" varchar,
   "schema_snapshot" jsonb NOT NULL,
   "schema_checksum" varchar NOT NULL,
   "answers" jsonb NOT NULL,
   "status" "enum_candidate_program_applications_status" DEFAULT 'DRAFT' NOT NULL,
   "completion_percent" numeric NOT NULL,
   "revision" numeric NOT NULL,
   "last_saved_at" timestamp(3) with time zone NOT NULL,
   "submitted_at" timestamp(3) with time zone,
   "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "program_application_templates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_program_applications_id" integer;
  ALTER TABLE "program_application_templates_fields" ADD CONSTRAINT "program_application_templates_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."program_application_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "program_application_templates" ADD CONSTRAINT "program_application_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "program_application_templates" ADD CONSTRAINT "program_application_templates_activated_by_id_users_id_fk" FOREIGN KEY ("activated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "program_application_templates" ADD CONSTRAINT "program_application_templates_retired_by_id_users_id_fk" FOREIGN KEY ("retired_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_program_applications" ADD CONSTRAINT "candidate_program_applications_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_program_applications" ADD CONSTRAINT "candidate_program_applications_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_program_applications" ADD CONSTRAINT "candidate_program_applications_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidate_program_applications" ADD CONSTRAINT "candidate_program_applications_template_id_program_application_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."program_application_templates"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "program_application_templates_fields_order_idx" ON "program_application_templates_fields" USING btree ("_order");
  CREATE INDEX "program_application_templates_fields_parent_id_idx" ON "program_application_templates_fields" USING btree ("_parent_id");
  CREATE INDEX "program_application_templates_created_by_idx" ON "program_application_templates" USING btree ("created_by_id");
  CREATE INDEX "program_application_templates_activated_by_idx" ON "program_application_templates" USING btree ("activated_by_id");
  CREATE INDEX "program_application_templates_retired_by_idx" ON "program_application_templates" USING btree ("retired_by_id");
  CREATE INDEX "program_application_templates_updated_at_idx" ON "program_application_templates" USING btree ("updated_at");
  CREATE INDEX "program_application_templates_created_at_idx" ON "program_application_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "programCode_version_idx" ON "program_application_templates" USING btree ("program_code","version");
  CREATE UNIQUE INDEX "program_application_templates_one_active_program_idx" ON "program_application_templates" USING btree ("program_code") WHERE "status" = 'ACTIVE';
  CREATE INDEX "candidate_program_applications_candidate_account_idx" ON "candidate_program_applications" USING btree ("candidate_account_id");
  CREATE UNIQUE INDEX "candidate_program_applications_candidate_process_idx" ON "candidate_program_applications" USING btree ("candidate_process_id");
  CREATE INDEX "candidate_program_applications_pre_application_idx" ON "candidate_program_applications" USING btree ("pre_application_id");
  CREATE INDEX "candidate_program_applications_template_idx" ON "candidate_program_applications" USING btree ("template_id");
  CREATE INDEX "candidate_program_applications_updated_at_idx" ON "candidate_program_applications" USING btree ("updated_at");
  CREATE INDEX "candidate_program_applications_created_at_idx" ON "candidate_program_applications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_program_application_templat_fk" FOREIGN KEY ("program_application_templates_id") REFERENCES "public"."program_application_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_program_applicati_fk" FOREIGN KEY ("candidate_program_applications_id") REFERENCES "public"."candidate_program_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_program_application_templa_idx" ON "payload_locked_documents_rels" USING btree ("program_application_templates_id");
  CREATE INDEX "payload_locked_documents_rels_candidate_program_applicat_idx" ON "payload_locked_documents_rels" USING btree ("candidate_program_applications_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "program_application_templates_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "program_application_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_program_applications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_program_application_templat_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_program_applicati_fk";

  DROP INDEX "program_application_templates_one_active_program_idx";
  DROP TABLE "program_application_templates_fields" CASCADE;
  DROP TABLE "program_application_templates" CASCADE;
  DROP TABLE "candidate_program_applications" CASCADE;
  UPDATE "audit_events"
    SET "event_type" = 'CANDIDATE_PROCESS_UPDATED'
    WHERE "event_type" IN ('PROGRAM_APPLICATION_TEMPLATE_DRAFTED', 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED', 'PROGRAM_APPLICATION_TEMPLATE_RETIRED', 'PROGRAM_APPLICATION_CREATED', 'PROGRAM_APPLICATION_DRAFT_SAVED', 'PROGRAM_APPLICATION_SUBMITTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED', 'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED', 'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED', 'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED', 'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED', 'PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  DROP INDEX "payload_locked_documents_rels_program_application_templa_idx";
  DROP INDEX "payload_locked_documents_rels_candidate_program_applicat_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "program_application_templates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_program_applications_id";
  DROP TYPE "public"."enum_program_application_templates_fields_field_type";
  DROP TYPE "public"."enum_program_application_templates_program_code";
  DROP TYPE "public"."enum_program_application_templates_status";
  DROP TYPE "public"."enum_candidate_program_applications_program_code";
  DROP TYPE "public"."enum_candidate_program_applications_status";`)
}
