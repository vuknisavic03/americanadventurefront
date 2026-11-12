import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_candidate_private_documents_document_type" ADD VALUE IF NOT EXISTS 'GUARANTOR_ID_CARD';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'GUARANTOR_DATA_SUBMITTED';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'GUARANTOR_ID_CARD_UPLOADED';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'GUARANTOR_VERIFIED';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'GUARANTOR_REJECTED';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'GUARANTOR_CONTRACT_GENERATED';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_guarantors_relationship" AS ENUM(
        'PARENT',
        'SIBLING',
        'SPOUSE',
        'RELATIVE',
        'OTHER'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_guarantors_employment_status" AS ENUM(
        'EMPLOYED',
        'RETIRED',
        'SELF_EMPLOYED'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_guarantors_status" AS ENUM(
        'PENDING_REVIEW',
        'VERIFIED',
        'REJECTED'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "public"."candidate_guarantors" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "candidate_process_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "sensitive_profile_id" integer NOT NULL,
      "full_name" varchar NOT NULL,
      "relationship" "public"."enum_candidate_guarantors_relationship" NOT NULL,
      "residential_address" varchar NOT NULL,
      "phone" varchar NOT NULL,
      "email" varchar NOT NULL,
      "employment_status" "public"."enum_candidate_guarantors_employment_status" NOT NULL,
      "employer_name" varchar NOT NULL,
      "job_title" varchar NOT NULL,
      "monthly_income_rsd" numeric NOT NULL,
      "promissory_notes_count" numeric DEFAULT 2 NOT NULL,
      "id_card_number" varchar NOT NULL,
      "id_card_issuer" varchar NOT NULL,
      "jmbg_ciphertext" varchar NOT NULL,
      "jmbg_iv" varchar NOT NULL,
      "jmbg_auth_tag" varchar NOT NULL,
      "jmbg_key_id" varchar NOT NULL,
      "jmbg_fingerprint" varchar NOT NULL,
      "id_card_document_id" integer,
      "status" "public"."enum_candidate_guarantors_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
      "submitted_at" timestamp(3) with time zone NOT NULL,
      "verified_at" timestamp(3) with time zone,
      "verified_by_id" integer,
      "rejection_reason" varchar,
      "contract_generated_at" timestamp(3) with time zone,
      "contract_pdf_file_name" varchar,
      "contract_pdf_size_bytes" numeric,
      "contract_pdf_sha256" varchar,
      "contract_pdf_ciphertext" varchar,
      "contract_pdf_iv" varchar,
      "contract_pdf_auth_tag" varchar,
      "contract_pdf_key_id" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "public"."candidate_guarantors"
        ADD CONSTRAINT "candidate_guarantors_candidate_account_id_candidate_accounts_id_fk"
        FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "public"."candidate_guarantors"
        ADD CONSTRAINT "candidate_guarantors_candidate_process_id_candidate_processes_id_fk"
        FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "public"."candidate_guarantors"
        ADD CONSTRAINT "candidate_guarantors_pre_application_id_pre_applications_id_fk"
        FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "public"."candidate_guarantors"
        ADD CONSTRAINT "candidate_guarantors_sensitive_profile_id_candidate_sensitive_profiles_id_fk"
        FOREIGN KEY ("sensitive_profile_id") REFERENCES "public"."candidate_sensitive_profiles"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "public"."candidate_guarantors"
        ADD CONSTRAINT "candidate_guarantors_id_card_document_id_candidate_private_documents_id_fk"
        FOREIGN KEY ("id_card_document_id") REFERENCES "public"."candidate_private_documents"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "public"."candidate_guarantors"
        ADD CONSTRAINT "candidate_guarantors_verified_by_id_users_id_fk"
        FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "candidate_guarantors_candidate_account_idx"
      ON "public"."candidate_guarantors" ("candidate_account_id");

    CREATE INDEX IF NOT EXISTS "candidate_guarantors_candidate_process_idx"
      ON "public"."candidate_guarantors" ("candidate_process_id");

    CREATE INDEX IF NOT EXISTS "candidate_guarantors_status_idx"
      ON "public"."candidate_guarantors" ("status");

    CREATE INDEX IF NOT EXISTS "candidate_guarantors_jmbg_fingerprint_idx"
      ON "public"."candidate_guarantors" ("jmbg_fingerprint");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "public"."candidate_guarantors" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_candidate_guarantors_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_guarantors_employment_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_guarantors_relationship";
  `)
}
