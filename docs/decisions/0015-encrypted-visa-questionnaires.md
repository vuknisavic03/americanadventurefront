# ADR 0015: Encrypted candidate visa questionnaires

- Status: Accepted for the MVP
- Requirement: FR-050
- Date: 2026-09-10

## Decision

An active SWT candidate may save and submit a visa questionnaire during the VISA step after a visa-payment order has been marked PAID. The source requirement requires persistence and administrator access; it does not prescribe questions. Version 1 is explicitly labelled as a trial agency preparation form, not an official visa application. The agency must approve the questions before production use.

The questionnaire stores its schema version, owner, process, payment order and revision. Questions are versioned in code. Existing records must continue to be interpreted using their original schema when additional versions are introduced. Version 1 collects basic preparation details; it does not duplicate JMBG or passport uploads.

Answers, submission snapshots and reviewer feedback use the existing AES-256-GCM key ring. Authenticated encryption binds the content to the candidate account, process and schema version. Generic REST/GraphQL collection access never exposes encrypted content or decrypted answers. Candidates use an authenticated projection of their own record; administrators use the process review endpoint. Audit metadata contains identifiers, action and revision only, not answers or reviewer notes. Error logs omit database query text.

## Workflow

The statuses are DRAFT, SUBMITTED, CHANGES_REQUESTED and REVIEWED. Candidates may edit only drafts or requested corrections. A submission records an immutable answer snapshot inside the encrypted history. An administrator can request corrections with a mandatory note or finish the review. Finishing review is an internal agency decision, not a visa approval. The process remains at VISA pending FR-051.

Each mutation locks the candidate process in a database transaction and requires the current revision. Concurrent or stale requests cannot overwrite a newer submission or review. Content, status, candidate next action and audit event commit together.

## Operations and verification

The existing SENSITIVE_DATA_* variables are required; key rotation must retain keys needed to decrypt existing records. Synthetic keys are configured only inside the isolated Playwright web server. Test fixtures reject database names that do not end with _e2e or _test.

The migration creates a separate table. Its rollback refuses to remove a table that contains candidate questionnaires. The audit enum value is retained to preserve historical events, and the forward migration can reuse it. Rolling back data-bearing installations requires a separately reviewed recovery plan.

Validation includes required fields, whitespace and length boundaries, HTTP ownership checks, paid-order gating, concurrent saves, encryption at rest, locked submissions, correction/resubmission and audit history. Acceptance testing instructions are maintained in the development guide.
