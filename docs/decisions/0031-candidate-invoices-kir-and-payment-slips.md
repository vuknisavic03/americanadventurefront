# ADR 0031: Candidate Invoices, Automated KIR Book Maintenance, Payment Slips, and Financial Excel Reporting (Section 17)

- Status: Accepted for MVP
- Date: 2026-10-09
- Related: Section 17 of PRILOG 1 (v2.0), PRILOG 1A (FR-035, FR-036, FR-037, FR-038, BR-008, BR-009, NFR-005)

## Context

Section 17 of **PRILOG 1 (v2.0)** ("17. Menadžment faktura i uplata kandidata", p. 23) defines the comprehensive invoicing, payment slip, book of issued invoices (KIR), and financial reporting workflow:

1. **Payment Slips (Primer uplatnice):**
   - *"Za svaku uplatu, sistem će da generiše primer uplatnice za kandidate."*
   - For every planned payment obligation, candidates must be able to view and download a printable payment slip (Nalog za uplatu) formatted with payer details, purpose of payment, recipient details, recipient bank account, model 97 with reference number, amount in RSD (computed via NBS rate), and Serbian NBS IPS QR code string for instant mobile banking scanning.

2. **Invoices with NBS Exchange Rate and Serbian Words Generation:**
   - *"Na osnovu potvrde o primljenoj uplati od strane admina, sistem svakoj fakturi (koja je vezana za pojedinačnu uplatu) dodeljuje broj fakture i iznos, po izračunatom iznosu u dinarima a u skladu sa kursom NBS na dan, se prepravlja u datom šablonu za fakture."*
   - *"Ime prezime, broj fakture, iznos brojevima i iznos slovima su promenljive koje sistem sam generiše."*
   - *"Svaka faktura se pretvara u PDF i po rednom broju čuva u bazi faktura koja će postojati u sistemu."*
   - Payment confirmation by an administrator must trigger invoice creation with:
     - Sequential invoice numbering locked per calendar year (`FAKT-YYYY-XXXX`).
     - NBS middle exchange rate captured on the payment date with 6-decimal precision (`EXCHANGE_RATE_SCALE = 1_000_000`), complying with **BR-009**.
     - Automated generation of candidate name, invoice number, amount in digits (`X.XXX,XX RSD`), and amount written in Serbian words (e.g. *"trideset osam hiljada pet stotina dinara i 00/100"*).
     - Official PDF invoice generated with cryptographic SHA-256 checksum and stored in the invoices collection.

3. **Automated KIR Book (Knjiga izdatih računa) Maintenance:**
   - *"Sistem će automatski da vodi KIR knjigu izdatih računa, po tačnom datom šablonu, gde je potrebno unošenje sledećih elemenata: Red br., Datum Knjiženja, Broj računa, Datum izdavanja računa, Naziv/ime kupca, PIB (ili JMBG), Iznos računa, NAPOMENA."*
   - Every generated invoice must automatically populate and synchronize with the KIR book.

4. **Excel Financial Exports:**
   - *"Sistem treba da omogući izvlačenje izveštaja o uplatama svih ili pojedinačnog kandidata u Excel formatu."*
   - Administrators must be able to export:
     a) Full KIR book / consolidated payments report in Excel format (.xlsx) adhering to the exact required 8-column layout.
     b) Individual candidate financial ledger in Excel format detailing contract obligations, payments with NBS rates, issued invoices, and outstanding balance.
     - With CSV/formula injection sanitization and immutable audit logging (`FINANCIAL_REPORT_EXPORTED`).

5. **Transparency for Candidate and Administrator:**
   - *"Kandidat i admin će u svakom trenutku moći da vide izvršene uplate i šta je ostalo da se plati."*
   - Both candidate portal and administrator interfaces must provide instant visibility into paid sums, remaining liabilities, payment slips, and issued invoice PDFs.

## Decision

1. **Payload Collection: `CandidateInvoices` (`candidate-invoices`):**
   - Stores all generated candidate invoices with fields:
     - Relations: `candidateAccount`, `candidateProcess`, `preApplication`, `candidatePayment`, `issuedBy`.
     - Identification: `invoiceNumber` (unique text, e.g. `FAKT-2026-0001`), `sequenceNumber` (integer), `year` (integer).
     - Buyer Info: `buyerName`, `buyerAddress`, `buyerTaxId` (JMBG or passport).
     - Financials: `originalAmountCents`, `originalCurrency`, `exchangeRateScaled` (6-decimal integer), `exchangeRateDate`, `settlementAmountRsdCents`, `amountInWords`.
     - Dates: `issueDate`, `accountingDate`.
     - Document Integrity: `pdfSha256`, `pdfBase64`, `note`.

2. **Serbian Number-to-Words Utility (`numberToWordsSerbian.ts`):**
   - Converts integer dinar amounts and paras into formal Serbian written words with correct grammatical cases and currency suffixes.

3. **PDF Generation via `pdf-lib`:**
   - `renderInvoicePdf.ts`: Generates professional corporate invoice PDF with American Adventure branding, company identifiers (PIB 104987654, MB 20123456, account), buyer particulars, fee breakdown, VAT exemption clause (čl. 24 Zakona o PDV), NBS rate snapshot, digits, words, and SHA-256 seal.
   - `renderPaymentSlipPdf.ts`: Generates standard Serbian payment slip (Nalog za uplatu) and NBS IPS QR payment string.

4. **Automatic KIR Service (`invoices/service.ts`):**
   - When a payment is recorded, an invoice is generated automatically using the payment amount and the provided/active NBS exchange rate.
   - Sequence generation uses atomic transaction locks.
   - KIR entries are extracted directly or queried efficiently with filtering by year, month, and date range.

5. **Excel Export (`exportExcel.ts`):**
   - Built on `exceljs` with corporate styling, column width auto-calculation, and formula sanitization.
   - Supports both consolidated KIR export and single-candidate financial ledgers.

6. **Audit Trail:**
   - Adds `INVOICE_GENERATED`, `FINANCIAL_REPORT_EXPORTED`, and `PAYMENT_SLIP_GENERATED` audit events.

## Consequences

- Full compliance with Section 17 of PRILOG 1 (v2.0), BR-008, BR-009, and FR-035–FR-038.
- Candidate portal gains self-service access to payment slips and invoice downloads.
- Administrator gains fully automated invoicing, automated KIR book maintenance, and Excel export capabilities.
