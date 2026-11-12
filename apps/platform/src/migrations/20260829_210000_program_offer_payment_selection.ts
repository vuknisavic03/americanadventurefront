import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_program_offers_program_code" AS ENUM('SWT');
    CREATE TYPE "public"."enum_program_offers_status" AS ENUM('DRAFT', 'PUBLISHED', 'ACCEPTED', 'WITHDRAWN');
    CREATE TYPE "public"."enum_program_offers_currency" AS ENUM('USD');
    CREATE TYPE "public"."enum_program_offer_selections_selected_method" AS ENUM('ONE_TIME', 'INSTALLMENTS', 'PAY_WHEN_YOU_EARN');
    CREATE TYPE "public"."enum_program_offer_selections_currency" AS ENUM('USD');
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_OFFER_DRAFTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_OFFER_PUBLISHED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PROGRAM_OFFER_WITHDRAWN' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PAYMENT_METHOD_SELECTED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';

    CREATE TABLE "program_offers" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "candidate_process_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "program_code" "enum_program_offers_program_code" DEFAULT 'SWT' NOT NULL,
      "status" "enum_program_offers_status" DEFAULT 'DRAFT' NOT NULL,
      "currency" "enum_program_offers_currency" DEFAULT 'USD' NOT NULL,
      "base_price_cents" numeric NOT NULL,
      "one_time_enabled" boolean DEFAULT true,
      "one_time_discount_label" varchar,
      "one_time_discount_cents" numeric DEFAULT 0,
      "installments_enabled" boolean DEFAULT false,
      "pay_when_you_earn_enabled" boolean DEFAULT false,
      "pay_when_you_earn_deposit_cents" numeric,
      "pay_when_you_earn_deferred_amount_cents" numeric,
      "pay_when_you_earn_description" varchar,
      "valid_until" timestamp(3) with time zone NOT NULL,
      "commercial_version" numeric DEFAULT 1 NOT NULL,
      "created_by_id" integer,
      "published_at" timestamp(3) with time zone,
      "published_by_id" integer,
      "withdrawn_at" timestamp(3) with time zone,
      "withdrawn_by_id" integer,
      "accepted_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "program_offers_installments_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "amount_cents" numeric NOT NULL,
      "due_at" timestamp(3) with time zone NOT NULL
    );

    CREATE TABLE "program_offer_selections" (
      "id" serial PRIMARY KEY NOT NULL,
      "offer_id" integer NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "candidate_process_id" integer NOT NULL,
      "selected_method" "enum_program_offer_selections_selected_method" NOT NULL,
      "currency" "enum_program_offer_selections_currency" NOT NULL,
      "base_price_cents" numeric NOT NULL,
      "discount_cents" numeric NOT NULL,
      "total_cents" numeric NOT NULL,
      "installment_schedule" jsonb,
      "pay_when_you_earn_snapshot" jsonb,
      "offer_snapshot" jsonb NOT NULL,
      "accepted_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "program_offers_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "program_offer_selections_id" integer;

    ALTER TABLE "program_offers" ADD CONSTRAINT "program_offers_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offers" ADD CONSTRAINT "program_offers_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offers" ADD CONSTRAINT "program_offers_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offers" ADD CONSTRAINT "program_offers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offers" ADD CONSTRAINT "program_offers_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offers" ADD CONSTRAINT "program_offers_withdrawn_by_id_users_id_fk" FOREIGN KEY ("withdrawn_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offers_installments_items" ADD CONSTRAINT "program_offers_installments_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."program_offers"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "program_offer_selections" ADD CONSTRAINT "program_offer_selections_offer_id_program_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."program_offers"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offer_selections" ADD CONSTRAINT "program_offer_selections_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "program_offer_selections" ADD CONSTRAINT "program_offer_selections_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_program_offers_fk" FOREIGN KEY ("program_offers_id") REFERENCES "public"."program_offers"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_program_offer_selections_fk" FOREIGN KEY ("program_offer_selections_id") REFERENCES "public"."program_offer_selections"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "program_offers_candidate_account_idx" ON "program_offers" USING btree ("candidate_account_id");
    CREATE INDEX "program_offers_candidate_process_idx" ON "program_offers" USING btree ("candidate_process_id");
    CREATE INDEX "program_offers_pre_application_idx" ON "program_offers" USING btree ("pre_application_id");
    CREATE INDEX "program_offers_created_by_idx" ON "program_offers" USING btree ("created_by_id");
    CREATE INDEX "program_offers_published_by_idx" ON "program_offers" USING btree ("published_by_id");
    CREATE INDEX "program_offers_withdrawn_by_idx" ON "program_offers" USING btree ("withdrawn_by_id");
    CREATE INDEX "program_offers_updated_at_idx" ON "program_offers" USING btree ("updated_at");
    CREATE INDEX "program_offers_created_at_idx" ON "program_offers" USING btree ("created_at");
    CREATE UNIQUE INDEX "program_offers_one_active_per_process_idx" ON "program_offers" USING btree ("candidate_process_id") WHERE "status" IN ('PUBLISHED', 'ACCEPTED');
    CREATE INDEX "program_offers_installments_items_order_idx" ON "program_offers_installments_items" USING btree ("_order");
    CREATE INDEX "program_offers_installments_items_parent_id_idx" ON "program_offers_installments_items" USING btree ("_parent_id");
    CREATE UNIQUE INDEX "program_offer_selections_offer_idx" ON "program_offer_selections" USING btree ("offer_id");
    CREATE INDEX "program_offer_selections_candidate_account_idx" ON "program_offer_selections" USING btree ("candidate_account_id");
    CREATE UNIQUE INDEX "program_offer_selections_candidate_process_idx" ON "program_offer_selections" USING btree ("candidate_process_id");
    CREATE INDEX "program_offer_selections_updated_at_idx" ON "program_offer_selections" USING btree ("updated_at");
    CREATE INDEX "program_offer_selections_created_at_idx" ON "program_offer_selections" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_program_offers_id_idx" ON "payload_locked_documents_rels" USING btree ("program_offers_id");
    CREATE INDEX "payload_locked_documents_rels_program_offer_selections_id_idx" ON "payload_locked_documents_rels" USING btree ("program_offer_selections_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "audit_events" WHERE "event_type" IN ('PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED', 'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED');

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_program_offer_selections_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_program_offers_fk";
    DROP INDEX "payload_locked_documents_rels_program_offer_selections_id_idx";
    DROP INDEX "payload_locked_documents_rels_program_offers_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "program_offer_selections_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "program_offers_id";

    DROP TABLE "program_offer_selections" CASCADE;
    DROP TABLE "program_offers_installments_items" CASCADE;
    DROP TABLE "program_offers" CASCADE;
    DROP TYPE "public"."enum_program_offer_selections_currency";
    DROP TYPE "public"."enum_program_offer_selections_selected_method";
    DROP TYPE "public"."enum_program_offers_currency";
    DROP TYPE "public"."enum_program_offers_status";
    DROP TYPE "public"."enum_program_offers_program_code";

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
      'CANDIDATE_PROFILE_UPDATED',
      'CANDIDATE_PROCESS_UPDATED',
      'CANDIDATE_ACCOUNT_REGISTERED',
      'CANDIDATE_MESSAGE_FAILED',
      'APPLICANT_REJECTED',
      'ADMIN_ACTION_REJECTED'
    );
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  `)
}
