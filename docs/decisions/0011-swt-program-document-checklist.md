# ADR 0011: Work & Travel program-document checklist

- Status: Accepted
- Date: 2026-09-05

## Context

A submitted Work & Travel program application advances the candidate to the document step. The source specification expects program-specific documentation, a profile photo, an introduction video, document upload and later scanning or OCR. Those items have different privacy, storage and review risks and should not be introduced as one undifferentiated upload feature.

The platform already has an encrypted private-document boundary for passports. Program documents should reuse its access control, encryption, retention-review date and audit trail without treating a profile photo or CV as identity evidence for contract generation.

## Decision

Introduce a fixed Work & Travel checklist version 1 containing three mandatory items: a profile photo, a current enrollment certificate and an English-language CV. The candidate may upload them only while an active candidate process is at `DOCUMENTS`.

Validate file contents from their binary signatures instead of trusting the browser filename or content type. Profile photos accept JPEG or PNG, enrollment certificates accept PDF, JPEG or PNG, and CVs accept PDF. Each file is limited to 5 MB, encrypted with a document-type and candidate-specific context, and available only to its owning candidate and authorized administrators.

An administrator must explicitly verify or reject every item. A rejected item remains visible with a reason and may be replaced; the replaced encrypted record is retained as superseded audit evidence. A verified item cannot be silently replaced by the candidate. Only when all three current checklist items are verified does the candidate process advance atomically from `DOCUMENTS` to `JOB_PLACEMENT`.

Passport verification remains a separate contract-readiness workflow. An introduction video is deliberately deferred until the project decides on large-file storage, retention and delivery in issue 30. OCR and automated interpretation are also deferred and may not affect an official workflow without a human-review rule.

## Consequences

- Candidates and staff have one visible, deterministic checklist for the current Work & Travel MVP.
- Plain document bytes are never stored in ordinary media storage or exposed through public collection APIs.
- Audit metadata records checklist version 1 without recording document contents.
- Changing the required set later requires a new checklist version and a migration policy for candidates already in progress.
- Other programs, introduction video, OCR and richer scanning remain tracked follow-up work rather than implicit behavior.
