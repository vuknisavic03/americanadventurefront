# ADR 0024: Versioned flight-ticket payment orders

## Status

Accepted — 2026-09-24

## Context

FR-058 requires a payment order after a candidate accepts an FR-057 flight option and, where applicable, an advance-payment document calculated using an NBS exchange rate. The platform does not yet have an approved live NBS integration or a production accounting integration.

## Decision

- An administrator issues an immutable, versioned payment order only for the accepted flight option.
- The accepted option, candidate identity, beneficiary data, source amount and currency, RSD settlement amount, exchange rate, rate date and reference are frozen in the order.
- Foreign-currency conversion uses a fixed six-decimal integer representation. The administrator records the published NBS rate and its source/reference; the UI must not imply automatic NBS retrieval.
- A deterministic PDF is generated from the frozen record. Its SHA-256 is stored when the order is issued and verified on every download.
- Candidate and administrator downloads require authentication and use private, no-store HTTP headers.
- Corrections require cancellation with a reason and a new version. Paid orders cannot be replaced.
- The optional accompanying advance calculation is explicitly marked as not being a fiscal receipt or proof of payment. Production tax/accounting wording must be approved by the agency accountant before launch.

## Consequences

This provides a complete, auditable MVP without pretending that an external banking, NBS, fiscal or accounting service is integrated. A later adapter can retrieve official exchange rates and a later accounting integration can issue legally authoritative invoices without changing the order lifecycle.
