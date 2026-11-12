import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pre_applications_status" AS ENUM('SUBMITTED');
  CREATE TYPE "public"."enum_pre_applications_program_code" AS ENUM('SWT');
  CREATE TYPE "public"."enum_pre_applications_source" AS ENUM('PUBLIC_WEB');
  CREATE TYPE "public"."enum_pre_applications_submission_current_study_year" AS ENUM('YEAR_1', 'YEAR_2', 'YEAR_3', 'YEAR_4', 'YEAR_5', 'YEAR_6', 'MASTER', 'DOCTORAL', 'OTHER');
  CREATE TYPE "public"."enum_pre_applications_submission_study_interruption_status" AS ENUM('NONE', 'RENEWED_YEAR', 'PAUSED_YEAR', 'OTHER');
  CREATE TYPE "public"."enum_consent_records_consent_type" AS ENUM('PRIVACY', 'NEWSLETTER');
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED');
  CREATE TYPE "public"."enum_audit_events_actor_type" AS ENUM('PUBLIC_APPLICANT');
  CREATE TABLE "applicants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"date_of_birth" timestamp(3) with time zone NOT NULL,
  	"residential_address" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email_normalized" varchar NOT NULL,
  	"phone_normalized" varchar NOT NULL,
  	"first_name_normalized" varchar NOT NULL,
  	"last_name_normalized" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pre_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"applicant_id" integer NOT NULL,
  	"status" "enum_pre_applications_status" DEFAULT 'SUBMITTED' NOT NULL,
  	"program_code" "enum_pre_applications_program_code" NOT NULL,
  	"campaign_code" varchar NOT NULL,
  	"source" "enum_pre_applications_source" NOT NULL,
  	"submission_first_name" varchar NOT NULL,
  	"submission_last_name" varchar NOT NULL,
  	"submission_date_of_birth" timestamp(3) with time zone NOT NULL,
  	"submission_residential_address" varchar NOT NULL,
  	"submission_phone" varchar NOT NULL,
  	"submission_email" varchar NOT NULL,
  	"submission_faculty_name" varchar NOT NULL,
  	"submission_study_city" varchar NOT NULL,
  	"submission_current_study_year" "enum_pre_applications_submission_current_study_year" NOT NULL,
  	"submission_study_interruption_status" "enum_pre_applications_submission_study_interruption_status" NOT NULL,
  	"submission_study_interruption_explanation" varchar,
  	"submission_espb_points" numeric NOT NULL,
  	"submission_applicant_note" varchar,
  	"submission_metadata_form_schema_version" varchar NOT NULL,
  	"submission_metadata_submission_language" varchar NOT NULL,
  	"submission_metadata_source_page" varchar NOT NULL,
  	"correlation_id" varchar NOT NULL,
  	"idempotency_key_hash" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "consent_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pre_application_id" integer NOT NULL,
  	"consent_type" "enum_consent_records_consent_type" NOT NULL,
  	"accepted" boolean DEFAULT false NOT NULL,
  	"text_version" varchar NOT NULL,
  	"consent_text" varchar NOT NULL,
  	"recorded_at" timestamp(3) with time zone NOT NULL,
  	"source_page" varchar NOT NULL,
  	"correlation_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pre_application_id" integer NOT NULL,
  	"event_type" "enum_audit_events_event_type" NOT NULL,
  	"actor_type" "enum_audit_events_actor_type" NOT NULL,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"correlation_id" varchar NOT NULL,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "applicants_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pre_applications_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consent_records_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_events_id" integer;
  ALTER TABLE "pre_applications" ADD CONSTRAINT "pre_applications_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "applicants_email_normalized_idx" ON "applicants" USING btree ("email_normalized");
  CREATE INDEX "applicants_phone_normalized_idx" ON "applicants" USING btree ("phone_normalized");
  CREATE INDEX "applicants_updated_at_idx" ON "applicants" USING btree ("updated_at");
  CREATE INDEX "applicants_created_at_idx" ON "applicants" USING btree ("created_at");
  CREATE INDEX "pre_applications_applicant_idx" ON "pre_applications" USING btree ("applicant_id");
  CREATE UNIQUE INDEX "pre_applications_correlation_id_idx" ON "pre_applications" USING btree ("correlation_id");
  CREATE UNIQUE INDEX "pre_applications_idempotency_key_hash_idx" ON "pre_applications" USING btree ("idempotency_key_hash");
  CREATE INDEX "pre_applications_updated_at_idx" ON "pre_applications" USING btree ("updated_at");
  CREATE INDEX "pre_applications_created_at_idx" ON "pre_applications" USING btree ("created_at");
  CREATE INDEX "consent_records_pre_application_idx" ON "consent_records" USING btree ("pre_application_id");
  CREATE INDEX "consent_records_correlation_id_idx" ON "consent_records" USING btree ("correlation_id");
  CREATE INDEX "consent_records_updated_at_idx" ON "consent_records" USING btree ("updated_at");
  CREATE INDEX "consent_records_created_at_idx" ON "consent_records" USING btree ("created_at");
  CREATE INDEX "audit_events_pre_application_idx" ON "audit_events" USING btree ("pre_application_id");
  CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events" USING btree ("correlation_id");
  CREATE INDEX "audit_events_updated_at_idx" ON "audit_events" USING btree ("updated_at");
  CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_applicants_fk" FOREIGN KEY ("applicants_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pre_applications_fk" FOREIGN KEY ("pre_applications_id") REFERENCES "public"."pre_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_records_fk" FOREIGN KEY ("consent_records_id") REFERENCES "public"."consent_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_events_fk" FOREIGN KEY ("audit_events_id") REFERENCES "public"."audit_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_applicants_id_idx" ON "payload_locked_documents_rels" USING btree ("applicants_id");
  CREATE INDEX "payload_locked_documents_rels_pre_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("pre_applications_id");
  CREATE INDEX "payload_locked_documents_rels_consent_records_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_records_id");
  CREATE INDEX "payload_locked_documents_rels_audit_events_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_events_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applicants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pre_applications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "consent_records" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "applicants" CASCADE;
  DROP TABLE "pre_applications" CASCADE;
  DROP TABLE "consent_records" CASCADE;
  DROP TABLE "audit_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_applicants_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pre_applications_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consent_records_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_applicants_id_idx";
  DROP INDEX "payload_locked_documents_rels_pre_applications_id_idx";
  DROP INDEX "payload_locked_documents_rels_consent_records_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "applicants_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pre_applications_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consent_records_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_events_id";
  DROP TYPE "public"."enum_pre_applications_status";
  DROP TYPE "public"."enum_pre_applications_program_code";
  DROP TYPE "public"."enum_pre_applications_source";
  DROP TYPE "public"."enum_pre_applications_submission_current_study_year";
  DROP TYPE "public"."enum_pre_applications_submission_study_interruption_status";
  DROP TYPE "public"."enum_consent_records_consent_type";
  DROP TYPE "public"."enum_audit_events_event_type";
  DROP TYPE "public"."enum_audit_events_actor_type";`)
}
