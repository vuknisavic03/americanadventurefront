# ADR 0017: Encrypted passport-collection authorizations

- Status: Accepted for the MVP
- Requirement: FR-052
- Date: 2026-09-14

## Decision

FR-052 is a separate document domain rather than an extension of the participation contract. An administrator maintains a versioned Work & Travel authorization template. The platform generates one immutable authorization per candidate process from the active template and verified candidate data. The candidate reviews the generated PDF and records an explicit electronic acceptance through the authenticated portal. The accepted PDF contains an evidence reference, timestamp and statement version.

This MVP acceptance is an auditable in-platform expression of consent. It is not represented as a qualified electronic signature. The agency must approve the production wording and decide with legal counsel whether a stronger signature method is required before relying on the document outside the agreed operational process.

## Gate and workflow

Generation is available only for an active SWT process at the VISA step after the visa-document checklist is complete, the passport is verified and the JMBG is validated. Exactly one active template must exist for the program. These conditions prevent an incomplete or ambiguous document from being offered to the candidate.

The generated source is bound to the candidate, process, pre-application, sensitive profile and template version. The candidate submits the SHA-256 checksum of the PDF they reviewed. A stale or foreign document is rejected. Repeated or concurrent acceptance requests return the existing result instead of producing duplicate evidence.

FR-052 does not advance the process beyond VISA. After acceptance, the next action points to the future embassy-appointment capability in FR-053.

## Storage, access and retention

The rendered-data snapshot, source PDF and accepted PDF are encrypted with AES-256-GCM using distinct contexts. The plaintext JMBG exists only in memory while the immutable snapshot and PDF are rendered, and those buffers are cleared after use. Integrity is verified with SHA-256 before download.

Candidates may read only their own generated document through controlled endpoints. Administrators may generate, download and print through the candidate-process view. Direct collection create, update and delete operations are denied; workflow services perform transactional writes and immutable audit events record template lifecycle, generation, acceptance and access. A retention-review date is set to seven years and must be reconciled with the approved production retention policy.

The rollback migration refuses to remove FR-052 tables while archived authorizations exist.

## Verification

Unit tests cover the placeholder allowlist, deterministic template checksums, Unicode and multi-page PDF rendering, and accepted-PDF evidence. HTTP integration covers the workflow gate, encrypted persistence, source and accepted downloads, cross-candidate denial and idempotent acceptance. Manual acceptance verifies the administrator and candidate interfaces with synthetic data only.
