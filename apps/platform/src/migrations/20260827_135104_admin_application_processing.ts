import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pre_applications_contact_status" AS ENUM('NOT_ATTEMPTED', 'ATTEMPTED', 'REACHED', 'FOLLOW_UP_REQUIRED');
  CREATE TYPE "public"."enum_pre_applications_latest_contact_outcome" AS ENUM('NO_ANSWER', 'REACHED', 'CALLBACK_REQUESTED', 'INVALID_CONTACT');
  CREATE TYPE "public"."enum_contact_attempts_channel" AS ENUM('PHONE');
  CREATE TYPE "public"."enum_contact_attempts_outcome" AS ENUM('NO_ANSWER', 'REACHED', 'CALLBACK_REQUESTED', 'INVALID_CONTACT');
  CREATE TYPE "public"."enum_audit_events_previous_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'REJECTED');
  CREATE TYPE "public"."enum_audit_events_new_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'REJECTED');
  CREATE TYPE "public"."enum_outbox_events_event_type" AS ENUM('MATERIAL_DELIVERY_REQUESTED');
  CREATE TYPE "public"."enum_outbox_events_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
  CREATE TYPE "public"."enum_outbox_events_aggregate_type" AS ENUM('PRE_APPLICATION');
  ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'UNDER_REVIEW';
  ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'QUALIFIED';
  ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'REJECTED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'REVIEW_STARTED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONTACT_ATTEMPT_RECORDED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'APPLICANT_QUALIFIED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'APPLICANT_REJECTED';
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'ADMIN_ACTION_REJECTED';
  ALTER TYPE "public"."enum_audit_events_actor_type" ADD VALUE 'ADMIN';
  CREATE TABLE "contact_attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pre_application_id" integer NOT NULL,
  	"channel" "enum_contact_attempts_channel" NOT NULL,
  	"attempted_at" timestamp(3) with time zone NOT NULL,
  	"actor_id" integer NOT NULL,
  	"outcome" "enum_contact_attempts_outcome" NOT NULL,
  	"next_contact_at" timestamp(3) with time zone,
  	"note" varchar,
  	"correlation_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "outbox_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_key" varchar NOT NULL,
  	"event_type" "enum_outbox_events_event_type" NOT NULL,
  	"status" "enum_outbox_events_status" DEFAULT 'PENDING' NOT NULL,
  	"aggregate_type" "enum_outbox_events_aggregate_type" NOT NULL,
  	"aggregate_id" varchar NOT NULL,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"available_at" timestamp(3) with time zone NOT NULL,
  	"attempt_count" numeric DEFAULT 0 NOT NULL,
  	"payload" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pre_applications" ADD COLUMN "workflow_version" numeric DEFAULT 1 NOT NULL;
  ALTER TABLE "pre_applications" ADD COLUMN "contact_status" "enum_pre_applications_contact_status" DEFAULT 'NOT_ATTEMPTED' NOT NULL;
  ALTER TABLE "pre_applications" ADD COLUMN "contact_attempt_count" numeric DEFAULT 0 NOT NULL;
  ALTER TABLE "pre_applications" ADD COLUMN "review_started_at" timestamp(3) with time zone;
  ALTER TABLE "pre_applications" ADD COLUMN "review_started_by_id" integer;
  ALTER TABLE "pre_applications" ADD COLUMN "latest_contact_at" timestamp(3) with time zone;
  ALTER TABLE "pre_applications" ADD COLUMN "latest_contact_outcome" "enum_pre_applications_latest_contact_outcome";
  ALTER TABLE "pre_applications" ADD COLUMN "next_contact_at" timestamp(3) with time zone;
  ALTER TABLE "pre_applications" ADD COLUMN "decided_at" timestamp(3) with time zone;
  ALTER TABLE "pre_applications" ADD COLUMN "decided_by_id" integer;
  ALTER TABLE "pre_applications" ADD COLUMN "decision_note" varchar;
  ALTER TABLE "audit_events" ADD COLUMN "actor_id" integer;
  ALTER TABLE "audit_events" ADD COLUMN "previous_status" "enum_audit_events_previous_status";
  ALTER TABLE "audit_events" ADD COLUMN "new_status" "enum_audit_events_new_status";
  ALTER TABLE "audit_events" ADD COLUMN "workflow_version" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contact_attempts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "outbox_events_id" integer;
  ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "contact_attempts_pre_application_idx" ON "contact_attempts" USING btree ("pre_application_id");
  CREATE INDEX "contact_attempts_attempted_at_idx" ON "contact_attempts" USING btree ("attempted_at");
  CREATE INDEX "contact_attempts_actor_idx" ON "contact_attempts" USING btree ("actor_id");
  CREATE INDEX "contact_attempts_correlation_id_idx" ON "contact_attempts" USING btree ("correlation_id");
  CREATE INDEX "contact_attempts_updated_at_idx" ON "contact_attempts" USING btree ("updated_at");
  CREATE INDEX "contact_attempts_created_at_idx" ON "contact_attempts" USING btree ("created_at");
  CREATE UNIQUE INDEX "outbox_events_event_key_idx" ON "outbox_events" USING btree ("event_key");
  CREATE INDEX "outbox_events_aggregate_id_idx" ON "outbox_events" USING btree ("aggregate_id");
  CREATE INDEX "outbox_events_available_at_idx" ON "outbox_events" USING btree ("available_at");
  CREATE INDEX "outbox_events_updated_at_idx" ON "outbox_events" USING btree ("updated_at");
  CREATE INDEX "outbox_events_created_at_idx" ON "outbox_events" USING btree ("created_at");
  ALTER TABLE "pre_applications" ADD CONSTRAINT "pre_applications_review_started_by_id_users_id_fk" FOREIGN KEY ("review_started_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pre_applications" ADD CONSTRAINT "pre_applications_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_attempts_fk" FOREIGN KEY ("contact_attempts_id") REFERENCES "public"."contact_attempts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_outbox_events_fk" FOREIGN KEY ("outbox_events_id") REFERENCES "public"."outbox_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pre_applications_review_started_by_idx" ON "pre_applications" USING btree ("review_started_by_id");
  CREATE INDEX "pre_applications_decided_by_idx" ON "pre_applications" USING btree ("decided_by_id");
  CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_id");
  CREATE INDEX "payload_locked_documents_rels_contact_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_attempts_id");
  CREATE INDEX "payload_locked_documents_rels_outbox_events_id_idx" ON "payload_locked_documents_rels" USING btree ("outbox_events_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_attempts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "outbox_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contact_attempts" CASCADE;
  DROP TABLE "outbox_events" CASCADE;
  ALTER TABLE "pre_applications" DROP CONSTRAINT "pre_applications_review_started_by_id_users_id_fk";
  
  ALTER TABLE "pre_applications" DROP CONSTRAINT "pre_applications_decided_by_id_users_id_fk";
  
  ALTER TABLE "audit_events" DROP CONSTRAINT "audit_events_actor_id_users_id_fk";
  
  UPDATE "pre_applications" SET "status" = 'SUBMITTED' WHERE "status" <> 'SUBMITTED';
  DELETE FROM "audit_events" WHERE "actor_type" = 'ADMIN' OR "event_type" <> 'PRE_APPLICATION_SUBMITTED';
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::text;
  DROP TYPE "public"."enum_pre_applications_status";
  CREATE TYPE "public"."enum_pre_applications_status" AS ENUM('SUBMITTED');
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"public"."enum_pre_applications_status";
  ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DATA TYPE "public"."enum_pre_applications_status" USING "status"::"public"."enum_pre_applications_status";
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_event_type";
  CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED');
  ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  ALTER TABLE "audit_events" ALTER COLUMN "actor_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_actor_type";
  CREATE TYPE "public"."enum_audit_events_actor_type" AS ENUM('PUBLIC_APPLICANT');
  ALTER TABLE "audit_events" ALTER COLUMN "actor_type" SET DATA TYPE "public"."enum_audit_events_actor_type" USING "actor_type"::"public"."enum_audit_events_actor_type";
  DROP INDEX "pre_applications_review_started_by_idx";
  DROP INDEX "pre_applications_decided_by_idx";
  DROP INDEX "audit_events_actor_idx";
  DROP INDEX "payload_locked_documents_rels_contact_attempts_id_idx";
  DROP INDEX "payload_locked_documents_rels_outbox_events_id_idx";
  ALTER TABLE "pre_applications" DROP COLUMN "workflow_version";
  ALTER TABLE "pre_applications" DROP COLUMN "contact_status";
  ALTER TABLE "pre_applications" DROP COLUMN "contact_attempt_count";
  ALTER TABLE "pre_applications" DROP COLUMN "review_started_at";
  ALTER TABLE "pre_applications" DROP COLUMN "review_started_by_id";
  ALTER TABLE "pre_applications" DROP COLUMN "latest_contact_at";
  ALTER TABLE "pre_applications" DROP COLUMN "latest_contact_outcome";
  ALTER TABLE "pre_applications" DROP COLUMN "next_contact_at";
  ALTER TABLE "pre_applications" DROP COLUMN "decided_at";
  ALTER TABLE "pre_applications" DROP COLUMN "decided_by_id";
  ALTER TABLE "pre_applications" DROP COLUMN "decision_note";
  ALTER TABLE "audit_events" DROP COLUMN "actor_id";
  ALTER TABLE "audit_events" DROP COLUMN "previous_status";
  ALTER TABLE "audit_events" DROP COLUMN "new_status";
  ALTER TABLE "audit_events" DROP COLUMN "workflow_version";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contact_attempts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "outbox_events_id";
  DROP TYPE "public"."enum_pre_applications_contact_status";
  DROP TYPE "public"."enum_pre_applications_latest_contact_outcome";
  DROP TYPE "public"."enum_contact_attempts_channel";
  DROP TYPE "public"."enum_contact_attempts_outcome";
  DROP TYPE "public"."enum_audit_events_previous_status";
  DROP TYPE "public"."enum_audit_events_new_status";
  DROP TYPE "public"."enum_outbox_events_event_type";
  DROP TYPE "public"."enum_outbox_events_status";
  DROP TYPE "public"."enum_outbox_events_aggregate_type";`)
}

