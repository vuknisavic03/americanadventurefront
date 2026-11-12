import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`DROP SEQUENCE IF EXISTS "public"."contract_number_sequence";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "public"."contract_number_sequence" START WITH 1 INCREMENT BY 1 NO CYCLE;`)
}
