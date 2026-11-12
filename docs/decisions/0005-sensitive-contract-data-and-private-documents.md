# ADR-0005: Sensitive contract data and private candidate documents

- Status: Accepted for the MVP foundation
- Date: 2026-08-30
- Related: ADR-0002, issue #17, PRILOG 1A FR-022–FR-026

## Context

Contract preparation needs a candidate's JMBG and passport. These values have a materially higher impact than ordinary profile data. ADR-0002 therefore prohibited collecting JMBG until encryption at rest, separate key management, masking, access logging and retention rules were designed.

## Decision

The application encrypts JMBG and passport bytes with AES-256-GCM before they reach PostgreSQL. Every encrypted record stores a non-secret key ID, a unique 96-bit IV and the authentication tag. The key ring is supplied only through runtime secrets. The active key encrypts new data while older keys remain available for decryption during rotation.

JMBG is validated for length, checksum and consistency with the candidate's stored date of birth. No digits are exposed after validation: candidate and administrator interfaces show status only. Even a short suffix is prohibited because the structured JMBG format makes partial disclosure materially easier to reconstruct. Duplicate detection uses HMAC-SHA-256 with a separate stable fingerprint key; it is not an unsalted hash of the small JMBG value space.

Passport uploads are limited to 5 MB and PDF, JPEG or PNG. The server validates file signatures, sanitizes the display name, computes a SHA-256 integrity digest and stores only encrypted base64 content. There is no public media URL. Downloads require an authenticated owning candidate or administrator, use no-store and nosniff response headers, and always create an audit event. A verified passport cannot be replaced by the candidate.

An administrator verifies or rejects the active passport through a controlled endpoint. Contract readiness becomes `READY` only after both JMBG validation and passport verification.

Contract templates are versioned by program and template type. Only drafts may be edited or deleted. Active content is immutable and can only be retired. A database constraint permits one active template per program and template type, and a content checksum protects the future contract snapshot from accidental mutation.

## Key management and rotation

- `SENSITIVE_DATA_ENCRYPTION_KEYS` is a comma-separated key ring in `key-id:base64-key` form.
- `SENSITIVE_DATA_ACTIVE_KEY_ID` selects the key used for new encryption.
- `SENSITIVE_DATA_FINGERPRINT_KEY` is independent and must remain stable; changing it requires a controlled fingerprint migration.
- All keys are exactly 32 random bytes, are never committed, logged or stored in the database, and production keys belong in the deployment secret manager.
- Rotation adds the new encryption key, changes the active ID, re-encrypts existing records in a controlled job, and removes the old key only after verification and backup expiry.
- Missing or malformed configuration fails closed for sensitive operations.

## Retention and deletion

The MVP assigns a retention-review date 365 days after sensitive data is collected. This is a review trigger, not an automatic promise of deletion. Until Serbian and US legal/accounting obligations are approved by counsel, automatic destructive purging remains out of scope. A later scheduled workflow must support legal hold, verified deletion, backup expiry and an auditable deletion receipt. Replaced or rejected documents remain encrypted until that review.

## Storage trade-off

Encrypted base64 passport content is stored in PostgreSQL for the MVP. This keeps access, transactions and backups inside one controlled system, but adds storage overhead and is not the long-term large-file architecture. Production scale should move the same encrypted envelope to private object storage with short-lived access, malware scanning, regional controls and lifecycle rules; no public bucket or permanent URL is acceptable.

## Consequences

Database access alone does not reveal plaintext JMBG or passport content. Key loss makes the documents unrecoverable, so managed secret backup and rotation discipline are operational requirements. Final PDF generation, contract numbering and candidate acceptance must consume only a `READY` profile and snapshot an active template; they remain a separate increment.
