import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  void payload
  void req
  await db.execute(sql`
   CREATE TYPE "public"."enum_message_deliveries_category" AS ENUM('MATERIAL_BUNDLE', 'CONSULTATION_INVITATION');
  CREATE TYPE "public"."enum_message_deliveries_status" AS ENUM('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED');
  CREATE TYPE "public"."enum_message_deliveries_provider" AS ENUM('capture', 'resend');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'sendCandidateCommunication');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'sendCandidateCommunication');
  ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'MATERIALS_SENT' BEFORE 'REJECTED';
  ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'CONSULTATION_INVITED' BEFORE 'REJECTED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'MATERIALS_DELIVERED' BEFORE 'APPLICANT_REJECTED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONSULTATION_INVITATION_DELIVERED' BEFORE 'APPLICANT_REJECTED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CANDIDATE_MESSAGE_FAILED' BEFORE 'APPLICANT_REJECTED';
  ALTER TYPE "public"."enum_audit_events_actor_type" ADD VALUE 'SYSTEM';
  ALTER TYPE "public"."enum_audit_events_previous_status" ADD VALUE 'MATERIALS_SENT' BEFORE 'REJECTED';
  ALTER TYPE "public"."enum_audit_events_previous_status" ADD VALUE 'CONSULTATION_INVITED' BEFORE 'REJECTED';
  ALTER TYPE "public"."enum_audit_events_new_status" ADD VALUE 'MATERIALS_SENT' BEFORE 'REJECTED';
  ALTER TYPE "public"."enum_audit_events_new_status" ADD VALUE 'CONSULTATION_INVITED' BEFORE 'REJECTED';
  ALTER TYPE "public"."enum_outbox_events_event_type" ADD VALUE 'CONSULTATION_INVITATION_REQUESTED';
  CREATE TABLE "message_deliveries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pre_application_id" integer NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"category" "enum_message_deliveries_category" NOT NULL,
  	"status" "enum_message_deliveries_status" DEFAULT 'PENDING' NOT NULL,
  	"recipient_email" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"template_key" varchar NOT NULL,
  	"template_version" varchar NOT NULL,
  	"content_hash" varchar NOT NULL,
  	"provider" "enum_message_deliveries_provider" NOT NULL,
  	"provider_message_id" varchar,
  	"attempt_count" numeric DEFAULT 0 NOT NULL,
  	"last_attempt_at" timestamp(3) with time zone,
  	"delivered_at" timestamp(3) with time zone,
  	"next_retry_at" timestamp(3) with time zone,
  	"last_error_code" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "outbox_events" ADD COLUMN "completed_at" timestamp(3) with time zone;
  ALTER TABLE "outbox_events" ADD COLUMN "last_error_code" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "message_deliveries_id" integer;
  ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "message_deliveries_pre_application_idx" ON "message_deliveries" USING btree ("pre_application_id");
  CREATE UNIQUE INDEX "message_deliveries_idempotency_key_idx" ON "message_deliveries" USING btree ("idempotency_key");
  CREATE INDEX "message_deliveries_updated_at_idx" ON "message_deliveries" USING btree ("updated_at");
  CREATE INDEX "message_deliveries_created_at_idx" ON "message_deliveries" USING btree ("created_at");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  INSERT INTO "payload_jobs" ("input", "task_slug", "queue", "wait_until")
  SELECT jsonb_build_object('eventId', "id"), 'sendCandidateCommunication', 'candidate-communications', "available_at"
  FROM "outbox_events"
  WHERE "event_type" = 'MATERIAL_DELIVERY_REQUESTED'
    AND "status" IN ('PENDING', 'FAILED');
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_message_deliveries_fk" FOREIGN KEY ("message_deliveries_id") REFERENCES "public"."message_deliveries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_message_deliveries_id_idx" ON "payload_locked_documents_rels" USING btree ("message_deliveries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  void payload
  void req
  await db.execute(sql`
   ALTER TABLE "message_deliveries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_message_deliveries_fk";
  DROP TABLE "message_deliveries" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::text;
  DROP TYPE "public"."enum_pre_applications_status";
  CREATE TYPE "public"."enum_pre_applications_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'REJECTED');
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"public"."enum_pre_applications_status";
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DATA TYPE "public"."enum_pre_applications_status" USING "status"::"public"."enum_pre_applications_status";
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  ALTER TABLE "audit_events" ALTER COLUMN "actor_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_actor_type";
  CREATE TYPE "public"."enum_audit_events_actor_type" AS ENUM('PUBLIC_APPLICANT', 'ADMIN');
  ALTER TABLE "audit_events" ALTER COLUMN "actor_type" SET DATA TYPE "public"."enum_audit_events_actor_type" USING "actor_type"::"public"."enum_audit_events_actor_type";
  ALTER TABLE "audit_events" ALTER COLUMN "previous_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_previous_status";
  CREATE TYPE "public"."enum_audit_events_previous_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "previous_status" SET DATA TYPE "public"."enum_audit_events_previous_status" USING "previous_status"::"public"."enum_audit_events_previous_status";
  ALTER TABLE "audit_events" ALTER COLUMN "new_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_new_status";
  CREATE TYPE "public"."enum_audit_events_new_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'REJECTED');
  ALTER TABLE "audit_events" ALTER COLUMN "new_status" SET DATA TYPE "public"."enum_audit_events_new_status" USING "new_status"::"public"."enum_audit_events_new_status";
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_outbox_events_event_type";
  CREATE TYPE "public"."enum_outbox_events_event_type" AS ENUM('MATERIAL_DELIVERY_REQUESTED');
  ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_outbox_events_event_type" USING "event_type"::"public"."enum_outbox_events_event_type";
  DROP INDEX "payload_locked_documents_rels_message_deliveries_id_idx";
  ALTER TABLE "outbox_events" DROP COLUMN "completed_at";
  ALTER TABLE "outbox_events" DROP COLUMN "last_error_code";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "message_deliveries_id";
  DROP TYPE "public"."enum_message_deliveries_category";
  DROP TYPE "public"."enum_message_deliveries_status";
  DROP TYPE "public"."enum_message_deliveries_provider";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}

