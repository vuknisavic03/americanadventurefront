# ADR 0025: Internal orientation scheduling with calendar snapshots

- Status: Accepted
- Date: 2026-09-25
- Requirement: FR-059

## Context

FR-059 requires scheduling an orientation meeting through a calendar/Calendly-style flow and retaining the meeting and attendance status. Production ownership of a Calendly workspace, booking policy, webhooks and data-processing terms has not yet been established.

## Decision

The platform is the authoritative system of record for the orientation appointment. An administrator schedules or reschedules the meeting in the candidate process, selecting an in-person or online mode, location or meeting URL, candidate instructions and optional private notes. The candidate sees the current and historical status and may download an authenticated `.ics` snapshot.

Attendance, absence and cancellation are administrator-only outcomes. Every change is version-checked, transactional and written to purpose-specific audit events. The existing appointment engine is extended with an `ORIENTATION` purpose so its concurrency, ownership and history guarantees remain shared with other controlled meetings.

## Consequences

- FR-059 does not depend on an external subscription or expose candidate data to another processor.
- A future Calendly integration may create or update the same authoritative record through a signed webhook; it must not become a second source of truth.
- The `.ics` file is a snapshot rather than a subscribed calendar. Candidates must download it again after a schedule change.
- Staff availability, room capacity and group-session rosters remain future scope.
