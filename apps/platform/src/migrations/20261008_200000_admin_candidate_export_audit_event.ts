import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'CANDIDATE_DATA_EXPORTED';
  `)
}

export async function down(): Promise<void> {
  // PostgreSQL does not support dropping individual enum values safely without table rewrite.
}
