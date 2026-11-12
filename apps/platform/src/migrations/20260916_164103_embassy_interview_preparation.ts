import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_interview_preparation_appointments_purpose" AS ENUM('JOB_INTERVIEW', 'EMBASSY');
  DROP INDEX "candidateProcess_attemptNumber_idx";
  ALTER TABLE "interview_preparation_appointments" ADD COLUMN "purpose" "enum_interview_preparation_appointments_purpose" DEFAULT 'JOB_INTERVIEW' NOT NULL;
  CREATE UNIQUE INDEX "candidateProcess_purpose_attemptNumber_idx" ON "interview_preparation_appointments" USING btree ("candidate_process_id","purpose","attempt_number");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM "interview_preparation_appointments" WHERE "purpose" = 'EMBASSY') THEN
       RAISE EXCEPTION 'Cannot roll back FR-055 while embassy preparation records exist. Preserve the records and roll forward instead.';
     END IF;
   END $$;
  DROP INDEX "candidateProcess_purpose_attemptNumber_idx";
  CREATE UNIQUE INDEX "candidateProcess_attemptNumber_idx" ON "interview_preparation_appointments" USING btree ("candidate_process_id","attempt_number");
  ALTER TABLE "interview_preparation_appointments" DROP COLUMN "purpose";
  DROP TYPE "public"."enum_interview_preparation_appointments_purpose";`)
}
