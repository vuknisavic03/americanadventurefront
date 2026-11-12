import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_audit_events_event_type" ADD VALUE IF NOT EXISTS 'PAYMENT_REMINDER_SENT';
  `)
}

export async function down(): Promise<void> {
  // PostgreSQL does not support removing values from an enum type safely without recreating it.
}
