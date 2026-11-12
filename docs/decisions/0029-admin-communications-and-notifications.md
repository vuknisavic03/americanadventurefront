# ADR 0029: Administrative Communications, In-App Notifications, Email and SMS Messaging

- Status: Accepted for MVP
- Date: 2026-10-08
- Related: FR-071, FR-072, FR-073, FR-070, ADR 0027, ADR 0028

## Context

According to the contract specification **PRILOG 1 (v2.0)** (Section 14: Administrativni modul, p. 19):
1. **FR-071 (Notifikacije):**
   - Requirement: "Sistem šalje notifikacije za akcije kandidata (ugovor, uplata, viza)."
   - Acceptance criteria: "Notifikacija je vidljiva u aplikaciji / poslata."
2. **FR-072 (Email komunikacija):**
   - Requirement: "Automatsko ili pojedinačno slanje emailova preko generičkih šablona."
   - Acceptance criteria: "Email je poslat i evidentiran u bazi."
3. **FR-073 (SMS komunikacija):**
   - Requirement: "SMS notifikacije za hitne poruke i podsetnike preko generičkih šablona."
   - Acceptance criteria: "SMS je poslat preko provajdera i evidentiran status."
4. **FR-070 (Audit aktivnosti):**
   - Requirement: Every outbound individual and batch communication dispatch must be audited with timestamp, actor, channel, and recipient metrics.

## Decision

1. **Dedicated Communications Ledger (`CommunicationLogs`):**
   - Introduce a new Payload collection `communication-logs` (`slug: 'communication-logs'`) mapped to table `communication_logs` in PostgreSQL.
   - Persists all outgoing communications across all 3 channels (`EMAIL`, `SMS`, `IN_APP`):
     - Relations: `candidateProcess` (FK), `candidateAccount` (FK), `sentBy` (admin FK).
     - Delivery metadata: `recipient`, `recipientName`, `subject`, `body`, `templateKey`, `status` (`DELIVERED`, `FAILED`, `PENDING`), `provider`, `providerMessageId`, `idempotencyKey`, `errorMessage`, `metadata`.
     - Action notification fields: `actionRequiredTitle`, `actionRequiredDueAt`, and `isRead` (boolean checkbox for candidate portal tracking).
   - Candidate access control: Candidates (`candidate-accounts`) can read their own in-app notifications (`candidateAccount == req.user.id`), while administrators retain full read and audit access. Direct candidate modification is restricted to marking read status via dedicated endpoint.

2. **Generic Template Registry & Interpolation Engine:**
   - Implement `COMMUNICATION_TEMPLATES` in `src/modules/admin-communications/templates.ts`.
   - Provide pre-configured system templates with localized Serbian content for Email, SMS, and In-App:
     - **Email:** `EMAIL_GENERAL_ANNOUNCEMENT`, `EMAIL_DOCUMENT_REMINDER`, `EMAIL_PAYMENT_REMINDER`, `EMAIL_ACTION_REQUIRED`.
     - **SMS:** `SMS_GENERAL`, `SMS_URGENT_ACTION`, `SMS_PAYMENT_DUE`, `SMS_DOCUMENT_MISSING`.
     - **In-App:** `IN_APP_GENERAL`, `IN_APP_ACTION_REQUIRED`, `IN_APP_DOCUMENT_NOTICE`, `IN_APP_PAYMENT_NOTICE`.
   - Variable interpolation engine replaces placeholders `{{variable}}` (`firstName`, `lastName`, `programCode`, `portalUrl`, `actionTitle`, `dueDate`, `customNote`, etc.) with safe string fallbacks.
   - Email templates render HTML with clean corporate styling and proper character escaping.

3. **SMS Metrics and Segment Counter (GSM-7 vs. Unicode):**
   - Implement `calculateSmsSegments(text)` to provide accurate length and segment calculation:
     - Detects non-GSM 7-bit characters (such as Serbian Latin accents `č, ć, ž, š, đ` or Cyrillic).
     - Standard GSM-7: single segment up to 160 characters; concatenated segments at 153 characters each.
     - Unicode (UCS-2): single segment up to 70 characters; concatenated segments at 67 characters each.
   - Surfaced via the templates catalog API (`GET /api/admin/communications/templates`) for admin composition previews.

4. **Phone Normalization & Recipient Routing:**
   - Reuse E.164 normalization (`normalizePhone`) converting local Serbian numbers (`064...`, `063...`, `00381...`) to international `+381...` format.
   - Validate destination channel requirements: valid email for `EMAIL`, normalized phone for `SMS`, and active portal account for `IN_APP`.

5. **Individual and Batch Dispatch (`/api/admin/communications/send`):**
   - **Individual dispatch:** sends email, SMS, or in-app message to a specific candidate process.
   - **Batch dispatch:** resolves target cohorts either by explicit process ID list (`candidateProcessIds: number[]`) or by cohort filters (`currentStep`, `programCode`, `withoutJobOffer`, `hasJobOffer`, `processStatus`).
   - Generates unique idempotency keys per message to prevent accidental duplicate transmissions.
   - Integrates with provider-neutral adapters: `capture` and `resend` for email, `capture` and `webhook` for SMS, and direct in-app record persistence.

6. **Candidate Portal In-App Notification Flow (`/api/candidate/notifications`):**
   - Candidates can fetch their in-app notifications with pagination and unread counts (`unreadCount`).
   - Supports filtering by `?unreadOnly=true`.
   - Dedicated `PATCH /api/candidate/notifications` endpoint allows candidates to mark one or multiple notifications as read (`isRead: true`), ensuring tenant isolation.

7. **Audit Logging (FR-070):**
   - Extends PostgreSQL `enum_audit_events_event_type` with:
     - `'ADMIN_COMMUNICATION_SENT'`: logged on each individual message.
     - `'ADMIN_BATCH_COMMUNICATION_SENT'`: logged on cohort batch completions with total, succeeded, and failed metrics.

## Consequences

- Administrators have a unified, reliable interface to communicate with candidates individually or in cohorts across Email, SMS, and portal notifications.
- All candidate action requests (contract signing, payment due, visa submission) are systematically recorded and trackable.
- Candidate portal features a dedicated notification feed with unread indicators and action deadlines.
- Provider neutrality allows zero-cost local testing via `capture` and seamless production dispatch via `resend` and SMS webhooks.
