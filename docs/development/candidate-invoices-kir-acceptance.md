# Acceptance Guide: Candidate Invoices, Automated KIR Book Maintenance, Payment Slips, and Financial Excel Reporting (Section 17)

## Overview

This guide defines verification procedures for **Section 17 of PRILOG 1 (v2.0)** ("Menadžment faktura i uplata kandidata"), covering:
1. **Automated Payment Slips (Primer uplatnice za kandidate):** Generation of Serbian standard payment slips ("Nalog za uplatu") and NBS IPS QR code strings for every payment obligation.
2. **Automated Invoice Generation:** Conversion of candidate payments into official PDF invoices using the official NBS middle exchange rate on the payment date, sequential annual numbering (`FAKT-YYYY-XXXX`), and automated generation of candidate name, invoice number, amount in digits, and amount written in Serbian words.
3. **Automated KIR Book (Knjiga izdatih računa):** Continuous synchronization of issued invoices into the official 8-column KIR book format.
4. **Excel Financial Reporting:** Exporting both the complete KIR book and individual candidate financial ledgers into formatted, injection-safe Excel (.xlsx) workbooks.
5. **Real-time Financial Visibility:** Transparent overview of paid amounts and remaining liabilities on both candidate and administrator portals.

Related documents:
- [ADR 0031: Candidate Invoices, KIR, and Payment Slips](../decisions/0031-candidate-invoices-kir-and-payment-slips.md)
- [Requirements Traceability Matrix](../requirements/traceability-matrix.md)

---

## 1. Automated Payment Slips (Primer uplatnice)

### Contract Requirement
*"Za svaku uplatu, sistem će da generiše primer uplatnice za kandidate."*

### Specification & Behavior
- Candidates can access printable and downloadable payment slips for each payment obligation in their payment plan (e.g. initial installment, subsequent installments).
- Payment slip contents:
  - **Uplatilac:** Candidate's full name, residential address, city.
  - **Svrha uplate:** Program payment description (e.g., `Uplata za program Work and Travel - I rata - [Ime Prezime]`).
  - **Primalac:** `American Adventure DOO, Beogradska 12, 11000 Beograd`.
  - **Račun primaoca:** Official agency bank account (`265-1110310001234-56`).
  - **Model:** `97`.
  - **Poziv na broj:** Computed reference with ISO 7064 Modulo 97 control digits.
  - **Iznos:** Amount in RSD calculated via the exchange rate.
  - **Šifra plaćanja:** `289` (bezgotovinski prenos) / `189` (gotovinski).
  - **NBS IPS QR standard:** Generated payload string conforming to National Bank of Serbia IPS QR specifications (`K:PR|V:01|...`) for instant mobile banking app scanning.
- **API Endpoint:**
  - `GET /api/candidate/payment-slips/[obligationKey]` (returns PDF download or view)
  - `GET /api/candidate/payment-slips/[obligationKey]?format=json` (returns structured JSON payload)

---

## 2. Invoices with NBS Exchange Rate and Serbian Words Generation

### Contract Requirement
*"Na osnovu potvrde o primljenoj uplati od strane admina, sistem svakoj fakturi (koja je vezana za pojedinačnu uplatu) dodeljuje broj fakture i iznos, po izračunatom iznosu u dinarima a u skladu sa kursom NBS na dan, se prepravlja u datom šablonu za fakture.*
*Ime prezime, broj fakture, iznos brojevima i iznos slovima su promenljive koje sistem sam generiše.*
*Svaka faktura se pretvara u PDF i po rednom broju čuva u bazi faktura koja će postojati u sistemu."*

### Specification & Behavior
- Invoicing is triggered upon administrator recording of a payment via `/api/admin/payments/record` (or on-demand via the invoices service).
- **Sequential Numbering:** Locked atomic counter per calendar year (`FAKT-YYYY-XXXX`).
- **NBS Rate Precision:** Scaled to 6 decimal places (`EXCHANGE_RATE_SCALE = 1_000_000`) complying with **BR-009**.
- **Serbian Words Generation:** `amountInWordsSerbian` generates grammatically correct Serbian words for dinars and paras (e.g. `37.975,00 RSD` -> `"trideset sedam hiljada devet stotina sedamdeset pet dinara i 00/100"`).
- **Official PDF Invoices:** Built using `pdf-lib` and `@pdf-lib/fontkit` including:
  - Header with American Adventure DOO corporate registration details (PIB, MB, account).
  - Buyer particulars (name, address, JMBG/passport).
  - Program fee itemization and VAT exemption clause (čl. 24 Zakona o PDV).
  - NBS exchange rate calculation breakdown.
  - Summary box with digits and generated words.
  - SHA-256 cryptographic hash seal.
- **API Endpoints:**
  - Candidate: `GET /api/candidate/invoices`, `GET /api/candidate/invoices/[id]/download`
  - Admin: `GET /api/admin/invoices`, `GET /api/admin/invoices/[id]/download`

---

## 3. Automated KIR Book (Knjiga izdatih računa)

### Contract Requirement
*"Sistem će automatski da vodi KIR knjigu izdatih računa, po tačnom datom šablonu, gde je potrebno unošenje sledećih elemenata:*
*Red br.*
*Datum Knjiženja*
*Broj računa*
*Datum izdavanja računa*
*Naziv/ime kupca*
*PIB*
*Iznos računa*
*NAPOMENA"*

### Specification & Behavior
- Every created invoice automatically enters the KIR book.
- **KIR Columns:**
  1. `Red br.` (sequenceNumber)
  2. `Datum Knjiženja` (accountingDate formatted DD.MM.YYYY.)
  3. `Broj računa` (invoiceNumber)
  4. `Datum izdavanja računa` (issueDate formatted DD.MM.YYYY.)
  5. `Naziv/ime kupca` (buyerName)
  6. `PIB` (buyerTaxId or JMBG)
  7. `Iznos računa` (formatted amount in RSD)
  8. `NAPOMENA` (note)
- **API Endpoint:** `GET /api/admin/kir?year=YYYY&month=MM`

---

## 4. Financial Excel Reporting

### Contract Requirement
*"Sistem treba da omogući izvlačenje izveštaja o uplatama svih ili pojedinačnog kandidata u Excel formatu."*

### Specification & Behavior
- Built on `exceljs` with formula sanitization against CSV/formula injection (`sanitizeExcelCellValue`).
- **Reports:**
  1. **Consolidated KIR Book Export:**
     - Endpoint: `GET /api/admin/kir/export?year=YYYY&month=MM`
     - Generates `.xlsx` matching the official 8-column layout with corporate styling and totals row.
     - Logs audit event `FINANCIAL_REPORT_EXPORTED`.
  2. **Single Candidate Financial Ledger:**
     - Endpoint: `GET /api/admin/candidates/[id]/financial-report`
     - Generates `.xlsx` detailing candidate particulars, agreed obligations, recorded payments with NBS rates, issued invoices, and outstanding balance.
     - Logs audit event `FINANCIAL_REPORT_EXPORTED`.

---

## 5. Candidate and Admin Financial Transparency

### Contract Requirement
*"Kandidat i admin će u svakom trenutku moći da vide izvršene uplate i šta je ostalo da se plati."*

- **Candidate Portal (`moj-nalog`):**
  - Displays total liability, total paid, and remaining balance.
  - "Plan obaveza i uplatnice": Each obligation includes a direct "Preuzmi primer uplatnice (PDF)" action.
  - "Izdati računi i fakture (KIR)": Direct table with all issued invoice numbers, dates, amounts, and PDF download buttons.
- **Admin Portal:**
  - Admin payment recording panel captures payments, records NBS rates, auto-generates invoices and updates the KIR book.
  - Admin candidates overview provides candidate financial ledgers and Excel exports.
