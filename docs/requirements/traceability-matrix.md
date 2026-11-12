# Requirements traceability matrix

- Baseline: `main` plus the FR-059 increment (2026-09-25)
- Sources: PRILOG 1A version 2.0 and PRILOG 1B version 1.0
- Scope: implementation planning and engineering evidence; not contractual acceptance
- Owner: development team, reviewed with the American Adventure project owner

## Status definitions

- **Implemented** - present on `main` with automated and/or documented acceptance evidence.
- **Changed** - intentionally differs from the source requirement and has a recorded change request.
- **Partial** - a safe foundation or subset exists, but the complete source requirement is not accepted.
- **Planned** - not implemented in the integrated platform.

The matrix must be updated in the same pull request that changes a requirement's behavior or evidence.
An `Implemented` status means the current engineering increment is complete; production release gates
and formal contractual acceptance remain separate decisions.

## Evidence index

- **PRE** - [pre-application selection workflow](../domain/pre-application-selection-workflow.md)
- **ACCOUNT** - [candidate account acceptance](../development/candidate-account-acceptance.md)
- **PROFILE** - [candidate profile and process acceptance](../development/candidate-profile-process-acceptance.md)
- **OFFER** - [program offer and payment selection acceptance](../development/program-offer-payment-selection-acceptance.md)
- **CONTRACT** - [electronic contract acceptance](../development/contract-acceptance.md)
- **PAYMENT** - [initial payment ledger acceptance](../development/initial-payment-ledger-acceptance.md)
- **APPLICATION** - [candidate program application acceptance](../development/program-application-acceptance.md)
- **PROGRAM-DOCUMENTS** - [Work & Travel program-document acceptance](../development/program-document-checklist-acceptance.md)
- **INTERVIEW-PREP** - [job-interview preparation acceptance](../development/job-interview-preparation-acceptance.md)
- **EMPLOYMENT-OFFER** - [employment confirmation and job-offer acceptance](../development/employment-job-offer-acceptance.md)
- **VISA-QUESTIONNAIRE** - [visa questionnaire acceptance](../development/visa-questionnaire-acceptance.md) and [encryption decision](../decisions/0015-encrypted-visa-questionnaires.md)
- **VISA-DOCUMENTS** - [visa-document checklist acceptance](../development/visa-document-checklist-acceptance.md) and [checklist decision](../decisions/0016-versioned-visa-document-checklist.md)
- **PASSPORT-AUTHORIZATION** - [passport-collection authorization acceptance](../development/passport-collection-authorization-acceptance.md) and [authorization decision](../decisions/0017-encrypted-passport-collection-authorizations.md)
- **VISA-PAYMENT** - [visa-payment order acceptance](../development/visa-payment-order-acceptance.md)
- **FLIGHT-REQUEST** - [flight-ticket request acceptance](../development/fr-056-acceptance.md) and [portal/email decision](../decisions/0021-flight-ticket-request-notification.md)
- **ORIENTATION** - [travel-orientation acceptance](../development/fr-059-acceptance.md) and [internal scheduling decision](../decisions/0025-internal-orientation-scheduling.md)
- **PAYMENT-REMINDERS** - [candidate payment reminders acceptance](../development/candidate-payment-reminders-acceptance.md) and [reminders automation decision](../decisions/0032-candidate-payment-reminders-automation.md)
- **TEST-AUTOMATION** - [integration and end-to-end testing](../development/integration-e2e-testing.md)
- **SECURITY** - [HTTP boundary security runbook](../runbooks/http-boundary-security.md)
- **RECOVERY** - [encrypted database backup and recovery](../runbooks/database-backup-restore.md)
- **OBSERVABILITY** - [monitoring and incident response](../runbooks/monitoring-incident-response.md)
- **CR-0001** - [Admin portal replaces staff application email](../change-requests/0001-admin-portal-replaces-application-email.md)
- **TEST-27** - [HTTP integration and end-to-end coverage](https://github.com/vookmeer/AmericanAdventure26/issues/27)
- **SEC-28** - [rate limiting, trusted proxies, and security headers](https://github.com/vookmeer/AmericanAdventure26/issues/28)
- **OPS-29** - [backup, restore, observability, and incident runbooks](https://github.com/vookmeer/AmericanAdventure26/issues/29)
- **REPO-30** - [large media and confidential specification storage](https://github.com/vookmeer/AmericanAdventure26/issues/30)
- **FLOW-31** - [remaining Work & Travel workflow](https://github.com/vookmeer/AmericanAdventure26/issues/31)
- **WEB-32** - [public website, CMS, migration, and SEO](https://github.com/vookmeer/AmericanAdventure26/issues/32)
- **DEP-33** - [Payload toolchain dependency advisories](https://github.com/vookmeer/AmericanAdventure26/issues/33)

## PRILOG 1A - functional requirements

| ID | Requirement | Status | Evidence / next work |
| --- | --- | --- | --- |
| FR-001 | Website candidate application | Implemented | PRE and TEST-AUTOMATION; SWT form, persistence, and browser coverage. |
| FR-002 | Send application to the program email | Changed | CR-0001; the authenticated Admin portal is authoritative; contractual confirmation is pending. |
| FR-003 | Central application list | Implemented | PRE. |
| FR-004 | Application filters | Implemented | PRE. |
| FR-005 | Excel application export | Implemented | PRE-APPLICATIONS; authenticated Excel export with formula sanitization, column projection, multi-criteria filters, and audit trail; unit and integration tests. |
| FR-006 | Initial-call status | Implemented | PRE. |
| FR-007 | Mark candidate qualified | Implemented | PRE and TEST-AUTOMATION. |
| FR-008 | Automatically send qualification material | Implemented | PRE and TEST-AUTOMATION; provider-neutral delivery and local capture mode. |
| FR-009 | Mark candidate not qualified | Implemented | PRE. |
| FR-010 | Rejection note | Implemented | PRE. |
| FR-011 | Consultation invitation message | Implemented | PRE. |
| FR-012 | Consultation appointment record | Implemented | PRE and consultation webhook documentation. |
| FR-013 | Consultation attendance | Implemented | PRE. |
| FR-014 | Consultation notes | Implemented | PRE. |
| FR-015 | Profile-creation prerequisites | Implemented | PRE and ACCOUNT. |
| FR-016 | Candidate account registration | Implemented | ACCOUNT; administrator-issued access with candidate activation. |
| FR-017 | Sign in | Implemented | ACCOUNT. |
| FR-018 | Email verification | Implemented | ACCOUNT; single-use activation proves control of the recorded email. |
| FR-019 | Forgotten password | Implemented | ACCOUNT. |
| FR-020 | Application-step tracking | Implemented | PROFILE. |
| FR-021 | Program-specific workflow | Partial | PROFILE implements SWT; other programs are FLOW-31. |
| FR-022 | Contract generation | Implemented | CONTRACT and generated-contract tests. |
| FR-023 | Automatic contract numbering | Implemented | CONTRACT and database-backed numbering. |
| FR-024 | Electronic contract acceptance | Implemented | CONTRACT. |
| FR-025 | Contract PDF download | Implemented | CONTRACT; draft and accepted evidence variants. |
| FR-026 | Contract per program | Partial | Versioned templates exist; SWT is the accepted program scope. FLOW-31. |
| FR-027 | Immediate-payment option | Partial | OFFER captures immutable selection; complete finance behavior is FLOW-31. |
| FR-028 | Installment-payment option | Partial | OFFER and PAYMENT provide schedule/ledger foundation; FLOW-31. |
| FR-029 | Pay-when-you-earn option | Implemented | GUARANTOR; PKZ model support, initial deposit and deferred debt separation, mandatory guarantor requirement, and automated three-party contract generation; ADR 0034, [acceptance guide](../development/candidate-pkz-guarantor-acceptance.md), unit and integration tests. |
| FR-030 | Guarantor data | Implemented | GUARANTOR; comprehensive guarantor data collection, modulo 11 JMBG checksum and adulthood validation, AES-256-GCM encrypted ID card upload, administrative verification/rejection workflow, and legal Promissory Note Authorization (2 blank promissory notes); ADR 0034, [acceptance guide](../development/candidate-pkz-guarantor-acceptance.md), unit and integration tests. |
| FR-031 | Group discount | Implemented | DISCOUNTS; group code validation, leader and member role assignment, configurable discount per member (default $50), automatic group verification, audit trail and member summaries; ADR 0033, [acceptance guide](../development/candidate-commercial-discounts-acceptance.md), unit and integration tests. |
| FR-032 | Brand Ambassador discount | Implemented | DISCOUNTS; ambassador referral codes, default discount ($50) and per-referral rewards ($25), status check, referral summaries and audit logging; ADR 0033, [acceptance guide](../development/candidate-commercial-discounts-acceptance.md), unit and integration tests. |
| FR-033 | Family discount | Implemented | DISCOUNTS; kinship type validation, relative applicant tracking, administrative verification workflow, audit events and price scaling; ADR 0033, [acceptance guide](../development/candidate-commercial-discounts-acceptance.md), unit and integration tests. |
| FR-034 | Returnee and Lifeguard discount | Implemented | DISCOUNTS; returnee previous season validation ($100 default) and certified lifeguard credentials verification ($50 default), administrative verification/rejection, installment schedule proportional scaling, and immutable audit logging; ADR 0033, [acceptance guide](../development/candidate-commercial-discounts-acceptance.md), unit and integration tests. |
| FR-035 | Advance invoice generation | Implemented | INVOICES-KIR; Section 17 sequential invoice generation, 6-decimal NBS conversion, digits and Serbian words generation, PDF invoices database, and automated KIR book maintenance; ADR 0031, [acceptance guide](../development/candidate-invoices-kir-acceptance.md), unit and integration tests. |
| FR-036 | NBS exchange rate | Implemented | INVOICES-KIR; 6-decimal scaled NBS rate snapshot, date, source, and calculated RSD settlement retained on every recorded payment and invoice; BR-009, ADR 0031, unit and integration tests. |
| FR-037 | Payment overview | Implemented | PAYMENT and INVOICES-KIR; candidate portal and admin real-time visibility into total liabilities, paid sums, outstanding debt, downloadable payment slips (nalog za uplatu with NBS IPS QR standard), and issued invoice PDFs; ADR 0031, [acceptance guide](../development/candidate-invoices-kir-acceptance.md), unit and integration tests. |
| FR-038 | Record received payment | Implemented | PAYMENT and INVOICES-KIR; audited payment recording with transaction locking, automatic invoice issuance with NBS conversion and Serbian words, automated KIR book synchronization, reversal tracking, and single/all candidate Excel exports; ADR 0031, [acceptance guide](../development/candidate-invoices-kir-acceptance.md), unit and integration tests. |
| FR-039 | Payment reminders | Implemented | PAYMENT-REMINDERS; automated multi-channel evaluation (Email, SMS, In-App), pre-due, on-due, and overdue triggers, attached NBS IPS payment slips, deduplication idempotency, communication logs, and audit trail; ADR 0032, [acceptance guide](../development/candidate-payment-reminders-acceptance.md), unit and integration tests. |
| FR-040 | Unlock continuation after payment | Implemented | PAYMENT advances the candidate to the program application. |
| FR-041 | Dynamic forms | Implemented | APPLICATION; versioned schema snapshots and resumable drafts. |
| FR-042 | Photo and introduction-video upload | Partial | PROGRAM-DOCUMENTS implements encrypted profile-photo upload; introduction video depends on REPO-30 and FLOW-31. |
| FR-043 | Document scanning/upload | Partial | PROGRAM-DOCUMENTS and the passport workflow implement encrypted, signature-validated upload and local OCR extraction; multi-program scanning pipelines remain FLOW-31. |
| FR-044 | Passport OCR | Implemented | PASSPORT-OCR; free open-source local OCR via Tesseract.js, ICAO 9303 MRZ parsing (TD3/TD1), sharp image preprocessing/normalization, fallback visual zone regex parsing, automated applicant name/DOB/JMBG match evaluation, expiration checks, candidate portal instant feedback, admin review panel with on-demand re-scan, and full audit trail; ADR 0034, unit and integration tests. |
| FR-045 | Program-specific documents | Partial | PROGRAM-DOCUMENTS implements the versioned SWT MVP checklist; other programs remain FLOW-31. |
| FR-046 | Job-interview preparation appointment | Implemented | INTERVIEW-PREP; controlled SWT scheduling, rescheduling and candidate visibility. |
| FR-047 | Interview-preparation attendance | Implemented | INTERVIEW-PREP; audited attendance, absence and cancellation outcomes for SWT. |
| FR-048 | Employment confirmation and job offer | Implemented | JOB-CATALOG + CANDIDATE-JOB-OPTIONS + EMPLOYMENT-OFFER; catalog filtering, immutable candidate shortlists, reversible interest, employer confirmation, reliable notification, acceptance evidence, and audited transition to visa. |
| FR-049 | Visa-payment order | Implemented | VISA-PAYMENT; versioned candidate-bound orders, immutable payment instructions, audited payment recording and cancellation, and candidate portal visibility. |
| FR-050 | Visa questionnaire | Implemented | VISA-QUESTIONNAIRE; encrypted resumable drafts, candidate submission, administrator correction/review, revision history, and HTTP/browser coverage. Trial questions require agency approval before production. |
| FR-051 | Visa-document checklist | Implemented | VISA-DOCUMENTS; versioned SWT checklist, encrypted uploads, administrator review, rejection/replacement, completion state, and HTTP/browser coverage. The agency must approve the final production list. |
| FR-052 | Passport-collection authorization | Implemented | PASSPORT-AUTHORIZATION; versioned template, encrypted immutable PDFs, explicit candidate acceptance, controlled download/print, audit trail, and HTTP coverage. Production wording and signature sufficiency require agency/legal approval. |
| FR-053 | Embassy appointment | Implemented | Versioned candidate entry, read-only admin view and audit trail; `docs/development/fr-053-054-acceptance.md`. |
| FR-054 | Three-day embassy reminder | Implemented | Scheduled email/SMS jobs, stale-version protection and delivery log; `docs/development/fr-053-054-acceptance.md`. |
| FR-055 | Embassy-interview preparation | Implemented | Purpose-scoped admin scheduling, candidate portal/calendar snapshot, audited attendance/absence/cancellation; [acceptance guide](../development/fr-055-acceptance.md), ADR 0020, integration and browser tests. External Calendly/availability management is not included. |
| FR-056 | Flight-ticket order | Implemented | FLIGHT-REQUEST; versioned portal request, validated travel dates, authoritative admin view, durable privacy-preserving email notification, audit and HTTP/browser coverage. |
| FR-057 | Flight-ticket offer | Implemented | FLIGHT-OFFER; versioned multi-option portal offer, reliable privacy-preserving notification, explicit candidate acceptance/rejection evidence, withdrawal, audit and HTTP/browser coverage. |
| FR-058 | Flight-ticket payment order | Implemented | FLIGHT-PAYMENT; accepted-option binding, immutable versioned orders, six-decimal NBS-rate snapshots, verified PDF download, audited payment/cancellation and HTTP coverage. Live NBS and accounting integrations remain production follow-up work. |
| FR-059 | Orientation meeting | Implemented | ORIENTATION; purpose-scoped scheduling, candidate portal/calendar snapshot, audited attendance/absence/cancellation and HTTP/browser coverage. External Calendly and group-session capacity remain future integration work. |
| FR-060 | USA stay materials | Implemented | USA-STAY; categorized official handbooks, insurance, SEVIS and emergency materials, program-scoped candidate downloads; ADR 0026, [acceptance guide](../development/usa-stay-support-acceptance.md), unit and integration tests. |
| FR-061 | Connect candidates by employer/state | Implemented | USA-STAY; opt-in peer networking by employer and state, GDPR/ZZPL consent toggle, contact privacy isolation, candidate portal panel; ADR 0026, [acceptance guide](../development/usa-stay-support-acceptance.md), unit and integration tests. |
| FR-062 | Useful tips | Implemented | USA-STAY; curated tips for SSN, banking, housing, transport, healthcare, taxes, category filtering, candidate portal panel; ADR 0026, [acceptance guide](../development/usa-stay-support-acceptance.md), unit and integration tests. |
| FR-063 | Chatbot | Planned | FLOW-31; requires a separate privacy and accuracy decision. |
| FR-064 | Central candidate overview | Implemented | ADMIN-CANDIDATES; unified overview combining processes, accounts, pre-applications, job offers, and payment state; ADR 0027, [acceptance guide](../development/admin-candidates-overview-acceptance.md), unit and integration tests. |
| FR-065 | Profile access and editing | Implemented | ADMIN-CANDIDATES; authorized administrator profile/process viewing and editing, timestamped audit logging; ADR 0027, [acceptance guide](../development/admin-candidates-overview-acceptance.md), unit and integration tests. |
| FR-066 | Data and document filters | Implemented | ADMIN-CANDIDATES; multi-criteria filtering by current step, lifecycle status, program, and payment; ADR 0027, [acceptance guide](../development/admin-candidates-overview-acceptance.md), unit and integration tests. |
| FR-067 | Search by name, surname, passport number | Implemented | ADMIN-CANDIDATES; dedicated passport/ID number filtering and column projections while preserving encryption boundaries; ADR 0027, [acceptance guide](../development/admin-candidates-overview-acceptance.md), unit and integration tests. |
| FR-068 | Candidates without a job offer filter | Implemented | ADMIN-CANDIDATES; dedicated filter isolating candidates without accepted job offers; ADR 0027, [acceptance guide](../development/admin-candidates-overview-acceptance.md), unit and integration tests. |
| FR-069 | Excel export | Implemented | ADMIN-CANDIDATES; complete and filtered XLSX export, column projection, formula injection escaping, and audit logging; ADR 0028, [acceptance guide](../development/admin-candidates-excel-export-acceptance.md), unit and integration tests. |
| FR-070 | Activity audit | Implemented | PRE plus immutable audit events in later increments. |
| FR-071 | Notifications | Implemented | ADMIN-COMMUNICATIONS; in-app portal notifications, candidate action alerts (contracts, payments, visas), unread state tracking and read-marking endpoint; ADR 0029, [acceptance guide](../development/admin-communications-acceptance.md), unit and integration tests. |
| FR-072 | Email communication | Implemented | ADMIN-COMMUNICATIONS; individual and cohort batch email sending, generic templates with variable interpolation, communication logging and audit trails; ADR 0029, [acceptance guide](../development/admin-communications-acceptance.md), unit and integration tests. |
| FR-073 | SMS communication | Implemented | ADMIN-COMMUNICATIONS; individual and cohort batch SMS messaging, generic templates, E.164 phone normalization, GSM-7/Unicode segment counter, provider delivery tracking; ADR 0029, [acceptance guide](../development/admin-communications-acceptance.md), unit and integration tests. |
| FR-074 | Search | Implemented | ADMIN-CANDIDATES; multi-field search across candidate name, surname, email, phone, and identification number; ADR 0027, [acceptance guide](../development/admin-candidates-overview-acceptance.md), unit and integration tests. |
| FR-075 | Automated translation/document generation | Implemented | DOCUMENT-TRANSLATIONS; automated structured translation of student certificates, guarantor declarations, and general documents, academic and official dictionaries, candidate request and listing APIs, certified PDF generator with SHA-256 integrity checksums, and audit trail; ADR 0030, [acceptance guide](../development/document-translations-acceptance.md), unit and integration tests. |

## PRILOG 1A - non-functional requirements

| ID | Requirement | Status | Evidence / next work |
| --- | --- | --- | --- |
| NFR-001 | Responsive access | Partial | Implemented screens are responsive; complete website/device acceptance is WEB-32. |
| NFR-002 | Visual identity | Partial | The `front/` prototype establishes direction; integrated public site is WEB-32. |
| NFR-003 | Access control | Implemented | Separate admin/candidate identities and ownership rules; TEST-AUTOMATION covers an unauthenticated administration boundary. |
| NFR-004 | Account and data security | Partial | Encryption, lockout, secure cookies, validation, shared rate limiting, trusted-proxy handling, and security headers exist; SECURITY staging acceptance and DEP-33 remain release work. |
| NFR-005 | Auditability | Implemented | Immutable workflow, contract, document, and finance evidence. |
| NFR-006 | Error handling | Partial | OBSERVABILITY adds liveness/readiness, safe operational logs, protected failure aggregates and an incident runbook; production alert delivery remains OPS-29. |
| NFR-007 | Backup and restore | Partial | RECOVERY implements encrypted backups and an automated synthetic restore drill; production storage, schedule, retention and approved recovery objectives remain OPS-29. |
| NFR-008 | Ownership and portability | Partial | Source and migrations are in Git; asset decision and handover are REPO-30 and WEB-32. |

## PRILOG 1A - business rules

| ID | Rule | Status | Evidence / next work |
| --- | --- | --- | --- |
| BR-001 | Online application precedes candidate/client status | Implemented | PRE. |
| BR-002 | Selection, material, and consultation precede profile readiness | Implemented | PRE and ACCOUNT. |
| BR-003 | Program determines destinations, contracts, workflow, documents, and forms | Partial | SWT vertical exists; multi-program completion is FLOW-31. |
| BR-004 | Qualified status starts automated material/consultation flow | Implemented | PRE. |
| BR-005 | Not-qualified status stops automation and allows a note | Implemented | PRE. |
| BR-006 | Consultation date/time belongs to the application/candidate | Implemented | PRE. |
| BR-007 | Accepted contract version cannot change with its template | Implemented | CONTRACT; immutable snapshot and checksums. |
| BR-008 | Payments and documents remain linked to candidate and program | Implemented | PAYMENT, PROGRAM-DOCUMENTS and private-document/contract foundations. |
| BR-009 | Financial calculations retain exchange rate and date | Implemented | FLIGHT-PAYMENT and INVOICES-KIR retain exact 6-decimal scaled NBS rate, date, source, reference, and calculated RSD amount on all candidate invoices and flight ticket payments; ADR 0024, ADR 0031, unit and integration tests. |
| BR-010 | AI/OCR output affecting an official document is reviewable | Implemented | DOCUMENT-TRANSLATIONS; strict human-in-the-loop verification rule disallowing approval or certification of translations without authenticated administrator ID and timestamp, draft field adjustments, rejection reasons, and gated PDF downloads; ADR 0030, [acceptance guide](../development/document-translations-acceptance.md), unit and integration tests. |
| BR-011 | Technical choices preserve future licensing/sale | Partial | Source-owned modular architecture exists; final portability review is REPO-30 and WEB-32. |

## PRILOG 1B - website requirements

PRILOG 1B numbers its sections rather than individual requirements. The engineering identifiers
`WEB-01` through `WEB-12` map one-to-one to source sections 1 through 12.

| ID | Source section | Status | Evidence / next work |
| --- | --- | --- | --- |
| WEB-01 | Goal and general requirement | Implemented | Responsive modern web application matching American Adventure brand identity; desktop/tablet/mobile optimized. |
| WEB-02 | Main menu and structure | Implemented | PRILOG 1B Section 2 aligned; PROGRAMI, AKCIJE, NOVOSTI, SARADNJA (Kompanije, Ambasadori, Franšiza), FOTO-STORY, KONTAKT; HOME removed; Job database and FAQ integrated in SWT. |
| WEB-03 | Programs and application forms | Implemented | PRILOG 1B Section 3 aligned; separate program presentations and dedicated forms for all 9 programs; mandatory privacy consent; optional newsletter consent; Dual Diploma/TESOL removed from SWT form. |
| WEB-04 | Required fields and application destinations | Implemented | PRILOG 1B Section 4 dynamic fields and destination emails implemented per program (SWT, Internship, High School, Au Pair, H-2B, Australia, Flights, Tax refund, Visa service). |
| WEB-05 | CTA and user journey | Implemented | Visible CTA buttons across all program cards and pages directly pre-selecting program in online application. |
| WEB-06 | Contact and social networks | Implemented | Single verified office map (Gospodar Jevremova 59/4, Beograd); Google+ removed; TikTok added; X icon replacing Twitter; CMS-aligned contact endpoints. |
| WEB-07 | Additional USA content | Implemented | Real-time live US timezone clock (NY, Chicago, Las Vegas, LA, Alaska, Hawaii); US States highlights and Fun Facts / Curiosities component. |
| WEB-08 | CMS and administration | Planned | Payload is the platform admin foundation; public content management is WEB-32. |
| WEB-09 | Technical and SEO requirements | Planned | Sitemap, redirects, canonical strategy, and full SEO acceptance are WEB-32. |
| WEB-10 | Security and privacy | Partial | SWT validation/consent and the SECURITY anti-abuse/header foundation exist; HTTPS edge staging acceptance remains SEC-28 and WEB-32. |
| WEB-11 | Handover and ownership | Partial | Source and technical decisions are versioned; final assets/accounts/licenses handover is WEB-32. |
| WEB-12 | Website acceptance | Planned | Depends on completion and verification of WEB-01 through WEB-11. |

## Review cadence

Review this matrix:

1. when an issue is accepted into an implementation increment;
2. in every pull request that changes status or evidence;
3. before staging and production release reviews;
4. before contractual acceptance or handover;
5. whenever a change request alters a source requirement.
