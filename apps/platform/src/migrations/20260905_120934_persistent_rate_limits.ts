import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "request_rate_limits" (
    "id" serial PRIMARY KEY NOT NULL,
    "scope" varchar NOT NULL,
    "key_hash" varchar NOT NULL,
    "attempts" numeric NOT NULL,
    "window_started_at" timestamp(3) with time zone NOT NULL,
    "expires_at" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
  );

  CREATE INDEX "request_rate_limits_expires_at_idx" ON "request_rate_limits" USING btree ("expires_at");
  CREATE UNIQUE INDEX "scope_keyHash_idx" ON "request_rate_limits" USING btree ("scope","key_hash");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "request_rate_limits" CASCADE;`)
}
