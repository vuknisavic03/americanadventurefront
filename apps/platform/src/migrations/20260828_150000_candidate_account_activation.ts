import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_candidate_accounts_program_code" AS ENUM('SWT');
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CANDIDATE_ACCOUNT_REGISTERED' BEFORE 'CANDIDATE_MESSAGE_FAILED';

    CREATE TABLE "candidate_accounts_sessions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone NOT NULL
    );

    CREATE TABLE "candidate_accounts" (
      "id" serial PRIMARY KEY NOT NULL,
      "applicant_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "full_name" varchar NOT NULL,
      "citizenship" varchar NOT NULL,
      "program_code" "enum_candidate_accounts_program_code" NOT NULL,
      "verified_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "email" varchar NOT NULL,
      "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt" varchar,
      "hash" varchar,
      "_verified" boolean DEFAULT false,
      "_verification_token" varchar,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" timestamp(3) with time zone
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_accounts_id" integer;
    ALTER TABLE "payload_preferences_rels" ADD COLUMN "candidate_accounts_id" integer;

    ALTER TABLE "candidate_accounts_sessions" ADD CONSTRAINT "candidate_accounts_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "candidate_accounts" ADD CONSTRAINT "candidate_accounts_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "candidate_accounts" ADD CONSTRAINT "candidate_accounts_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_accounts_fk" FOREIGN KEY ("candidate_accounts_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_candidate_accounts_fk" FOREIGN KEY ("candidate_accounts_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "candidate_accounts_sessions_order_idx" ON "candidate_accounts_sessions" USING btree ("_order");
    CREATE INDEX "candidate_accounts_sessions_parent_id_idx" ON "candidate_accounts_sessions" USING btree ("_parent_id");
    CREATE UNIQUE INDEX "candidate_accounts_applicant_idx" ON "candidate_accounts" USING btree ("applicant_id");
    CREATE UNIQUE INDEX "candidate_accounts_pre_application_idx" ON "candidate_accounts" USING btree ("pre_application_id");
    CREATE INDEX "candidate_accounts_updated_at_idx" ON "candidate_accounts" USING btree ("updated_at");
    CREATE INDEX "candidate_accounts_created_at_idx" ON "candidate_accounts" USING btree ("created_at");
    CREATE UNIQUE INDEX "candidate_accounts_email_idx" ON "candidate_accounts" USING btree ("email");
    CREATE INDEX "payload_locked_documents_rels_candidate_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_accounts_id");
    CREATE INDEX "payload_preferences_rels_candidate_accounts_id_idx" ON "payload_preferences_rels" USING btree ("candidate_accounts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "audit_events" WHERE "event_type" = 'CANDIDATE_ACCOUNT_REGISTERED';

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_accounts_fk";
    ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_candidate_accounts_fk";
    DROP INDEX "payload_locked_documents_rels_candidate_accounts_id_idx";
    DROP INDEX "payload_preferences_rels_candidate_accounts_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_accounts_id";
    ALTER TABLE "payload_preferences_rels" DROP COLUMN "candidate_accounts_id";

    DROP TABLE "candidate_accounts_sessions" CASCADE;
    DROP TABLE "candidate_accounts" CASCADE;
    DROP TYPE "public"."enum_candidate_accounts_program_code";

    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_event_type";
    CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  `)
}

