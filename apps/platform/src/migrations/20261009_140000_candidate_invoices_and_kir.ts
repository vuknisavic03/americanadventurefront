import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_invoices_original_currency" AS ENUM('USD', 'EUR', 'RSD');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'INVOICE_GENERATED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'FINANCIAL_REPORT_EXPORTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PAYMENT_SLIP_GENERATED';

    CREATE TABLE IF NOT EXISTS "candidate_invoices" (
      "id" serial PRIMARY KEY NOT NULL,
      "invoice_number" varchar NOT NULL,
      "sequence_number" integer NOT NULL,
      "year" integer NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "candidate_process_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "candidate_payment_id" integer NOT NULL,
      "issued_by_id" integer NOT NULL,
      "buyer_name" varchar NOT NULL,
      "buyer_address" varchar NOT NULL,
      "buyer_tax_id" varchar,
      "original_amount_cents" integer NOT NULL,
      "original_currency" "enum_candidate_invoices_original_currency" DEFAULT 'USD' NOT NULL,
      "exchange_rate_scaled" integer NOT NULL,
      "exchange_rate_date" timestamp(3) with time zone NOT NULL,
      "exchange_rate_source" varchar,
      "settlement_amount_rsd_cents" integer NOT NULL,
      "amount_in_words" varchar NOT NULL,
      "issue_date" timestamp(3) with time zone NOT NULL,
      "accounting_date" timestamp(3) with time zone NOT NULL,
      "note" varchar,
      "pdf_sha256" varchar NOT NULL,
      "pdf_base64" text,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "candidate_invoices_invoice_number_idx" ON "candidate_invoices" ("invoice_number");
    CREATE UNIQUE INDEX IF NOT EXISTS "candidate_invoices_candidate_payment_idx" ON "candidate_invoices" ("candidate_payment_id");
    CREATE INDEX IF NOT EXISTS "candidate_invoices_year_seq_idx" ON "candidate_invoices" ("year", "sequence_number");
    CREATE INDEX IF NOT EXISTS "candidate_invoices_candidate_account_idx" ON "candidate_invoices" ("candidate_account_id");

    DO $$ BEGIN
      ALTER TABLE "candidate_invoices" ADD CONSTRAINT "candidate_invoices_candidate_account_id_candidate_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_invoices" ADD CONSTRAINT "candidate_invoices_candidate_process_id_candidate_processes_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_invoices" ADD CONSTRAINT "candidate_invoices_pre_application_id_pre_applications_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_invoices" ADD CONSTRAINT "candidate_invoices_candidate_payment_id_candidate_payments_id_fk" FOREIGN KEY ("candidate_payment_id") REFERENCES "public"."candidate_payments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_invoices" ADD CONSTRAINT "candidate_invoices_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "candidate_invoices" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_candidate_invoices_original_currency";
  `)
}
