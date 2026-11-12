import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_candidate_payment_plans_selected_method" AS ENUM('ONE_TIME', 'INSTALLMENTS', 'PAY_WHEN_YOU_EARN');
    CREATE TYPE "public"."enum_candidate_payment_plans_currency" AS ENUM('USD');
    CREATE TYPE "public"."enum_candidate_payment_plans_first_payment_status" AS ENUM('PENDING', 'CONFIRMED', 'NOT_REQUIRED');
    CREATE TYPE "public"."enum_candidate_payment_plans_status" AS ENUM('ACTIVE', 'PAID');
    CREATE TYPE "public"."enum_candidate_payments_entry_type" AS ENUM('PAYMENT', 'REVERSAL');
    CREATE TYPE "public"."enum_candidate_payments_currency" AS ENUM('USD');

    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PAYMENT_PLAN_CREATED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PAYMENT_RECORDED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'PAYMENT_REVERSED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE 'INITIAL_PAYMENT_CONFIRMED' BEFORE 'CANDIDATE_ACCOUNT_REGISTERED';

    CREATE TABLE "candidate_payment_plans" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "candidate_process_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "program_offer_selection_id" integer NOT NULL,
      "contract_acceptance_id" integer NOT NULL,
      "selected_method" "enum_candidate_payment_plans_selected_method" NOT NULL,
      "currency" "enum_candidate_payment_plans_currency" NOT NULL,
      "total_cents" numeric NOT NULL,
      "first_payment_required_cents" numeric NOT NULL,
      "obligations" jsonb NOT NULL,
      "paid_cents" numeric NOT NULL,
      "remaining_cents" numeric NOT NULL,
      "first_payment_status" "enum_candidate_payment_plans_first_payment_status" NOT NULL,
      "first_payment_confirmed_at" timestamp(3) with time zone,
      "status" "enum_candidate_payment_plans_status" NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "candidate_payments" (
      "id" serial PRIMARY KEY NOT NULL,
      "payment_plan_id" integer NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "recorded_by_id" integer NOT NULL,
      "entry_type" "enum_candidate_payments_entry_type" NOT NULL,
      "amount_cents" numeric NOT NULL,
      "currency" "enum_candidate_payments_currency" NOT NULL,
      "received_at" timestamp(3) with time zone NOT NULL,
      "payment_reference" varchar NOT NULL,
      "external_reference" varchar,
      "note" varchar,
      "idempotency_key" varchar NOT NULL,
      "reverses_payment_id" integer,
      "reversal_reason" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_payment_plans_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_payments_id" integer;
    ALTER TABLE "candidate_payment_plans" ADD CONSTRAINT "candidate_payment_plans_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payment_plans" ADD CONSTRAINT "candidate_payment_plans_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payment_plans" ADD CONSTRAINT "candidate_payment_plans_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payment_plans" ADD CONSTRAINT "candidate_payment_plans_program_offer_selection_id_program_offer_selections_id_fk" FOREIGN KEY ("program_offer_selection_id") REFERENCES "public"."program_offer_selections"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payment_plans" ADD CONSTRAINT "candidate_payment_plans_contract_acceptance_id_contract_acceptances_id_fk" FOREIGN KEY ("contract_acceptance_id") REFERENCES "public"."contract_acceptances"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payments" ADD CONSTRAINT "candidate_payments_payment_plan_id_candidate_payment_plans_id_fk" FOREIGN KEY ("payment_plan_id") REFERENCES "public"."candidate_payment_plans"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payments" ADD CONSTRAINT "candidate_payments_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payments" ADD CONSTRAINT "candidate_payments_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payments" ADD CONSTRAINT "candidate_payments_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "candidate_payments" ADD CONSTRAINT "candidate_payments_reverses_payment_id_candidate_payments_id_fk" FOREIGN KEY ("reverses_payment_id") REFERENCES "public"."candidate_payments"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_payment_plans_fk" FOREIGN KEY ("candidate_payment_plans_id") REFERENCES "public"."candidate_payment_plans"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_payments_fk" FOREIGN KEY ("candidate_payments_id") REFERENCES "public"."candidate_payments"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "candidate_payment_plans_candidate_account_idx" ON "candidate_payment_plans" USING btree ("candidate_account_id");
    CREATE UNIQUE INDEX "candidate_payment_plans_candidate_process_idx" ON "candidate_payment_plans" USING btree ("candidate_process_id");
    CREATE INDEX "candidate_payment_plans_pre_application_idx" ON "candidate_payment_plans" USING btree ("pre_application_id");
    CREATE UNIQUE INDEX "candidate_payment_plans_program_offer_selection_idx" ON "candidate_payment_plans" USING btree ("program_offer_selection_id");
    CREATE UNIQUE INDEX "candidate_payment_plans_contract_acceptance_idx" ON "candidate_payment_plans" USING btree ("contract_acceptance_id");
    CREATE INDEX "candidate_payment_plans_updated_at_idx" ON "candidate_payment_plans" USING btree ("updated_at");
    CREATE INDEX "candidate_payment_plans_created_at_idx" ON "candidate_payment_plans" USING btree ("created_at");
    CREATE INDEX "candidate_payments_payment_plan_idx" ON "candidate_payments" USING btree ("payment_plan_id");
    CREATE INDEX "candidate_payments_candidate_account_idx" ON "candidate_payments" USING btree ("candidate_account_id");
    CREATE INDEX "candidate_payments_pre_application_idx" ON "candidate_payments" USING btree ("pre_application_id");
    CREATE INDEX "candidate_payments_recorded_by_idx" ON "candidate_payments" USING btree ("recorded_by_id");
    CREATE UNIQUE INDEX "candidate_payments_payment_reference_idx" ON "candidate_payments" USING btree ("payment_reference");
    CREATE UNIQUE INDEX "candidate_payments_idempotency_key_idx" ON "candidate_payments" USING btree ("idempotency_key");
    CREATE UNIQUE INDEX "candidate_payments_reverses_payment_idx" ON "candidate_payments" USING btree ("reverses_payment_id");
    CREATE INDEX "candidate_payments_updated_at_idx" ON "candidate_payments" USING btree ("updated_at");
    CREATE INDEX "candidate_payments_created_at_idx" ON "candidate_payments" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_candidate_payment_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_payment_plans_id");
    CREATE INDEX "payload_locked_documents_rels_candidate_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_payments_id");

    INSERT INTO "candidate_payment_plans" (
      "candidate_account_id", "candidate_process_id", "pre_application_id",
      "program_offer_selection_id", "contract_acceptance_id", "selected_method", "currency",
      "total_cents", "first_payment_required_cents", "obligations", "paid_cents", "remaining_cents",
      "first_payment_status", "first_payment_confirmed_at", "status", "updated_at", "created_at"
    )
    SELECT
      selection."candidate_account_id", selection."candidate_process_id", acceptance."pre_application_id",
      selection."id", acceptance."id",
      selection."selected_method"::text::"enum_candidate_payment_plans_selected_method",
      selection."currency"::text::"enum_candidate_payment_plans_currency",
      selection."total_cents",
      CASE
        WHEN selection."selected_method" = 'INSTALLMENTS' THEN COALESCE((selection."installment_schedule"->0->>'amountCents')::numeric, 0)
        WHEN selection."selected_method" = 'PAY_WHEN_YOU_EARN' THEN COALESCE((selection."pay_when_you_earn_snapshot"->>'depositCents')::numeric, 0)
        ELSE selection."total_cents"
      END,
      CASE
        WHEN selection."selected_method" = 'INSTALLMENTS' THEN COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'amountCents', (item.value->>'amountCents')::numeric, 'dueAt', item.value->'dueAt',
            'key', 'installment-' || item.ordinality,
            'kind', CASE WHEN item.ordinality = 1 THEN 'INITIAL' ELSE 'INSTALLMENT' END,
            'label', COALESCE(item.value->>'label', 'Rata ' || item.ordinality)
          ) ORDER BY item.ordinality)
          FROM jsonb_array_elements(COALESCE(selection."installment_schedule", '[]'::jsonb)) WITH ORDINALITY AS item(value, ordinality)
        ), '[]'::jsonb)
        WHEN selection."selected_method" = 'PAY_WHEN_YOU_EARN' THEN jsonb_build_array(
          jsonb_build_object('amountCents', COALESCE((selection."pay_when_you_earn_snapshot"->>'depositCents')::numeric, 0), 'dueAt', to_jsonb(acceptance."accepted_at"), 'key', 'pkz-deposit', 'kind', 'INITIAL', 'label', 'Početna PKZ uplata'),
          jsonb_build_object('amountCents', COALESCE((selection."pay_when_you_earn_snapshot"->>'deferredAmountCents')::numeric, 0), 'dueAt', null, 'key', 'pkz-deferred', 'kind', 'DEFERRED', 'label', 'Odloženi PKZ iznos')
        )
        ELSE jsonb_build_array(jsonb_build_object('amountCents', selection."total_cents", 'dueAt', to_jsonb(acceptance."accepted_at"), 'key', 'one-time', 'kind', 'INITIAL', 'label', 'Jednokratna uplata'))
      END,
      0, selection."total_cents",
      CASE
        WHEN selection."selected_method" = 'PAY_WHEN_YOU_EARN' AND COALESCE((selection."pay_when_you_earn_snapshot"->>'depositCents')::numeric, 0) = 0 THEN 'NOT_REQUIRED'::"enum_candidate_payment_plans_first_payment_status"
        ELSE 'PENDING'::"enum_candidate_payment_plans_first_payment_status"
      END,
      CASE
        WHEN selection."selected_method" = 'PAY_WHEN_YOU_EARN' AND COALESCE((selection."pay_when_you_earn_snapshot"->>'depositCents')::numeric, 0) = 0 THEN acceptance."accepted_at"
        ELSE null
      END,
      CASE WHEN selection."total_cents" = 0 THEN 'PAID' ELSE 'ACTIVE' END::"enum_candidate_payment_plans_status",
      acceptance."accepted_at", acceptance."accepted_at"
    FROM "contract_acceptances" acceptance
    INNER JOIN "generated_contracts" contract ON contract."id" = acceptance."contract_id"
    INNER JOIN "program_offer_selections" selection ON selection."id" = contract."program_offer_selection_id";

    UPDATE "candidate_processes" process
    SET "current_step" = 'PROGRAM_APPLICATION', "current_step_started_at" = now(),
      "next_action_title" = 'Nastavite programsku aplikaciju',
      "next_action_description" = 'Početna uplata nije potrebna prema prihvaćenom modelu plaćanja. Možete nastaviti sa detaljnom prijavom za program.',
      "next_action_due_at" = null, "progress_version" = process."progress_version" + 1,
      "progress_updated_at" = now(), "updated_at" = now()
    FROM "candidate_payment_plans" plan
    WHERE plan."candidate_process_id" = process."id"
      AND plan."first_payment_status" = 'NOT_REQUIRED'
      AND process."current_step" = 'INITIAL_PAYMENT';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "audit_events" WHERE "event_type" IN ('PAYMENT_PLAN_CREATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'INITIAL_PAYMENT_CONFIRMED');
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_payment_plans_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_payments_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_payment_plans_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_payments_id";
    DROP TABLE "candidate_payments" CASCADE;
    DROP TABLE "candidate_payment_plans" CASCADE;
    DROP TYPE "public"."enum_candidate_payment_plans_selected_method";
    DROP TYPE "public"."enum_candidate_payment_plans_currency";
    DROP TYPE "public"."enum_candidate_payment_plans_first_payment_status";
    DROP TYPE "public"."enum_candidate_payment_plans_status";
    DROP TYPE "public"."enum_candidate_payments_entry_type";
    DROP TYPE "public"."enum_candidate_payments_currency";

    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE "public"."enum_audit_events_event_type";
    CREATE TYPE "public"."enum_audit_events_event_type" AS ENUM(
      'PRE_APPLICATION_SUBMITTED', 'REVIEW_STARTED', 'CONTACT_ATTEMPT_RECORDED', 'APPLICANT_QUALIFIED',
      'MATERIALS_DELIVERED', 'CONSULTATION_INVITATION_DELIVERED', 'CONSULTATION_SCHEDULED',
      'CONSULTATION_RESCHEDULED', 'CONSULTATION_CANCELLED', 'CONSULTATION_COMPLETED',
      'CONSULTATION_NO_SHOW', 'PROFILE_READINESS_APPROVED', 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED',
      'CANDIDATE_ACCOUNT_ACTIVATION_SENT', 'CANDIDATE_ACCOUNT_ACTIVATED', 'CANDIDATE_PROFILE_UPDATED',
      'CANDIDATE_PROCESS_UPDATED', 'PROGRAM_OFFER_DRAFTED', 'PROGRAM_OFFER_PUBLISHED',
      'PROGRAM_OFFER_WITHDRAWN', 'PAYMENT_METHOD_SELECTED', 'SENSITIVE_PROFILE_UPDATED',
      'PRIVATE_DOCUMENT_UPLOADED', 'PRIVATE_DOCUMENT_ACCESSED', 'PRIVATE_DOCUMENT_VERIFIED',
      'PRIVATE_DOCUMENT_REJECTED', 'CONTRACT_READINESS_ACHIEVED', 'CONTRACT_TEMPLATE_DRAFTED',
      'CONTRACT_TEMPLATE_ACTIVATED', 'CONTRACT_TEMPLATE_RETIRED', 'CONTRACT_GENERATED',
      'CONTRACT_ACCESSED', 'CONTRACT_ACCEPTED', 'ACCEPTED_CONTRACT_ACCESSED',
      'CANDIDATE_ACCOUNT_REGISTERED', 'CANDIDATE_MESSAGE_FAILED', 'APPLICANT_REJECTED', 'ADMIN_ACTION_REJECTED'
    );
    ALTER TABLE "audit_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_audit_events_event_type" USING "event_type"::"public"."enum_audit_events_event_type";
  `)
}
