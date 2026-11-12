# ADR 0035: Free local passport OCR and MRZ validation

## Status
Accepted

## Context
Functional requirement FR-044 specifies automated passport OCR to assist with candidate identity verification, contract readiness, and consular submission preparation. Identity documents (passports, national ID cards) are highly sensitive personal data subject to strict privacy rules and GDPR compliance. Sending passport scans or photographs to third-party cloud OCR APIs (e.g., Google Cloud Vision, AWS Rekognition, Azure Computer Vision) introduces recurrent operational costs, API key management complexity, network dependencies, and privacy concerns regarding personal data transmission.

Furthermore, passports adhere to international standard ICAO Doc 9303, which defines a Machine Readable Zone (MRZ) containing standardized optical character representations of the passport number, nationality, birth date, sex, expiration date, and personal identifier (JMBG for Serbian passports), complete with cryptographic check digits.

## Decision
1. **Zero-cost, local and offline OCR engine:**
   - Use `tesseract.js` (pure JavaScript/WebAssembly port of Tesseract OCR, Apache 2.0 license) executed directly inside the Node.js backend runtime.
   - No external API keys, third-party subscriptions, or outbound data transfers are required.
   - Processing is 100% private, GDPR-compliant, and runs entirely on the agency server.

2. **Image preprocessing and normalization:**
   - Use `sharp` to auto-orient images via EXIF, apply grayscale contrast normalization, and generate optimized binary crops for the bottom 35-40% of the document where the MRZ resides.
   - For PDF uploads, extract embedded JPEG or PNG image streams directly from the PDF container.

3. **ICAO Doc 9303 MRZ parsing and error correction:**
   - Use `mrz` (MIT license) for parsing TD3 (passport) and TD1 (ID card) machine readable zones.
   - Include heuristics in `mrzNormalizer.ts` to correct typical OCR character confusion (e.g. `<` misrecognized as `K`, `L`, or spaces; `O` vs `0`; `I` vs `1`).
   - Extract and calculate check digits for document number, birth date, expiry date, personal number, and composite checksum.

4. **Dual-zone parsing and visual fallback:**
   - Implement a visual inspection zone (VIZ) regex parser (`visualParser.ts`) that extracts document particulars from Serbian and English labels (`Prezime`, `Ime`, `Broj pasoša`, `Važi do`, `JMBG`) when MRZ is obscured or cropped.

5. **Automated match evaluation and business rules:**
   - Compare OCR particulars against applicant registration records:
     - Name match: transliterated and normalized comparison against `applicant.firstName` and `applicant.lastName`.
     - Birth date match: comparison against `applicant.dateOfBirth`.
     - JMBG match: comparison against validated personal identifier.
     - Expiration check: flags expired passports and verifies that validity extends at least 6 months past SWT season conclusion (April of the following year).

6. **User interface and auditability:**
   - Candidate portal (`ContractReadinessPanel.tsx`): returns immediate feedback upon upload confirming recognized passport number and expiry date.
   - Administrator review panel (`PrivateDocumentReviewPanel.tsx`): displays structured OCR fields, match badges, warning notes, and an on-demand re-scan button.
   - Audit trail: records `PASSPORT_OCR_PROCESSED` events with extraction metadata.

## Consequences
- Passports are automatically parsed in ~500ms to 1.5s locally without third-party fees or external network calls.
- Candidate and administrator workloads are reduced through automated verification aids.
- Final contractual decisions still require administrator confirmation (`VERIFIED` or `REJECTED`) preserving human oversight.
