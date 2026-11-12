# ADR 0007: Append-only candidate payment ledger

- Status: Accepted
- Date: 2026-09-01

## Context

After electronic contract acceptance, the platform must show the candidate's contractual obligations, received payments, remaining balance, and whether the first required payment has been confirmed. Financial history must remain explainable after an administrator corrects a mistake.

## Decision

Create one immutable payment plan from the accepted program-offer selection and contract acceptance. Store the original obligation schedule on that plan and never derive it from a later, editable offer.

Record each received payment as a separate, immutable ledger entry. Correct an erroneous payment only by creating a reversal entry that references the original payment. Never edit or delete an existing ledger entry.

Keep `paidCents`, `remainingCents`, plan status, and first-payment status as transactionally maintained projections on the payment plan. Lock the plan row while posting or reversing an entry so concurrent administrator requests cannot overwrite each other's balance.

Require an idempotency key for every administrator action. A retried request with the same key returns the existing entry instead of creating a duplicate.

Unlock `PROGRAM_APPLICATION` only after recorded net payments cover the first contractual obligation. If that confirming payment is reversed before later processing begins, return the candidate to `INITIAL_PAYMENT`; if processing has advanced further, put the process on hold for manual review.

## Consequences

- The candidate and administrator see the same auditable balance.
- Financial corrections preserve the original record and the responsible administrator.
- Accepted contracts that predate this feature receive a backfilled payment plan during migration.
- Payment gateway reconciliation, exchange rates, invoicing, and fiscalization remain separate future integrations.
