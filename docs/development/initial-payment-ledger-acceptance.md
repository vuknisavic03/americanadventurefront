# Initial payment ledger — acceptance guide

## Preconditions

1. Apply all migrations with `npm run migrate` from `apps/platform`.
2. Start the platform with `npm run dev`.
3. Use a candidate whose contract has been electronically accepted.

The migration creates a payment plan for contracts accepted before this feature. Newly accepted contracts create their plan in the same database transaction as the acceptance evidence.

## Administrator flow

1. Sign in to `/admin`.
2. Open **Finansije → Planovi plaćanja** and choose the candidate.
3. Verify the immutable total, first required payment, obligation schedule, paid amount, and remaining amount.
4. In **Evidentiraj primljenu uplatu**, enter an amount and receipt date. The bank statement/reference and internal note are optional for the MVP.
5. Submit the form once. A repeated network request with the same idempotency key must not create a duplicate.
6. Open **Finansije → Evidentirane uplate** and verify the new immutable entry and administrator identity.

The system rejects zero/negative amounts, future receipt dates, and an amount larger than the remaining balance.

## Candidate flow

1. Sign in at `/nalog/prijava` and open `/moj-nalog`.
2. Verify **Pregled plaćanja** shows total, paid, remaining, obligation allocation, and payment history.
3. A partial amount below the first obligation must leave the process at **Prva uplata**.
4. Once cumulative net payments cover the first obligation, the process must move to **Programska aplikacija**.

## Correction flow

1. Open the original payment in **Evidentirane uplate**.
2. Enter a clear reason in **Poništi ovu uplatu**.
3. Confirm that the original entry remains unchanged and a new reversal entry appears.
4. Confirm that balances are recalculated. If the first payment is no longer covered, the candidate returns to the payment step or the later process is put on hold.

Use synthetic payment references and amounts during testing. Do not enter real bank-account or card data.
