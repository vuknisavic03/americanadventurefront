import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_communication_logs_channel" AS ENUM('EMAIL', 'SMS', 'IN_APP');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_communication_logs_status" AS ENUM('DELIVERED', 'FAILED', 'PENDING');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_COMMUNICATION_SENT';
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_BATCH_COMMUNICATION_SENT';

    CREATE TABLE IF NOT EXISTS "communication_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "channel" "enum_communication_logs_channel" NOT NULL,
      "candidate_process_id" integer,
      "candidate_account_id" integer,
      "recipient" varchar NOT NULL,
      "recipient_name" varchar,
      "subject" varchar,
      "body" varchar NOT NULL,
      "template_key" varchar,
      "status" "enum_communication_logs_status" DEFAULT 'DELIVERED' NOT NULL,
      "provider" varchar,
      "provider_message_id" varchar,
      "idempotency_key" varchar,
      "action_required_title" varchar,
      "action_required_due_at" timestamp(3) with time zone,
      "is_read" boolean DEFAULT false,
      "sent_by_id" integer,
      "sent_at" timestamp(3) with time zone NOT NULL,
      "error_message" varchar,
      "metadata" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_candidate_process_id_fk" FOREIGN KEY ("candidate_process_id") REFERENCES "public"."candidate_processes"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_candidate_account_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."candidate_accounts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_sent_by_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "communication_logs_candidate_process_idx" ON "communication_logs" ("candidate_process_id");
    CREATE INDEX IF NOT EXISTS "communication_logs_candidate_account_idx" ON "communication_logs" ("candidate_account_id");
    CREATE INDEX IF NOT EXISTS "communication_logs_channel_idx" ON "communication_logs" ("channel");
    CREATE INDEX IF NOT EXISTS "communication_logs_status_idx" ON "communication_logs" ("status");
    CREATE INDEX IF NOT EXISTS "communication_logs_idempotency_key_idx" ON "communication_logs" ("idempotency_key");
    CREATE INDEX IF NOT EXISTS "communication_logs_sent_at_idx" ON "communication_logs" ("sent_at");
    CREATE INDEX IF NOT EXISTS "communication_logs_created_at_idx" ON "communication_logs" ("created_at");
    CREATE INDEX IF NOT EXISTS "communication_logs_is_read_idx" ON "communication_logs" ("is_read");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "communication_logs" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_communication_logs_channel";
    DROP TYPE IF EXISTS "public"."enum_communication_logs_status";
  `)
}
