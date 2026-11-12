import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidate_sensitive_profiles" DROP COLUMN IF EXISTS "personal_id_masked";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidate_sensitive_profiles" ADD COLUMN IF NOT EXISTS "personal_id_masked" varchar;
  `)
}
