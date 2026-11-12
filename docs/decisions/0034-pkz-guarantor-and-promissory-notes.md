# ADR 0034: PKZ and Guarantor Security System (FR-029, FR-030)

- Status: Accepted for MVP
- Date: 2026-10-12
- Related: ADR 0004, ADR 0005, ADR 0006, Section 8 of PRILOG 1 (v2.0), PRILOG 1A (FR-029, FR-030, BR-008, FLOW-31)

## Context

Section 8 of **PRILOG 1 (v2.0)** ("Načini plaćanja, akcije i popusti", pp. 10–12) defines the "Platiš kad zaradiš" (PKZ / Pay-when-you-earn) model for Work & Travel candidates:

- **FR-029 – Pay-when-you-earn option (PKZ):**
  - Allows candidates to pay a lower initial deposit (`depositCents`) before departure, while the deferred program fee (`deferredAmountCents`) is settled once the candidate begins earning wages in the United States or upon return.
  - Due to credit and collection risk, opting for PKZ strictly requires providing a creditworthy guarantor and establishing legally binding security instruments.
- **FR-030 – Guarantor data and promissory notes:**
  - Mandatory guarantor data collection: full name, Serbian JMBG (validated with modulo 11 checksum and age $\ge$ 18 verification), ID card number and issuer, residential address, contact phone, email, kinship/relationship to candidate, employment status, employer name, job title, and certified monthly income in RSD.
  - End-to-end encrypted upload of the read/scanned ID card (`GUARANTOR_ID_CARD`) with magic-byte validation and 5 MB threshold.
  - Multi-party **Guarantor Agreement and Promissory Note Authorization** (Ugovor o solidarnom jemstvu i menično ovlašćenje) PDF generation pursuant to Articles 997–1013 of the Serbian Law on Contracts and Torts (ZOO) and the Serbian Law on Bills of Exchange.
  - Mandatory administrative verification of guarantor identity and creditworthiness before contract finalization.

## Decision

1. **Business Domain and Validation (`modules/guarantor/rules.ts`):**
   - Modulo 11 JMBG checksum validation and calendar date extraction.
   - Strict legal adulthood check: guarantor must be at least 18 years of age at the time of submission.
   - Comprehensive sanitization of employment, income, ID card, and contact data.
   - Default security package requires 2 blank single promissory notes (`promissoryNotesCount: 2`).

2. **Sensitive Data Cryptography and Privacy:**
   - Guarantor JMBG is encrypted using AES-256-GCM (`guarantor-jmbg:${candidateAccountId}`) via `sensitiveDataCrypto.ts`, with key rotation support and HMAC-SHA-256 fingerprinting for duplicate detection.
   - Guarantor ID card is stored in `CandidatePrivateDocuments` with `documentType: 'GUARANTOR_ID_CARD'` encrypted via AES-256-GCM (`guarantor-id-card:${candidateAccountId}`).
   - Plaintext JMBG and ID card numbers are never exposed in JSON responses (only masked strings such as `1505975******`).

3. **Payload CMS Schema and Database Architecture:**
   - Collection `CandidateGuarantors` (`candidate-guarantors`):
     - One-to-one relationship with `candidate-accounts`.
     - Relationships to `candidate-processes`, `pre-applications`, and `candidate-sensitive-profiles`.
     - Verification status lifecycle: `PENDING_REVIEW` $\rightarrow$ `VERIFIED` or `REJECTED` (with mandatory rejection reason).
     - Link to uploaded `idCardDocument`.
     - Storage of encrypted multi-party agreement PDF (`contractPdfCiphertext`, `contractPdfSha256`, etc.).
   - Extended `AuditEvents` with:
     - `GUARANTOR_DATA_SUBMITTED`
     - `GUARANTOR_ID_CARD_UPLOADED`
     - `GUARANTOR_VERIFIED`
     - `GUARANTOR_REJECTED`
     - `GUARANTOR_CONTRACT_GENERATED`
   - PostgreSQL migration `20261012_140000_pkz_guarantor.ts`.

4. **Multi-Party PDF Generation (`modules/guarantor/renderGuarantorContractPdf.ts`):**
   - High-fidelity PDF rendering with `@pdf-lib/fontkit` and Unicode support.
   - Explicit representation of all three parties: Agency (American Adventure d.o.o.), Candidate (Primary Debtor), and Guarantor (Solidary Debtor / Jemac-platac).
   - Core legal clauses:
     - Article 1: Work & Travel PKZ terms, deposit, and deferred debt.
     - Article 2: Solidary joint-and-several suretyship (ZOO Art. 1004).
     - Article 3: Authorization for 2 blank promissory notes with "bez protesta" clause at NBS middle rate.
     - Article 4: Warranties of creditworthiness and true statements.
     - Article 5: Governing law and First Basic Court in Belgrade jurisdiction.
     - Signature blocks for all three contracting parties.

5. **Controlled API Endpoints:**
   - Candidate:
     - `GET /api/candidate/guarantor` (overview and masked data)
     - `POST /api/candidate/guarantor` (data submission/resubmission)
     - `POST /api/candidate/guarantor/id-card` (encrypted ID upload)
     - `GET /api/candidate/guarantor/contract-pdf` (download decrypted PDF agreement)
   - Administrator:
     - `GET /api/admin/guarantor` (search, pagination, and status filters)
     - `POST /api/admin/guarantor/[id]/verify` (verification and automatic contract generation)
     - `POST /api/admin/guarantor/[id]/reject` (rejection with feedback)
     - `GET /api/admin/guarantor/[id]/id-card` (controlled decrypted document inspection)

## Consequences

- Full compliance with Serbian commercial legal requirements for suretyship and bills of exchange.
- Secure, GDPR/ZZPL-compliant handling of sensitive guarantor personal and financial data.
- Complete audit trail for all guarantor submissions, document reviews, and contract generations.
- Seamless gatekeeping: PKZ candidates cannot finalize program contracts until their guarantor is fully verified by agency staff.
