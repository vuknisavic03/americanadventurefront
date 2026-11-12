import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_candidate_processes_program_code" AS ENUM('SWT');
    CREATE TYPE "public"."enum_candidate_processes_process_status" AS ENUM('ACTIVE', 'ON_HOLD', 'COMPLETED');
    CREATE TYPE "public"."enum_candidate_processes_current_step" AS ENUM(
      'PROFILE_SETUP',
      'CONTRACT_AND_PAYMENT_PLAN',
      'INITIAL_PAYMENT',
      'PROGRAM_APPLICATION',
      'DOCUMENTS',
      'JOB_PLACEMENT',
      'VISA',
      'TRAVEL_PREPARATION',
      'USA_STAY'
    );
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CANDIDATE_PROFILE_UPDATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CANDIDATE_PROCESS_UPDATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';

    CREATE TABLE "candidate_processes" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "applicant_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "program_code" "enum_candidate_processes_program_code" NOT NULL,
      "process_status" "enum_candidate_processes_process_status" DEFAULT 'ACTIVE' NOT NULL,
      "current_step" "enum_candidate_processes_current_step" DEFAULT 'PROFILE_SETUP' NOT NULL,
      "current_step_started_at" timestamp(3) with time zone,
      "next_action_title" varchar,
      "next_action_description" varchar,
      "next_action_due_at" timestamp(3) with time zone,
      "progress_note" varchar,
      "progress_version" numeric DEFAULT 1 NOT NULL,
      "progress_updated_at" timestamp(3) with time zone,
      "progress_updated_by_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_processes_id" integer;
    ALTER TABLE "candidate_processes" ADD CONSTRAINT "candidate_processes_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_processes" ADD CONSTRAINT "candidate_processes_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_processes" ADD CONSTRAINT "candidate_processes_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_processes" ADD CONSTRAINT "candidate_processes_progress_updated_by_id_users_id_fk" FOREIGN KEY ("progress_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_processes_fk" FOREIGN KEY ("candidate_processes_id") REFERENCES "public"."candidate_processes"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "candidate_processes_candidate_account_idx" ON "candidate_processes" USING btree ("candidate_account_id");
    CREATE INDEX "candidate_processes_applicant_idx" ON "candidate_processes" USING btree ("applicant_id");
    CREATE UNIQUE INDEX "candidate_processes_pre_application_idx" ON "candidate_processes" USING btree ("pre_application_id");
    CREATE INDEX "candidate_processes_progress_updated_by_idx" ON "candidate_processes" USING btree ("progress_updated_by_id");
    CREATE INDEX "candidate_processes_updated_at_idx" ON "candidate_processes" USING btree ("updated_at");
    CREATE INDEX "candidate_processes_created_at_idx" ON "candidate_processes" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_candidate_processes_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_processes_id");

    INSERT INTO "candidate_processes" (
      "candidate_account_id",
      "applicant_id",
      "pre_application_id",
      "program_code",
      "process_status",
      "current_step",
      "current_step_started_at",
      "next_action_title",
      "next_action_description",
      "progress_version",
      "progress_updated_at",
      "updated_at",
      "created_at"
    )
    SELECT
      account."id",
      account."applicant_id",
      account."pre_application_id",
      account."program_code"::text::"enum_candidate_processes_program_code",
      'ACTIVE',
      'PROFILE_SETUP',
      COALESCE(account."verified_at", account."activation_issued_at", account."created_at"),
      'Proverite i dopunite svoj profil',
      'Proverite podatke prenete iz prijave i dopunite kontaktne podatke ako su se promenili.',
      1,
      COALESCE(account."verified_at", account."activation_issued_at", account."created_at"),
      account."updated_at",
      account."created_at"
    FROM "candidate_accounts" account
    ON CONFLICT ("pre_application_id") DO NOTHING;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "audit_events" WHERE "event_type" IN ('CANDIDATE_PROFILE_UPDATED', 'CANDIDATE_PROCESS_UPDATED');

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_processes_fk";
    DROP INDEX "payload_locked_documents_rels_candidate_processes_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_processes_id";
    DROP TABLE "candidate_processes" CASCADE;
    DROP TYPE "public"."enum_candidate_processes_program_code";
    DROP TYPE "public"."enum_candidate_processes_process_status";
    DROP TYPE "public"."enum_candidate_processes_current_step";

    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_event_type";
    CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM(
      'PRE_APPLICATION_SUBMITTED',
      'REVIEW_STARTED',
      'CONTACT_ATTEMPT_RECORDED',
      'APPLICANT_QUALIFIED',
      'MATERIALS_DELIVERED',
      'CONSULTATION_INVITATION_DELIVERED',
      'CONSULTATION_SCHEDULED',
      'CONSULTATION_RESCHEDULED',
      'CONSULTATION_CANCELLED',
      'CONSULTATION_COMPLETED',
      'CONSULTATION_NO_SHOW',
      'PROFILE_READINESS_APPROVED',
      'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED',
      'CANDIDATE_ACCOUNT_ACTIVATION_SENT',
      'CANDIDATE_ACCOUNT_ACTIVATED',
      'CANDIDATE_ACCOUNT_REGISTERED',
      'CANDIDATE_MESSAGE_FAILED',
      'APPLICANT_REJECTED',
      'ADMIN_ACTION_REJECTED'
    );
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  `)
}
