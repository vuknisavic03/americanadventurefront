# ADR 0008: Versioned program-application snapshots

- Status: Accepted
- Date: 2026-09-02

## Context

After the first contractual payment is confirmed, a candidate must complete a program-specific application. Administrators need to change questions over time, but a later template edit must not alter the meaning of an application already opened or submitted by a candidate.

Draft answers are personal data and must be accessible only to the owning authenticated candidate and authorized administrators. A candidate may use multiple browser tabs or resume on another device, so silent overwrites also need to be prevented.

## Decision

Store administrator-managed templates as explicit versions with `DRAFT`, `ACTIVE`, and `RETIRED` lifecycle states. Only one version per program may be active. An active or retired version is immutable; content changes require a new draft version.

When an eligible candidate first opens the program-application step, create one application for that candidate process. Copy the template name, version, instructions, and normalized field definitions into a checksummed schema snapshot. Existing applications never read their questions from a later template version.

Store answers as structured JSON and validate every request against the immutable snapshot on the server. The initial field types are short text, long text, number, and date. Unknown keys, invalid types, excessive text, and incomplete final submissions are rejected.

Candidates access the data only through a same-origin authenticated API. Collection create and update access remains denied. Draft saves increment a revision number; a request with an older expected revision is rejected instead of overwriting newer answers.

Final submission changes the application from `DRAFT` to immutable `SUBMITTED`, records an audit event, and advances the candidate process to `DOCUMENTS` in the same database transaction.

## Consequences

- Administrators can evolve program questions without rewriting historical applications.
- A submitted application can be explained using the exact schema the candidate saw.
- Draft conflicts are visible to the candidate rather than silently losing data.
- Administrators review answers in a dedicated read-only panel instead of editing raw JSON.
- New field types require an explicit validator and renderer change.
- Photo, video, private-document upload, scanning, and OCR remain separate workflows with their own security decisions.
