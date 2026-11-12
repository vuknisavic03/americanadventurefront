# ADR 0019: Embassy appointments and multi-channel reminders

## Status

Accepted

## Context

FR-053 requires the candidate to record the embassy appointment while the administrator can inspect it and every change is auditable. FR-054 requires automatic email and SMS reminders three days before the current appointment, with a delivery record.

Appointments can be rescheduled after a reminder has already been queued. A queued job must therefore never send the date from an obsolete version. SMS vendors have not yet been selected and local development must not accidentally contact real candidates.

## Decision

- Keep one current embassy appointment per candidate process and increment its version on every save or cancellation.
- Interpret candidate input in `Europe/Belgrade` and schedule the reminder at the same local time three calendar days earlier. Store UTC instants alongside the original local date and time.
- Queue independent email and SMS Payload jobs in the same database transaction as the appointment change.
- Before sending, every job verifies the appointment identifier, version, status and time. Obsolete or elapsed appointments are skipped and audited.
- Use a unique idempotency key per appointment version and channel. Delivery attempts are recorded in `embassy-reminder-deliveries`.
- Reuse the configured candidate email provider. SMS defaults to `capture`; real delivery uses an authenticated, provider-neutral HTTPS webhook configured only through secrets.
- Deny direct API mutations of appointment and delivery collections. Candidate changes go through a same-origin, authenticated domain endpoint; the admin view is read-only.

## Consequences

Rescheduling creates new jobs without trying to mutate existing job rows, while the version check makes old jobs harmless. Email and SMS may fail or retry independently and their outcomes remain visible. Production cannot claim real SMS delivery until a gateway, credentials and operational ownership are configured.
