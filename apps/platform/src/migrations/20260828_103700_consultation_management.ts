import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_pre_applications_consultation_status" AS ENUM('NOT_SCHEDULED', 'SCHEDULED', 'ATTENDED', 'NO_SHOW', 'CANCELLED');
    ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'CONSULTATION_SCHEDULED' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'CONSULTATION_COMPLETED' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_pre_applications_status" ADD VALUE 'READY_FOR_PROFILE' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONSULTATION_SCHEDULED' BEFORE 'APPLICANT_REJECTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONSULTATION_RESCHEDULED' BEFORE 'APPLICANT_REJECTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONSULTATION_CANCELLED' BEFORE 'APPLICANT_REJECTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONSULTATION_COMPLETED' BEFORE 'APPLICANT_REJECTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CONSULTATION_NO_SHOW' BEFORE 'APPLICANT_REJECTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROFILE_READINESS_APPROVED' BEFORE 'APPLICANT_REJECTED';
    ALTER TYPE "public"."enum_audit_events_previous_status" ADD VALUE 'CONSULTATION_SCHEDULED' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_audit_events_previous_status" ADD VALUE 'CONSULTATION_COMPLETED' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_audit_events_previous_status" ADD VALUE 'READY_FOR_PROFILE' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_audit_events_new_status" ADD VALUE 'CONSULTATION_SCHEDULED' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_audit_events_new_status" ADD VALUE 'CONSULTATION_COMPLETED' BEFORE 'REJECTED';
    ALTER TYPE "public"."enum_audit_events_new_status" ADD VALUE 'READY_FOR_PROFILE' BEFORE 'REJECTED';

    ALTER TABLE "pre_applications" ADD COLUMN "consultation_status" "enum_pre_applications_consultation_status" DEFAULT 'NOT_SCHEDULED' NOT NULL;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_starts_at" timestamp(3) with time zone;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_ends_at" timestamp(3) with time zone;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_time_zone" varchar;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_provider" varchar;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_provider_event_key" varchar;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_scheduled_at" timestamp(3) with time zone;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_scheduled_by_id" integer;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_outcome_recorded_at" timestamp(3) with time zone;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_outcome_recorded_by_id" integer;
    ALTER TABLE "pre_applications" ADD COLUMN "consultation_notes" varchar;
    ALTER TABLE "pre_applications" ADD COLUMN "profile_readiness_approved_at" timestamp(3) with time zone;
    ALTER TABLE "pre_applications" ADD COLUMN "profile_readiness_approved_by_id" integer;
    ALTER TABLE "pre_applications" ADD COLUMN "profile_readiness_note" varchar;

    ALTER TABLE "pre_applications" ADD CONSTRAINT "pre_applications_consultation_scheduled_by_id_users_id_fk" FOREIGN KEY ("consultation_scheduled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pre_applications" ADD CONSTRAINT "pre_applications_consultation_outcome_recorded_by_id_users_id_fk" FOREIGN KEY ("consultation_outcome_recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pre_applications" ADD CONSTRAINT "pre_applications_profile_readiness_approved_by_id_users_id_fk" FOREIGN KEY ("profile_readiness_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    CREATE UNIQUE INDEX "pre_applications_consultation_provider_event_key_idx" ON "pre_applications" USING btree ("consultation_provider_event_key");
    CREATE INDEX "pre_applications_consultation_scheduled_by_idx" ON "pre_applications" USING btree ("consultation_scheduled_by_id");
    CREATE INDEX "pre_applications_consultation_outcome_recorded_by_idx" ON "pre_applications" USING btree ("consultation_outcome_recorded_by_id");
    CREATE INDEX "pre_applications_profile_readiness_approved_by_idx" ON "pre_applications" USING btree ("profile_readiness_approved_by_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pre_applications" DROP CONSTRAINT "pre_applications_consultation_scheduled_by_id_users_id_fk";
    ALTER TABLE "pre_applications" DROP CONSTRAINT "pre_applications_consultation_outcome_recorded_by_id_users_id_fk";
    ALTER TABLE "pre_applications" DROP CONSTRAINT "pre_applications_profile_readiness_approved_by_id_users_id_fk";
    DROP INDEX "pre_applications_consultation_provider_event_key_idx";
    DROP INDEX "pre_applications_consultation_scheduled_by_idx";
    DROP INDEX "pre_applications_consultation_outcome_recorded_by_idx";
    DROP INDEX "pre_applications_profile_readiness_approved_by_idx";

    UPDATE "pre_applications" SET "status" = 'CONSULTATION_INVITED' WHERE "status" IN ('CONSULTATION_SCHEDULED', 'CONSULTATION_COMPLETED', 'READY_FOR_PROFILE');
    DELETE FROM "audit_events" WHERE "event_type" IN ('CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED');
    UPDATE "audit_events" SET "previous_status" = 'CONSULTATION_INVITED' WHERE "previous_status" IN ('CONSULTATION_SCHEDULED', 'CONSULTATION_COMPLETED', 'READY_FOR_PROFILE');
    UPDATE "audit_events" SET "new_status" = 'CONSULTATION_INVITED' WHERE "new_status" IN ('CONSULTATION_SCHEDULED', 'CONSULTATION_COMPLETED', 'READY_FOR_PROFILE');

    ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DATA TYPE text;
    ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::text;
    DROP TYPE "public"."enum_pre_applications_status";
    CREATE TYPE "public"."enum_pre_applications_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'MATERIALS_SENT', 'CONSULTATION_INVITED', 'REJECTED');
    ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"public"."enum_pre_applications_status";
    ALTER TABLE "pre_applications" ALTER COLUMN "status" SET DATA TYPE "public"."enum_pre_applications_status" USING "status"::"public"."enum_pre_applications_status";

    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_event_type";
    CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";

    ALTER TABLE "audit_events" ALTER COLUMN "previous_status" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_previous_status";
    CREATE TYPE "public"."enum_audit_events_previous_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'MATERIALS_SENT', 'CONSULTATION_INVITED', 'REJECTED');
    ALTER TABLE "audit_events" ALTER COLUMN "previous_status" SET DATA TYPE "public"."enum_audit_events_previous_status" USING "previous_status"::"public"."enum_audit_events_previous_status";
    ALTER TABLE "audit_events" ALTER COLUMN "new_status" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_new_status";
    CREATE TYPE "public"."enum_audit_events_new_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'QUALIFIED', 'MATERIALS_SENT', 'CONSULTATION_INVITED', 'REJECTED');
    ALTER TABLE "audit_events" ALTER COLUMN "new_status" SET DATA TYPE "public"."enum_audit_events_new_status" USING "new_status"::"public"."enum_audit_events_new_status";

    ALTER TABLE "pre_applications" DROP COLUMN "consultation_status";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_starts_at";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_ends_at";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_time_zone";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_provider";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_provider_event_key";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_scheduled_at";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_scheduled_by_id";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_outcome_recorded_at";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_outcome_recorded_by_id";
    ALTER TABLE "pre_applications" DROP COLUMN "consultation_notes";
    ALTER TABLE "pre_applications" DROP COLUMN "profile_readiness_approved_at";
    ALTER TABLE "pre_applications" DROP COLUMN "profile_readiness_approved_by_id";
    ALTER TABLE "pre_applications" DROP COLUMN "profile_readiness_note";
    DROP TYPE "public"."enum_pre_applications_consultation_status";
  `)
}

