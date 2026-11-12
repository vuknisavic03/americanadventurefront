import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_discount_groups_status" AS ENUM('ACTIVE', 'CLOSED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_brand_ambassadors_status" AS ENUM('ACTIVE', 'INACTIVE');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_discounts_discount_type" AS ENUM(
        'GROUP',
        'BRAND_AMBASSADOR',
        'FAMILY',
        'RETURNEE',
        'LIFEGUARD',
        'CUSTOM'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_discounts_status" AS ENUM(
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'APPLIED'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_discounts_group_member_role" AS ENUM('LEADER', 'MEMBER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_discounts_kinship_type" AS ENUM(
        'SIBLING',
        'TWIN',
        'PARENT_CHILD',
        'SPOUSE',
        'OTHER'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_discounts_lifeguard_certifying_body" AS ENUM(
        'RED_CROSS',
        'ELLIS',
        'YMCA',
        'STARGUARD',
        'OTHER'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DISCOUNT_CLAIMED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DISCOUNT_VERIFIED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DISCOUNT_REJECTED';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'DISCOUNT_APPLIED';

    CREATE TABLE IF NOT EXISTS "discount_groups" (
      "id" serial PRIMARY KEY NOT NULL,
      "group_code" varchar NOT NULL,
      "name" varchar NOT NULL,
      "discount_per_member_cents" integer DEFAULT 5000 NOT NULL,
      "min_members" integer DEFAULT 3 NOT NULL,
      "status" "enum_discount_groups_status" DEFAULT 'ACTIVE' NOT NULL,
      "notes" text,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "discount_groups_group_code_idx" ON "discount_groups" ("group_code");

    CREATE TABLE IF NOT EXISTS "brand_ambassadors" (
      "id" serial PRIMARY KEY NOT NULL,
      "referral_code" varchar NOT NULL,
      "full_name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar,
      "season" varchar DEFAULT '2026' NOT NULL,
      "default_discount_cents" integer DEFAULT 5000 NOT NULL,
      "reward_per_referral_cents" integer DEFAULT 2500 NOT NULL,
      "status" "enum_brand_ambassadors_status" DEFAULT 'ACTIVE' NOT NULL,
      "notes" text,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "brand_ambassadors_referral_code_idx" ON "brand_ambassadors" ("referral_code");

    CREATE TABLE IF NOT EXISTS "candidate_discounts" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_account_id" integer NOT NULL,
      "candidate_process_id" integer NOT NULL,
      "pre_application_id" integer NOT NULL,
      "discount_type" "enum_candidate_discounts_discount_type" NOT NULL,
      "status" "enum_candidate_discounts_status" DEFAULT 'PENDING' NOT NULL,
      "amount_cents" integer NOT NULL,
      "label" varchar NOT NULL,
      "discount_group_id" integer,
      "group_code" varchar,
      "group_member_role" "enum_candidate_discounts_group_member_role",
      "brand_ambassador_id" integer,
      "ambassador_code" varchar,
      "kinship_type" "enum_candidate_discounts_kinship_type",
      "relative_full_name" varchar,
      "relative_candidate_account_id" integer,
      "kinship_notes" text,
      "returnee_previous_year" integer,
      "returnee_previous_employer" varchar,
      "returnee_previous_sponsor" varchar,
      "lifeguard_certifying_body" "enum_candidate_discounts_lifeguard_certifying_body",
      "lifeguard_certificate_number" varchar,
      "lifeguard_valid_until" timestamp(3) with time zone,
      "admin_notes" text,
      "verification_note" varchar,
      "verified_by_id" integer,
      "verified_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "candidate_discounts_candidate_account_idx" ON "candidate_discounts" ("candidate_account_id");
    CREATE INDEX IF NOT EXISTS "candidate_discounts_candidate_process_idx" ON "candidate_discounts" ("candidate_process_id");
    CREATE INDEX IF NOT EXISTS "candidate_discounts_status_idx" ON "candidate_discounts" ("status");
    CREATE INDEX IF NOT EXISTS "candidate_discounts_discount_type_idx" ON "candidate_discounts" ("discount_type");

    DO $$ BEGIN
      ALTER TABLE "candidate_discounts" ADD CONSTRAINT "candidate_discounts_candidate_account_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_discounts" ADD CONSTRAINT "candidate_discounts_candidate_process_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_discounts" ADD CONSTRAINT "candidate_discounts_pre_application_id_fk" FOREIGN KEY ("pre_application_id") REFERENCES "public"."pre_applications"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_discounts" ADD CONSTRAINT "candidate_discounts_discount_group_id_fk" FOREIGN KEY ("discount_group_id") REFERENCES "public"."discount_groups"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_discounts" ADD CONSTRAINT "candidate_discounts_brand_ambassador_id_fk" FOREIGN KEY ("brand_ambassador_id") REFERENCES "public"."brand_ambassadors"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_discounts" ADD CONSTRAINT "candidate_discounts_relative_candidate_account_id_fk" FOREIGN KEY ("relative_candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_discounts" ADD CONSTRAINT "candidate_discounts_verified_by_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "candidate_discounts" CASCADE;
    DROP TABLE IF EXISTS "brand_ambassadors" CASCADE;
    DROP TABLE IF EXISTS "discount_groups" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_candidate_discounts_lifeguard_certifying_body";
    DROP TYPE IF EXISTS "public"."enum_candidate_discounts_kinship_type";
    DROP TYPE IF EXISTS "public"."enum_candidate_discounts_group_member_role";
    DROP TYPE IF EXISTS "public"."enum_candidate_discounts_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_discounts_discount_type";
    DROP TYPE IF EXISTS "public"."enum_brand_ambassadors_status";
    DROP TYPE IF EXISTS "public"."enum_discount_groups_status";
  `)
}
