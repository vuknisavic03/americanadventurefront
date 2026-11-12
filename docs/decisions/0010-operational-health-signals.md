# ADR-0010: Operational health signals and private diagnostics

- Status: Accepted for the application foundation; production alert delivery is pending
- Date: 2026-09-05
- Related: NFR-004, NFR-006, NFR-007, issue #29

## Context

A process that accepts HTTP connections can still be unable to serve candidates because PostgreSQL
is unavailable. It can also appear healthy while candidate communication jobs are failing. Public
diagnostics must not reveal infrastructure details, record counts, candidate data or exception text.
At the same time, an external monitoring service needs stable machine-readable signals.

## Decision

Expose three distinct application boundaries:

- `/api/health` is a public liveness check and proves only that the web process can respond.
- `/api/ready` is a public readiness check backed by a bounded database query. Its response is
  deliberately generic and returns HTTP 503 when the dependency is unavailable.
- `/api/operations/status` is disabled unless a separate `OBSERVABILITY_TOKEN` is configured. It
  uses bearer authentication with a timing-safe comparison and returns aggregate counts only.

The protected status reports failed, overdue and stuck communication events; recent terminal and
stuck Payload jobs; and active rate-limit blocks. It never returns record identifiers, recipients,
payloads, error messages, connection details or secrets. Application health failures are logged as
structured JSON containing only an event name, generated correlation identifier, timestamp and
normalized error type.

The Compose application container uses readiness, rather than liveness, for its health check. A
database outage therefore removes an instance from service instead of advertising a false healthy
state.

## Consequences

The endpoints are suitable inputs for a deployment platform or monitoring provider, but this change
does not install such a provider or paging channel. Proposed thresholds and response actions live in
the incident runbook and require owner approval with real environment baselines.

A protected endpoint token is a machine credential. It must be unique, stored in the deployment
secret manager, sent only over HTTPS, rotated on exposure and never reused as `PAYLOAD_SECRET`, an
email-provider key or an archive key. Network-level access restrictions should additionally be used
when the selected hosting platform supports them.

The database query proves connectivity and collection access, not correctness of every downstream
provider. Aggregate job/outbox signals cover the currently implemented asynchronous email workflow;
new queues and providers must extend the status contract and tests.
