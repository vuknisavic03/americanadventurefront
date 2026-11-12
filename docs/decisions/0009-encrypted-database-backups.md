# ADR-0009: Encrypted logical backups and isolated recovery

- Status: Accepted for development tooling; production operating policy pending owner approval
- Date: 2026-09-05
- Requirements: NFR-007, NFR-004, BR-008; issue #29

## Decision

Use PostgreSQL 17 custom-format logical dumps, produced by pg_dump and restored by pg_restore.
The backup tool streams dumps into an AES-256-GCM envelope with a separate 32-byte backup key.
A versioned header (AABACK01), random 96-bit IV and 128-bit authentication tag protect the archive.
The header is authenticated as additional data. No plaintext dump is written during backup.

Backups and keys must be outside the repository. Keys use exclusive creation and private file
permissions. Archives are published only after pg_dump succeeds and authenticated encryption
finishes; an existing archive cannot be overwritten.

Restore verifies the full authentication tag before running database commands. It uses a private
temporary directory for the verified plaintext dump, creates a NEW database ending in
_restore_test, and restores in one transaction without ownership or privilege replay.
Existing databases are never cleaned or overwritten. On SQL failure, the newly created empty
database remains for inspection; no partially restored tables are committed.

This increment supplies a recovery rehearsal, not an automatic production failover. Promotion of
a recovered database and reconciliation of external side effects are explicit operator actions.

## Coverage and limitations

The current application stores encrypted passports and contract/document data in PostgreSQL.
Database dumps include those records, relationships, audit events, payments and migration history.
They do not include application source, PostgreSQL cluster roles, deployment settings, TLS material,
or keys. Future object storage requires a separately coordinated object backup.

The backup key is independent of PAYLOAD_SECRET, the sensitive-data encryption key ring and the
fingerprint key. All key versions needed by retained data and archives must remain recoverable from
a separate secret store. Losing either the archive key or relevant application key prevents recovery.

Logical dumps are a consistent database snapshot but offer no point-in-time recovery between dumps.
A production need for a shorter recovery point requires managed PostgreSQL backups/WAL archiving.
Large databases may need a different backup strategy; the initial drill uses a small synthetic dataset.

The restore host needs enough protected scratch space for the decompressed/decrypted dump. Private
permissions and cleanup do not guarantee secure erasure after process kill or host failure: use
encrypted scratch storage, restrict access, and inspect abandoned temporary directories.

## Evidence

The restore drill provisions two disposable PostgreSQL containers, runs migrations and the existing
synthetic browser workflow, backs up, restores and compares every public table's row count/digest,
sequence state, columns and constraints. A dedicated synthetic encrypted probe uses the actual
application encryption functions and a foreign key to a restored pre-application.

The drill also rejects a wrong archive key, a corrupted archive, missing application keys, overwrite
of an archive and reuse of an existing target database. Production schedule, retention, off-host
storage, alerting and RPO/RTO approval remain open under #29.
