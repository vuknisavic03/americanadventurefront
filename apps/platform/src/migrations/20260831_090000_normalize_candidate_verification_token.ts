import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'candidate_accounts'
          AND column_name = '_verification_token'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'candidate_accounts'
          AND column_name = '_verificationtoken'
      ) THEN
        ALTER TABLE "candidate_accounts" RENAME COLUMN "_verification_token" TO "_verificationtoken";
      ELSIF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'candidate_accounts'
          AND column_name = '_verification_token'
      ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'candidate_accounts'
          AND column_name = '_verificationtoken'
      ) THEN
        UPDATE "candidate_accounts"
        SET "_verificationtoken" = COALESCE("_verificationtoken", "_verification_token");
        ALTER TABLE "candidate_accounts" DROP COLUMN "_verification_token";
      END IF;
    END $$;
  `)
}

export async function down(): Promise<void> {
  // Compatibility repair: reverting the column name would break the current Payload auth schema.
}

