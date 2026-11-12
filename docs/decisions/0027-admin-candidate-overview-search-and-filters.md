# ADR 0027: Administrative candidate overview, search, filters, and profile editing

- Status: Accepted for MVP
- Date: 2026-10-08
- Related: FR-064, FR-065, FR-066, FR-067, FR-068, FR-074, ADR 0002, ADR 0003

## Context

According to contract specification **PRILOG 1 (v2.0)** (Section 14: Administrativni modul), agency staff require a centralized operational console to supervise and manage candidates throughout their lifecycle:
1. **FR-064 (Central candidate overview):** Comprehensive view combining identity, program participation, job placement status, payment obligations, and progress.
2. **FR-065 (Profile access and editing):** Capability for administrators to review and update candidate status, workflow step, contact details, and coordinator notes with auditable timestamping.
3. **FR-066 (Data and document filters):** Multi-criteria filtering by process step, lifecycle status, target program, payment status, and document verification state.
4. **FR-067 (Filter by name, surname, and passport number):** Dedicated search and column projection allowing administrators to query and extract specifically requested identification fields while preserving encryption constraints.
5. **FR-068 (Candidates without job offer filter):** Fast filter to isolate candidates who have not yet secured an accepted employment offer (`EmploymentOffers` with `status: 'ACCEPTED'`).
6. **FR-074 (Search):** Fast search matching candidate name, surname, email, phone number, and ID/passport number.

Prior to this decision, administrative inspection was split across disjoint Payload CMS collection views or minimal placeholder routes.

## Decision

1. **Unified Domain Service (`src/modules/admin-candidates/`):**
   - Implement `listCandidatesOverview`: Aggregates canonical candidate data from `candidate-processes`, `applicants`, `candidate-accounts`, `pre-applications`, `employment-offers`, and `candidate-applications`.
   - Implement `getCandidateOverviewDetail`: Fetches unified 360-degree candidate details including lifecycle step, job placement details, financial status, and audit history.
   - Implement `updateCandidateOverview`: Allows authorized administrators to update process status, workflow step, coordinator notes, and contact info, writing an immutable record to `audit-events`.

2. **Job Offer Presence Determination (FR-068):**
   - A candidate is considered to have a secured job offer if they possess an `employment-offers` record with `status: 'ACCEPTED'`.
   - The query parameter `withoutJobOffer=true` (or `hasJobOffer=false`) strictly excludes all candidates with accepted job offers, providing coordinators with an immediate operational cohort for job fairs and employer matching.

3. **Field Projection and Identification Filter (FR-067):**
   - The API supports a `fields` projection parameter (e.g. `fields=name,passport` or `fields=minimal`).
   - Querying by passport/ID number searches across available identifiers (`idCardNumber`, normalized documents).

4. **Audit and Traceability (FR-065, FR-070):**
   - Every administrative update through `updateCandidateOverview` generates a `CANDIDATE_PROCESS_UPDATED` or `CANDIDATE_PROFILE_UPDATED` audit record in `audit-events` attributed to the authenticated administrator (`actorId`).

5. **Security and Access Boundary:**
   - All administrative endpoints require an authenticated Payload user session (`collection === 'users'`).
   - Same-origin / CSRF verification protects all mutation endpoints.

## Consequences

- Coordinators gain an authoritative, high-performance operational view combining workflow state and placement status.
- UI components in both the administrative portal and frontend prototype can consume a consistent, strongly typed API.
- Lays the exact foundation for Phase 2 (Excel export - FR-069) and Phase 3 (Batch communications and notifications - FR-071..FR-073).
