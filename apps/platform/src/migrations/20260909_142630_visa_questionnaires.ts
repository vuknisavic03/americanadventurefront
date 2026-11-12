import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_visa_questionnaires_status" AS ENUM('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'REVIEWED');
  ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'VISA_QUESTIONNAIRE_UPDATED' BEFORE 'VISA_PAYMENT_RECORDED';
  CREATE TABLE "visa_questionnaires" (
    "id" serial PRIMARY KEY NOT NULL,
    "candidate_process_id" integer NOT NULL,
    "candidate_account_id" integer NOT NULL,
    "payment_order_id" integer NOT NULL,
    "schema_version" numeric NOT NULL,
    "revision" numeric NOT NULL,
    "status" "enum_visa_questionnaires_status" NOT NULL,
    "encrypted_content" jsonb NOT NULL,
    "submitted_at" timestamp(3) with time zone,
    "reviewed_at" timestamp(3) with time zone,
    "reviewed_by_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "visa_questionnaires_id" integer;
  ALTER TABLE "visa_questionnaires" ADD CONSTRAINT "visa_questionnaires_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_questionnaires" ADD CONSTRAINT "visa_questionnaires_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_questionnaires" ADD CONSTRAINT "visa_questionnaires_payment_order_id_visa_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."visa_payment_orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "visa_questionnaires" ADD CONSTRAINT "visa_questionnaires_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "visa_questionnaires_candidate_process_idx" ON "visa_questionnaires" USING btree ("candidate_process_id");
  CREATE INDEX "visa_questionnaires_candidate_account_idx" ON "visa_questionnaires" USING btree ("candidate_account_id");
  CREATE INDEX "visa_questionnaires_payment_order_idx" ON "visa_questionnaires" USING btree ("payment_order_id");
  CREATE INDEX "visa_questionnaires_reviewed_by_idx" ON "visa_questionnaires" USING btree ("reviewed_by_id");
  CREATE INDEX "visa_questionnaires_updated_at_idx" ON "visa_questionnaires" USING btree ("updated_at");
  CREATE INDEX "visa_questionnaires_created_at_idx" ON "visa_questionnaires" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_visa_questionnaires_fk" FOREIGN KEY ("visa_questionnaires_id") REFERENCES "public"."visa_questionnaires"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_visa_questionnaires_id_idx" ON "payload_locked_documents_rels" USING btree ("visa_questionnaires_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Preserve candidate submissions: rollback requires an empty questionnaire table.
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM visa_questionnaires) THEN
        RAISE EXCEPTION 'Cannot roll back visa questionnaires while candidate data exists. Export and review recovery first.';
      END IF;
    END $$;
    ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT payload_locked_documents_rels_visa_questionnaires_fk;
    DROP INDEX payload_locked_documents_rels_visa_questionnaires_id_idx;
    ALTER TABLE payload_locked_documents_rels DROP COLUMN visa_questionnaires_id;
    DROP TABLE visa_questionnaires;
    DROP TYPE public.enum_visa_questionnaires_status;
  `)
  // Keep the audit enum value so historical audit events remain readable.
}
