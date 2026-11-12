# CR-0001: Replace staff application email delivery with an Admin portal

- Status: Approved for MVP implementation; contractual confirmation pending
- Date: 2026-08-26
- Requested by: American Adventure project owner
- Affected requirements: FR-002, PRILOG 1B sections 3-4
- Related workflow: `docs/domain/pre-application-selection-workflow.md`
- Related architecture: ADR-0002

## 1. Current contractual wording

FR-002 and PRILOG 1B require every online application, including all submitted data, to be sent to a predefined program email address. For SWT, the named destination is `beograd@workandtravel.rs`.

## 2. Approved MVP change

The MVP does not email application personal data to staff.

Instead:

1. the server validates and stores the application in PostgreSQL;
2. the application appears in a dedicated authenticated Admin portal;
3. an in-app notification or work-queue entry informs Admin users that a new application exists;
4. every authenticated Admin may view and process the application in the MVP;
5. all views, exports, and workflow changes remain subject to server-side authorization and audit;
6. applicant-facing informational and consultation emails remain allowed and do not contain a copy of the full submitted application.

## 3. Reason for change

The portal-based process provides:

- one authoritative list instead of scattered mailbox copies;
- immediate filtering, status tracking, assignment, export, and audit;
- server-side access control and revocation when an employee leaves;
- less unnecessary duplication of personal data;
- reliable processing even when an email provider is unavailable;
- clearer ownership of application state;
- a safer foundation for later candidate profiles and automation.

## 4. Functional impact

### Removed from the MVP

- sending the full SWT application to `beograd@workandtravel.rs`;
- treating mailbox delivery as evidence that the application was stored or assigned;
- asking staff to process applicants from email threads.

### Added to the MVP

- protected Admin portal;
- central application list and detail view;
- in-app notification/work queue;
- server-side filters, search, sorting, and pagination;
- audited XLSX export;
- workflow history and automation status;
- provider-independent applicant messaging.

### Unchanged

- public SWT application form;
- persistence of all contractually required form values;
- privacy and optional newsletter choices;
- applicant-facing material delivery;
- consultation invitation and booking;
- the requirement that authorized staff can review every application.

## 5. Revised acceptance criteria for FR-002

FR-002 is considered satisfied for the changed MVP scope when:

1. a valid application is stored exactly once;
2. it appears in the Admin portal immediately after the database transaction commits;
3. every authenticated Admin can find it through the authorized list and search;
4. an in-app notification or work-queue item is created or recoverable from the outbox;
5. failure of notification processing does not hide or lose the application;
6. no staff email contains the submitted application payload;
7. access and export actions are audited;
8. unauthorized users cannot retrieve application data.

## 6. Security and privacy constraints

- no configuration flag may silently enable full application delivery to staff email;
- secrets and personal data are not written to application logs;
- Admin authentication and authorization are enforced on the server;
- exports require an authenticated Admin and create an audit event;
- application links are not public or shareable bearer URLs;
- applicant email messages contain only the minimum data needed for that communication;
- any future proposal to email full application data requires a new security/privacy review and explicit change approval.

## 7. Implementation notes

- `PRE_APPLICATION_SUBMITTED` creates a transactional outbox event;
- the worker creates an in-app notification, while the application list remains authoritative;
- the portal displays notification failure separately from business workflow state;
- the original program email may remain as a configurable reply-to address for applicant-facing communication;
- development and staging use synthetic candidate data only.

## 8. Rollback and compatibility

Rollback does not mean automatically restoring full-data email delivery.

If contractual stakeholders reject this change:

1. pause production acceptance;
2. review a privacy-minimized alternative, such as a non-personal notification email containing only a count or internal reference;
3. perform a security and privacy review;
4. issue a new approved change request before implementation.

The system architecture keeps provider adapters, but deliberately does not treat email as the application database.

## 9. Approval record

| Role | MVP implementation | Contractual acceptance |
|---|---|---|
| American Adventure project owner | Approved through project direction on 2026-08-26 | Pending formal document |
| Development team | Accepted as implementation baseline | Not applicable |
| Contracting parties / authorized signatories | Not required for non-production development | Pending |

## 10. Release gate

This change may be implemented and tested with synthetic data.

Production use with real applicant data and final acceptance against PRILOG 1A/1B require written confirmation by the appropriate contractual stakeholders.
