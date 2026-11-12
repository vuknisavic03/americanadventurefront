# ADR 0016: Versioned encrypted visa-document checklist

- Status: Accepted for the MVP
- Requirement: FR-051
- Date: 2026-09-13

## Decision

FR-051 uses a versioned SWT checklist derived from code rather than free-form per-candidate text. Version 1 contains a previously verified passport and four encrypted uploads: the DS-160 confirmation page, Form DS-2019, a visa-fee receipt when applicable, and a visa photograph. The list is an agency preparation aid, not legal advice or an embassy guarantee. The agency must approve and maintain it before production use.

The initial list is based on the U.S. Department of State Exchange Visitor Visa guidance and BridgeUSA documentation current at implementation time:

- https://travel.state.gov/content/travel/en/us-visas/study/exchange.html
- https://j1visa.state.gov/participants/how-to-apply/interviews-documents/

Local embassy or consulate instructions may require additional evidence. New requirements must be introduced through a new checklist version instead of silently changing the meaning of existing records.

## Storage and access

Visa files reuse the existing candidate-private-documents collection, authenticated encryption, retention review date, controlled download endpoint and immutable audit events. The passport keeps its historical encryption context. New visa types use a distinct visa-document context so ciphertext cannot be moved between candidate, type or workflow purpose.

Candidates may upload only their own documents while their verified active SWT process remains at VISA and their visa questionnaire is REVIEWED. The generic collection cannot create, update or delete records. Administrators review through the existing controlled document workflow; rejection requires a reason and allows a replacement. Every replacement supersedes, rather than overwrites, the previous record.

## Workflow

The candidate sees Missing, Waiting for review, Replacement required or Accepted for each item. The administrator sees the same candidate-bound projection from the candidate process. When every current item is verified, the process remains at VISA and the next action points to the future embassy-appointment step (FR-053).

Upload mutation, superseding the previous file, process next action and audit event commit in one transaction. The candidate process row is locked to avoid concurrent replacement races. The migration adds only enum values and refuses rollback while any new visa-document records exist.

## Verification

Unit tests cover checklist completeness, file formats and encryption-context isolation. HTTP integration covers the workflow gate, authentication, encrypted persistence, rejection/replacement, cross-candidate download denial and completion. A Chromium scenario covers candidate upload and administrator review through the actual interfaces.
