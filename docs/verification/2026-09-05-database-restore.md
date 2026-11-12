# Restore rehearsal — 2026-09-05

- Result: PASS
- Executed: 2026-09-05 13:19:28 UTC
- Environment: WSL Ubuntu, Node.js 24.19.0, Docker, PostgreSQL 17.11
- Source revision: working tree on chore/database-backup-restore, based on main 23e19984490aeba157a190d0ce7f39d1a30274c6
- Command: npm run test:backup followed by npm run test:restore from apps/platform

## Evidence

Two backup safety tests and the full isolated recovery rehearsal passed. The source was freshly
migrated and populated by the existing four integration/E2E scenarios. The source and destination
were disposable containers; the normal development database was not used.

| Measurement | Observed |
| --- | --- |
| Public tables compared | 35 |
| Encrypted archive size | 251,577 bytes |
| Backup duration | 177 ms |
| Restore duration | 425 ms |
| Complete rehearsal including setup/workflow/verification | 32,771 ms |

Archive SHA-256: 9de76a0d1c913a5ac17a38a98ef245b1e2a50a251a153111530e17e8f1200395.

Verified identical row counts and content digests for every public table, sequence state, column
definitions and constraints. The dedicated synthetic encrypted probe remained linked to its
pre-application and decrypted with the application crypto functions and correct key ring.

Failure checks passed: missing source database publishes no archive; key/archive overwrite is
refused; incorrect archive key and tampered archive fail before target database creation; missing
application key prevents document decryption; an existing target database is refused and unchanged.

Containers and temporary archives/keys were removed after verification. Only this synthetic report
is retained. It contains no candidate data, credentials or encryption keys.

## Limits and follow-up

This is a small synthetic dataset, not evidence for production RPO/RTO. The encrypted probe is a
dedicated test table using the actual application crypto; it is not a full signed-contract or
passport-download acceptance test. The restored application and outbound workers were not started.
Production storage, scheduling, retention, access controls, recovery objectives and the full
application recovery exercise require separate deployment acceptance under issue #29.
