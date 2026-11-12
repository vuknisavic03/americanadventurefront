# Database backup and recovery

Related: [ADR-0009](../decisions/0009-encrypted-database-backups.md), NFR-007, issue #29.
Run commands from the repository root using Node.js 22.18+ (the current Node 22 release in .nvmrc)
or Node 24 and PostgreSQL 17 tools. WSL/Linux is the verified operating environment.
Native Windows requires equivalent private directory ACLs; POSIX modes alone do not enforce them.

## Responsibilities and proposed production policy

The repository owner designates a primary operations owner and a deputy before production.
They must approve the storage destination, schedule, retention, recovery objectives and escalation
contacts. These settings are proposals, not an active backup service:

| Item | Initial proposal |
| --- | --- |
| Backup frequency | Daily and before risky releases; monitor every scheduled execution |
| Maximum acceptable lost work (RPO) | 24 hours, subject to business approval |
| Recovery deadline (RTO) | 4 hours, including verification and application recovery |
| Retention | 14 daily and 8 weekly copies, subject to privacy/accounting approval |
| Storage | Private encrypted off-host storage with versioning/immutability and access logging |
| Restore exercise | Monthly, and after backup, schema or key-management changes |

CI rehearsal does not back up development or production. No production scheduler, retention deletion,
off-host transfer or alerts are installed by this PR. Keep issue #29 open until they are provisioned,
approved and demonstrated. A missed backup must alert the owner and deputy; a successful command
without verified off-host delivery is not a successful scheduled production backup.

## Key custody

There are two distinct encryption layers. The archive key opens the backup. Application keys then
open the JMBG and documents inside the restored database.

Store each archive key version in an approved secret manager, separately from archives. Record its
non-secret version in the backup inventory. Retain all sensitive-data encryption key versions used
by retained records, SENSITIVE_DATA_FINGERPRINT_KEY and the deployment configuration securely.
PAYLOAD_SECRET and provider credentials belong in that separate configuration recovery plan.
Do not put .env or keys inside an archive folder or Git.

Generate a local development archive key once (do not replace an existing key):

    mkdir -p -m 700 "$HOME/.config/american-adventure" "$HOME/.local/state/american-adventure/backups"
    node scripts/database/backup.mjs keygen --key-file "$HOME/.config/american-adventure/backup.key"

The generated file is mode 600. The tool prints no key. For production, deliver a secret-manager
managed 32-byte base64 key as a private file and record its version. Rotate by using a new key file
for new archives while retaining the old key until every associated backup expires.

## Create a local encrypted backup

With the normal Compose database running:

    node scripts/database/backup.mjs create \
      --container american-adventure-database-1 --user american_adventure \
      --database american_adventure \
      --key-file "$HOME/.config/american-adventure/backup.key" \
      --output "$HOME/.local/state/american-adventure/backups/platform-$(date -u +%Y%m%dT%H%M%SZ).aab"

This reads the database; it does not run migrations. A completed archive is published atomically and
an existing filename is refused. File mode is 600. Failed attempts do not publish a final archive.

For a remote database, omit --container. Install the matching pg_dump/pg_restore/createdb tools and
configure libpq's PGHOST, PGPORT, PGUSER, PGPASSFILE and PGSSLMODE=verify-full with the server CA.
Do not use connection URLs or passwords in command arguments. Docker mode uses tools and local
socket authentication inside the explicitly named container.

Record UTC completion time, source environment, source PostgreSQL/tool version, application commit,
archive size/SHA-256, archive format, archive key version, required application-key versions and
verified off-host object location. Archive SHA-256 is an inventory check; authenticated encryption
is the integrity boundary. Check restore capability periodically rather than relying on a checksum.

## Restore without overwriting existing data

Use a separate PostgreSQL host/container with no application or outbound workers attached. Provide
an archive from a trusted source: PostgreSQL restore executes the SQL objects contained in the dump.
Match PostgreSQL major version and required extensions. Ensure adequate disk space before starting.

    node scripts/database/backup.mjs restore \
      --container YOUR_ISOLATED_RESTORE_CONTAINER --user american_adventure \
      --database rehearsal_20260905_restore_test \
      --key-file /secure/keys/backup.key \
      --input /secure/backups/platform.aab \
      --scratch-directory /secure/encrypted-scratch

The scratch directory must already exist outside the repository. Full archive authentication
finishes before createdb runs. The target name must end in _restore_test and must not already exist.
A failed SQL restore leaves a new empty database; select a new name for the next attempt after
investigating. The tool has no DROP, --clean or overwrite operation.

Normal exceptions remove private temporary files. A host crash or SIGKILL can leave a plaintext
scratch file: keep scratch storage encrypted and inaccessible to other users, inspect it after an
interrupted run and dispose of the exact abandoned directory under the operations procedure.
Errors are deliberately generic to avoid copying SQL values, connection secrets or personal data
into CI logs.

## Validate and recover the application

1. Compare expected data volume, migration history, key relationships and representative records.
2. Recover the correct application-key versions and verify decryption through authorized access.
3. Start the matching application revision in an isolated environment with email capture and outbound
   providers blocked. Test administrator/candidate access and ownership rules.
4. Review outbox events, queued jobs, email deliveries, contracts and payments against external
   provider records. A database rollback can replay work already completed outside the database.
   Reconcile those records before enabling workers or real providers.
5. Reconstruct cluster roles and least-privilege grants separately; this restore deliberately omits
   original ownership/privileges. Verify authentication and permissions before promotion.
6. Record checks, elapsed time, accepted data loss and operator approval. Switching application
   connections to the recovered database is a separate planned recovery step with rollback routing
   retained until acceptance.

Do not run a restored application with real outbound providers merely to test whether it starts.

## Automated synthetic rehearsal

Docker, npm dependencies and Chromium must be available:

    cd apps/platform
    npm ci
    npm run test:e2e:install
    npm run test:backup
    npm run test:restore

The drill creates uniquely named source/target containers. The source publishes a random loopback
port; the target has no Docker network. It runs migrations and existing synthetic E2E scenarios,
adds an encrypted recovery probe linked to a pre-application, then compares all tables, sequences,
columns and constraints after recovery. It also exercises wrong/missing keys, archive tampering
and overwrite refusal. No development database or real provider is used.

The report contains only synthetic metrics. Store a dated reviewed report under docs/verification;
CI also prints it. Both containers and temporary archives/keys are removed on normal completion.
The first successful [dated rehearsal](../verification/2026-09-05-database-restore.md) records
its tested scope and measured timings.
A forced interruption may leave test resources: locate the exact names with
docker ps --filter label=american-adventure.purpose=restore-drill, inspect them, then remove only
those disposable containers. Never remove the normal database volume as part of this drill.

A small synthetic restore time is not a production RTO measurement. Repeat on a representative
protected dataset and the chosen off-host storage before production acceptance.

## Reference

PostgreSQL documents [consistent logical dumps](https://www.postgresql.org/docs/17/app-pgdump.html)
and [transactional restoration](https://www.postgresql.org/docs/17/app-pgrestore.html).
