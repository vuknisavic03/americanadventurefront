# ADR 0006: Immutable electronic contract acceptance

- Status: Accepted
- Date: 2026-09-01

## Context

A generated contract is an immutable draft assembled from verified candidate data, an accepted payment selection, and a versioned template. Electronic acceptance must prove which authenticated candidate accepted which exact draft and when, without rewriting the original artifact.

## Decision

The platform stores acceptance as a separate immutable `contract-acceptances` record with a one-to-one relationship to the generated contract.

The candidate must submit an explicit confirmation from an authenticated candidate session. The request includes the checksum of the draft shown in the portal, and the server compares it with the stored checksum before accepting it. The server defines the statement text and version; client-supplied statement text is never trusted.

The evidence record contains the candidate and contract relationships, acceptance timestamp, statement text and version, source PDF checksum, deterministic acceptance reference, and a checksum of the canonical evidence facts. A separate final PDF is rendered from the encrypted contract snapshot, includes the acceptance facts, and is encrypted before storage. The original draft remains unchanged.

Acceptance creation, audit recording, and candidate-process advancement run in one database transaction. A unique contract relationship and idempotent retry handling prevent duplicate acceptance records.

This workflow records electronic acceptance inside the authenticated platform. It does not claim to be a qualified electronic signature.

## Consequences

- A template or source-data change cannot alter an already generated or accepted contract.
- Draft and final PDFs can be independently verified by their checksums.
- Final PDF downloads remain authenticated, authorized, integrity-checked, and audited.
- A future legal review can introduce a new statement version without changing historical evidence.
- Revocation or replacement, if later required, must be modeled as a new explicit business workflow rather than an update to an acceptance record.

