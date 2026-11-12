# ADR 0030: Automated Official Document Translation, Administrative Review (BR-010), and Certified English PDF Generation (FR-075)

- Status: Accepted for MVP
- Date: 2026-10-09
- Related: FR-075, BR-010, Section 15 of PRILOG 1 (v2.0), PRILOG 1A

## Context

According to the contract specification **PRILOG 1 (v2.0)** (Section 15: Prevođenje i overa dokumenata, p. 20) and business rule **BR-010**:
1. **FR-075 (Automatski prevod / generisanje prevedenog dokumenta):**
   - Requirement: "Sistem automatski prevodi i generiše prevedeni dokument na osnovu šablona i unosa."
   - Acceptance criteria: "Prevedeni dokument generisan i verifikovan."
2. **BR-010 (AI / OCR Reviewability & Human Verification):**
   - Requirement: "AI/OCR output affecting an official document is reviewable." (PRILOG 1A, Rule BR-010).
   - Strict constraint: Automated translation or OCR outputs must never bypass human review. An authenticated administrator must inspect the draft, adjust any translated fields as needed, and formally approve the translation before an official certified PDF is issued to candidates or foreign sponsors/embassies.
3. **Auditability (FR-070):**
   - Every translation request, draft modification, approval, and rejection must produce immutable audit log entries with administrator attribution.

## Decision

1. **Dedicated Collection (`TranslatedDocuments`):**
   - Introduce `translated-documents` (`slug: 'translated-documents'`) mapped to table `translated_documents` in PostgreSQL via migration `20261009_120000_document_translations_fr_075`.
   - Fields:
     - Relations: `candidateProcess` (FK), `candidateAccount` (FK), `reviewedBy` (users FK).
     - Document metadata: `documentType` (`STUDENT_STATUS_CERTIFICATE`, `GUARANTOR_STATEMENT`, `GENERAL_DOCUMENT`), `title`, `sourceLanguage` (`sr`), `targetLanguage` (`en`), `status` (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`), `version` (integer).
     - Structured JSON data: `sourceData` (Serbian source fields) and `translatedData` (English translated fields).
     - Verification & Audit: `adminNotes`, `rejectionReason`, `reviewedAt`, `pdfGeneratedAt`, `pdfChecksum` (SHA-256 hex string).

2. **Domain Translation Engine & Academic Dictionaries:**
   - Implemented in `src/modules/document-translations/`:
     - `templates.ts`: Curated academic and official dictionaries covering Serbian universities (e.g., University of Belgrade, University of Novi Sad), faculties (FON, ETF, FTN, Economics, Law, Medicine), study years (Freshman, Sophomore, Junior, Senior, Master, Senior/Apsolvent), enrollment statuses (Budget, Self-financing, Full-time), guarantor relationships (Father, Mother, Brother, etc.), and employment statuses.
     - `translator.ts`: Translates raw student certificates, guarantor declarations, and general candidate documents into structured English records with standardized agency certification clauses.
     - Currency conversion helper converting Serbian dinar (RSD) guarantor income to EUR estimates.

3. **Strict Human-in-the-Loop Review (BR-010):**
   - Implemented in `rules.ts`:
     - Disallows transitioning documents to `APPROVED` without an authenticated administrator ID (`adminId > 0`).
     - Once `APPROVED`, the document is frozen and immutable; subsequent modifications cannot overwrite certified documents.
     - Rejection requires an explicit `rejectionReason` explaining why the document cannot be certified.
     - PDF downloads are strictly gated (`canDownloadTranslationPdf`) until `status === 'APPROVED'` and `pdfChecksum` is cryptographically computed.

4. **Official Certified PDF Generator (`pdfRenderer.ts`):**
   - Built on `pdf-lib` and `@pdf-lib/fontkit`.
   - Features:
     - Corporate branding header ("AMERICAN ADVENTURE", EST. 2007) with official "CERTIFIED ENGLISH TRANSLATION" badge.
     - Candidate identification card and structured tabular data presentation.
     - Formal Agency Certification Statement certifying accuracy for U.S. Sponsor and Embassy visa processing.
     - Authorized verification block displaying administrator's name, title, and timestamp.
     - Cryptographic SHA-256 integrity checksum displayed in footer and embedded in HTTP headers (`ETag`).
     - Dual-mode typography with Geist TTF font and safe ASCII transliteration fallback.

5. **API Surface:**
   - Candidate routes:
     - `POST /api/candidate/translations/request`: Candidate initiates translation request for their active process.
     - `GET /api/candidate/translations`: Candidate retrieves list and status of their translations.
   - Admin routes:
     - `GET /api/admin/translations`: Filterable listing (`status`, `documentType`, `candidateProcessId`, pagination).
     - `GET /api/admin/translations/[id]`: Retrieve full translation details.
     - `PATCH /api/admin/translations/[id]`: Administrator adjusts draft translated fields before certification.
     - `POST /api/admin/translations/[id]/review`: Administrator formally approves or rejects (enforces BR-010).
   - Document download:
     - `GET /api/translations/[id]/download`: Secure PDF download with ownership checks for candidates and full access for administrators.

6. **Audit Events:**
   - `DOCUMENT_TRANSLATION_REQUESTED`
   - `DOCUMENT_TRANSLATION_UPDATED`
   - `DOCUMENT_TRANSLATION_APPROVED`
   - `DOCUMENT_TRANSLATION_REJECTED`

## Consequences

- **Positive:**
  - Full compliance with PRILOG 1 (v2.0) Section 15 (FR-075) and contract business rule BR-010.
  - Zero risk of unreviewed AI/OCR content being published as certified documents.
  - Verifiable document integrity via SHA-256 checksums and comprehensive audit logs.
  - Extensible architecture ready for external AI translation and OCR providers in future iterations.
- **Negative / Operational considerations:**
  - Administrators must explicitly review and approve translation requests before candidates can download certified PDFs.
