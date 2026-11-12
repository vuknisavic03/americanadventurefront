# ADR 0020: Purpose-scoped embassy interview preparation

- Date: 2026-09-16
- Status: Accepted for the FR-055 engineering increment
- Source: PRILOG 1A FR-055 (calendar/scheduling and attendance visible to candidate/admin)

## Decision

Reuse the controlled interview-preparation workflow with an immutable `purpose`:
`JOB_INTERVIEW` (existing FR-046/047 records and default) or `EMBASSY` (FR-055).
Each purpose has its own attempt numbers, current appointment and history, with
a unique `(candidateProcess, purpose, attemptNumber)` index. The migration assigns
all existing rows to `JOB_INTERVIEW` without dropping their history.

Any authenticated administrator may schedule/reschedule, cancel, record attendance
or record absence for an ACTIVE process at VISA. Candidates see only their own safe
projection and cannot mutate appointments. Raw collection mutations remain denied.
Internal notes never enter the candidate response or calendar.

Scheduling and outcomes use the existing process-row lock, transaction and optimistic
appointment-identity/version checks. Mutations are audited using `INTERVIEW_PREPARATION_*` events with
`metadata.purpose`, appointment ID, process ID and attempt number. The API binds
outcomes to the process in the URL and the selected purpose. Stale rescheduling
after closure is rejected rather than creating a new appointment.

The admin panel provides date/time scheduling, mode, location/link, instructions,
private notes and attendance history. The candidate panel includes an authenticated
downloadable iCalendar snapshot with escaped/folded text and UTC timestamps.
This is not Calendly integration, availability management, candidate self-booking,
an automatically subscribed calendar, or a new email/SMS notification channel.

## Separation from FR-053/054

Preparation does not alter the official embassy appointment, reminder jobs, next
action or process stage. Completion is not a visa decision. The preparation can be
arranged before the official appointment has been recorded; staff coordinate its
timing. No undocumented visa-outcome or travel workflow is introduced here.

Input datetime fields explicitly use the administrator device's timezone; the named
IANA timezone is used for candidate display. Rescheduling requires a fresh calendar
download; importing a previous file is not a live subscription.

## Rollout and rollback

Apply `20260916_164103_embassy_interview_preparation` before starting the updated app.
No new secrets or external provider configuration are required. The down migration
refuses to run while EMBASSY rows exist: silently reclassifying them as job preparation
or deleting them would lose meaning/history. Prefer a forward fix once records exist.

## Evidence

- `src/modules/interview-preparations/calendar.test.ts`: escaping, UTF-8 folding, UTC.
- Existing preparation rules/service unit tests retain job-preparation coverage.
- `tests/integration/embassy-preparation.spec.ts`: authorization, concurrent scheduling,
  stale versions, cross-process/purpose protection, all outcomes, audit and privacy.
- `tests/e2e/embassy-preparation-browser.spec.ts`: admin scheduling, candidate display,
  download and cancellation without browser errors.
- [Manual verification in Serbian](../development/fr-055-acceptance.md).
