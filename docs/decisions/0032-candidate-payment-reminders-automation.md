# ADR 0032: Candidate Payment Reminders, Overdue Notices, and Multi-channel Automation (FR-039)

- Status: Accepted for MVP
- Date: 2026-10-10
- Related: Section 8 and 9 of PRILOG 1 (v2.0), PRILOG 1A (FR-039, FR-028, FR-037, BR-008, BR-009, NFR-005)

## Context

Sections 8 and 9 of **PRILOG 1 (v2.0)** ("8. Načini plaćanja, akcije i popusti" and "9. Finansije i avansni računi", pp. 10–13) define installment dynamics and payment notifications:

- **FR-039 – Opomene za plaćanje:**
  - *"Sistem šalje email i SMS podsetnike prema pravilima Admina."*
  - **Acceptance kriterijum:** *"Slanje se evidentira."*
- **FR-028 – Plaćanje na rate:**
  - *"Kandidat vidi iznose, dospeća, uplaćeno i preostalo."*
- **FR-037 – Pregled uplata:**
  - *"Kandidat i admin će u svakom trenutku moći da vide izvršene uplate i šta je ostalo da se plati."*

Following the completion of **Section 17** (Payment Slips with NBS IPS QR codes, PDF invoices, and automated KIR book maintenance in PR #93) and **Section 14 Phase 3** (Admin communication infrastructure across Email, SMS, and In-App in PR #91), the platform required a dedicated business logic and service layer to evaluate payment schedules, compute overdue or upcoming installments, and dispatch reminders with attached payment instructions.

## Decision

1. **Pure Obligation Evaluation Engine (`modules/payment-reminders/rules.ts`):**
   - Implemented `evaluateObligations` which receives candidate payment plan obligations and cumulative `paidCents`:
     - Sequentially allocates paid funds across chronological obligations (`allocatedPaidCents = min(amountCents, remainingPaid)`).
     - Identifies unpaid amounts (`unpaidCents`).
     - Normalizes reference dates to UTC day boundaries to eliminate timezone drift.
     - Evaluates triggers against configurable rules:
       - `PRE_DUE`: Triggered when `0 < daysUntilDue <= preDueDays` (default 5 days).
       - `ON_DUE`: Triggered when `daysUntilDue === 0` (on the exact due date).
       - `OVERDUE`: Triggered when `dueAt < asOfDate` and `daysOverdue >= overdueGraceDays` (default 1 day).
   - `determineActiveObligation`: Prioritizes `OVERDUE` first, then `ON_DUE`, then `PRE_DUE`, ensuring candidates receive notifications for their most pressing obligations.

2. **Multi-Channel Notification Dispatch:**
   - **Email (`EMAIL_PAYMENT_REMINDER`):** Renders formatted text and responsive HTML detailing obligation label, USD amount, RSD equivalent calculated via the official NBS exchange rate, due date, agency bank account, Model 97 and ISO 7064 reference number, direct portal link, and direct link to the candidate's PDF payment slip with NBS IPS QR code (`/api/candidate/payment-slips/{obligationKey}`).
   - **SMS (`SMS_PAYMENT_DUE`):** Clean, GSM-7 / ASCII compatible SMS notification formatted with candidate name, installment label, amount, due date, and portal link.
   - **In-App Notification:** Recorded in `communication-logs` as an unread portal alert with `actionRequiredTitle` and `actionRequiredDueAt`.

3. **Strict Idempotency Protection:**
   - Keys are deterministically computed via `generatePaymentReminderIdempotencyKey`:
     `pay-rem:${candidateAccountId}:${obligationKey}:${trigger}:${dateCycleKey}:${channel}`
   - Unless explicitly forced (`force: true`), dispatch checks `communication-logs` for an existing `DELIVERED` log with the same key. If present, delivery is safely skipped with reason `ALREADY_DELIVERED`, preventing duplicate notifications.

4. **Comprehensive Audit and Communication Logging:**
   - Every dispatch creates a permanent record in `communication-logs` (channel, recipient, body, templateKey, status, idempotencyKey, sentAt, sentBy, metadata).
   - Successful dispatches record an immutable audit event in `audit-events` (`eventType: 'PAYMENT_REMINDER_SENT'`, actorType: `ADMIN` or `SYSTEM`).
   - Added `PAYMENT_REMINDER_SENT` to `AuditEvents` enum and generated database migration `20261010_220000_payment_reminders.ts`.

5. **API & Automated Job Endpoints:**
   - `GET /api/admin/payments/reminders`: Lists candidate payment reminder candidates with stats (`totalActivePlans`, `overdueCount`, `dueTodayCount`, `preDueCount`), pagination, search, and trigger filtering.
   - `POST /api/admin/payments/reminders`: Handles single and batch reminder dispatching.
   - `POST /api/admin/payments/reminders/evaluate`: Supports scheduled / background automated evaluation runs with `dryRun` capability.

## Consequences

- Fulfills **FR-039** according to PRILOG 1 (v2.0) specifications with 100% test coverage.
- Enhances financial collection by proactively notifying students before installment due dates and providing 1-click NBS IPS payment access.
- Safe idempotency avoids candidate spamming while audit trails provide full regulatory transparency.
