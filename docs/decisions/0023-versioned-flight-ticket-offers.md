# ADR 0023: Versioned multi-option flight-ticket offers

- Date: 2026-09-22
- Status: Accepted for the FR-057 engineering increment
- Source: PRILOG 1A FR-057

## Decision

The authenticated candidate portal is the authoritative channel for flight-ticket
offers. An administrator publishes one immutable offer version containing between one
and five comparable round-trip options. Each option includes the airline, routes,
departure and arrival instants, baggage, fare conditions, total price and currency.

Only one published offer may await a response for a candidate process. A correction
requires withdrawal with a recorded reason and publication of a new version. Once a
candidate accepts an option, no further offer may be published in FR-057. Payment and
ticket issuance remain outside this increment.

The candidate explicitly confirms either one option or rejection of the complete
offer. The response is stored as an immutable evidence record containing the exact
offer checksum, versioned statement, response reference and evidence checksum.
Optimistic status versions and a process-row database lock protect concurrent admin
and candidate actions.

Email contains only the offer version, option count and protected portal link. Routes,
travel dates, prices and fare conditions remain in the portal. Delivery uses the
existing durable outbox and retry mechanism; provider failure never removes the offer.

An active published or accepted offer freezes the underlying FR-056 request. If travel
details change, the administrator must first withdraw the published offer so that a
new request version and a matching new offer can be created.

## Scope boundary

FR-057 does not reserve or issue a ticket, charge the candidate, calculate an NBS
exchange rate, generate an advance invoice or create payment instructions. Those
behaviors belong to FR-058.

## Evidence

- Unit validation for option limits, chronology, price and response statements.
- HTTP integration coverage for authentication, ownership, version conflicts,
  notification privacy, acceptance, rejection and immutable evidence.
- Browser coverage for admin publication and candidate response.
- [Manual acceptance guide](../development/fr-057-acceptance.md).
