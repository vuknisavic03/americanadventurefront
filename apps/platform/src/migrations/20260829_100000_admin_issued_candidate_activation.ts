import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_candidate_accounts_account_status" AS ENUM('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED');
    ALTER TYPE "public"."enum_outbox_events_event_type" ADD VALUE 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED';
    ALTER TYPE "public"."enum_message_deliveries_category" ADD VALUE 'ACCOUNT_ACTIVATION';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CANDIDATE_ACCOUNT_ACTIVATION_SENT' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'CANDIDATE_ACCOUNT_ACTIVATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';

    ALTER TABLE "candidate_accounts" ADD COLUMN "account_status" "enum_candidate_accounts_account_status" DEFAULT 'PENDING_ACTIVATION' NOT NULL;
    ALTER TABLE "candidate_accounts" ADD COLUMN "activation_version" numeric DEFAULT 0 NOT NULL;
    ALTER TABLE "candidate_accounts" ADD COLUMN "activation_nonce" varchar;
    ALTER TABLE "candidate_accounts" ADD COLUMN "activation_issued_at" timestamp(3) with time zone;
    ALTER TABLE "candidate_accounts" ADD COLUMN "activation_expires_at" timestamp(3) with time zone;
    ALTER TABLE "candidate_accounts" ADD COLUMN "activation_issued_by_id" integer;
    ALTER TABLE "candidate_accounts" ALTER COLUMN "citizenship" DROP NOT NULL;

    UPDATE "candidate_accounts"
      SET "account_status" = 'ACTIVE'
      WHERE "_verified" = true OR "verified_at" IS NOT NULL;

    ALTER TABLE "candidate_accounts" ADD CONSTRAINT "candidate_accounts_activation_issued_by_id_users_id_fk" FOREIGN KEY ("activation_issued_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "candidate_accounts_activation_issued_by_idx" ON "candidate_accounts" USING btree ("activation_issued_by_id");
    CREATE INDEX "candidate_accounts_account_status_idx" ON "candidate_accounts" USING btree ("account_status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "message_deliveries" WHERE "category" = 'ACCOUNT_ACTIVATION';
    DELETE FROM "outbox_events" WHERE "event_type" = 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED';
    DELETE FROM "audit_events" WHERE "event_type" IN ('CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED');

    DROP INDEX "candidate_accounts_activation_issued_by_idx";
    DROP INDEX "candidate_accounts_account_status_idx";
    ALTER TABLE "candidate_accounts" DROP CONSTRAINT "candidate_accounts_activation_issued_by_id_users_id_fk";
    ALTER TABLE "candidate_accounts" DROP COLUMN "account_status";
    ALTER TABLE "candidate_accounts" DROP COLUMN "activation_version";
    ALTER TABLE "candidate_accounts" DROP COLUMN "activation_nonce";
    ALTER TABLE "candidate_accounts" DROP COLUMN "activation_issued_at";
    ALTER TABLE "candidate_accounts" DROP COLUMN "activation_expires_at";
    ALTER TABLE "candidate_accounts" DROP COLUMN "activation_issued_by_id";
    UPDATE "candidate_accounts" SET "citizenship" = 'Nije uneto' WHERE "citizenship" IS NULL;
    ALTER TABLE "candidate_accounts" ALTER COLUMN "citizenship" SET NOT NULL;
    DROP TYPE "public"."enum_candidate_accounts_account_status";

    ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_outbox_events_event_type";
    CREATE TYPE "public"."enum_outbox_events_event_type" AS ENUM('MATERIAL_DELIVERY_REQUESTED', 'CONSULTATION_INVITATION_REQUESTED');
    ALTER TABLE "outbox_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_outbox_events_event_type" USING "event_type"::"public"."enum_outbox_events_event_type";

    ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE text;
    DROP TYPE "public"."enum_message_deliveries_category";
    CREATE TYPE "public"."enum_message_deliveries_category" AS ENUM('MATERIAL_BUNDLE', 'CONSULTATION_INVITATION');
    ALTER TABLE "message_deliveries" ALTER COLUMN "category" SET DATA TYPE "public"."enum_message_deliveries_category" USING "category"::"public"."enum_message_deliveries_category";

    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_event_type";
    CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM('PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED', 'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED', 'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED');
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  `)
}

