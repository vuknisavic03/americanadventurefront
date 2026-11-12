# ADR 0003: Candidate profile and program process boundary

- Status: Accepted for MVP
- Date: 2026-08-29
- Related: #13, FR-020, FR-021, FR-064, FR-065

## Context

The candidate portal needs to combine identity data, authentication, and a long-running program
workflow. These concerns have different lifecycles. Passwords and sessions belong to an auth
account, personal identity data can be shared across programs, while program progress, deadlines,
contracts, payments, and documents belong to one specific participation in a program.

Keeping all of those fields on `candidate-accounts` would couple business changes to the most
sensitive authentication table. Keeping progress only on the original pre-application would also
make the selection workflow responsible for the much longer client lifecycle.

## Decision

1. `candidate-accounts` remains limited to authentication, access state, and immutable links to
   the approved application and applicant.
2. `applicants` remains the canonical source for reusable identity and contact data. Candidates
   may update only the explicitly allowlisted phone, residential address, and citizenship fields
   through an authenticated server endpoint. Name, birth date, and email changes require agency
   review.
3. `candidate-processes` represents participation in one program. It links the auth account,
   applicant, and source pre-application, and owns the current business step, process state,
   candidate-facing next action, due date, and internal progress note.
4. Program steps are defined in a version-controlled domain registry. The MVP registry contains
   only the SWT workflow. Unsupported programs fail closed instead of receiving an incorrect set
   of steps.
5. Completed, current, and upcoming states are derived from the current linear step and process
   status. The portal never accepts a current-step value from the browser.
6. A process is created with the administrator-issued activation invitation. The database
   migration backfills existing candidate accounts so previously activated development accounts
   continue to work.
7. Candidates can read only the process linked to their authenticated candidate account.
   Administrators update progress through the CMS and each relevant change is timestamped,
   attributed, versioned, and written to the audit trail.

## Consequences

The portal page performs a server-side aggregate read across the account, applicant, application,
and program process. This costs several small database queries but keeps authorization and domain
ownership explicit. Adding another program requires a reviewed workflow definition and select
option rather than copying SWT assumptions into the UI.

Contracts, payments, and documents remain future domain modules. They can link to the program
process without changing the authentication model. JMBG remains deferred under ADR 0002.
