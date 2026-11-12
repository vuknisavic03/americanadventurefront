# ADR 0021: Portal-authoritative flight-ticket requests

- Date: 2026-09-17
- Status: Accepted for the FR-056 engineering increment
- Source: PRILOG 1A FR-056

## Decision

The authenticated portal is the authoritative record of a candidate's flight-ticket
request. A candidate in the active `TRAVEL_PREPARATION` step submits the departure
date, USA destination, return date and return destination. One current record is
kept per candidate process, with optimistic versioning, a process-row database lock
and an audit event for every submitted version.

The source requirement says that the request is forwarded by email. Email is therefore
implemented as a durable outbox notification to the configured operations address,
but it contains only the candidate name, request version and a link to the protected
admin page. Dates and destinations remain in the portal. A provider failure does not
erase the request: administrators can still process it and see the failed delivery
state while the job retry policy remains active.

`FLIGHT_REQUEST_NOTIFICATION_EMAIL` selects the operations recipient and falls back
to `CANDIDATE_EMAIL_REPLY_TO`. Local and automated-test environments use the capture
provider, so no real email is sent. Direct collection mutation is denied; candidate
and administrator APIs return explicit safe projections.

## Scope boundary

This increment does not search flights, create or publish a flight offer, buy a ticket,
or issue a payment order. Those behaviors belong to FR-057 and FR-058. The four source
fields intentionally remain free text/date values until the agency defines an airport
catalog and travel rules.

## Evidence

- Unit validation tests for date validity, ordering, duration and destination input.
- HTTP integration coverage for stage/ownership/CSRF boundaries, concurrency,
  version conflicts, delivery state and privacy-preserving audit metadata.
- Browser coverage for candidate submission and the authoritative admin view.
- [Manual acceptance guide](../development/fr-056-acceptance.md).
