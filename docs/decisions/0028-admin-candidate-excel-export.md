# ADR 0028: Administrative candidate Excel (XLSX) export with filters and projection

- Status: Accepted for MVP
- Date: 2026-10-08
- Related: FR-069, FR-067, FR-066, FR-068, FR-070, ADR 0027

## Context

According to contract specification **PRILOG 1 (v2.0)** (Section 14: Administrativni modul, p. 19):
1. **FR-069 (Izvoz u Excel):**
   - Requirement: "Filtrirani ili svi podaci mogu se izvesti u XLSX."
   - Acceptance criteria: "Fajl je validan i sadrži očekivane podatke."
2. **FR-067 (Filter – ime, prezime, broj pasoša):**
   - Acceptance criteria: "Prikaz/izvoz sadrži samo tražena polja."
3. **FR-070 (Audit aktivnosti):**
   - Requirement: System records time and actor for relevant actions. Export of sensitive candidate cohorts must be explicitly audited.
4. **Spreadsheet Formula Injection Mitigation:**
   - Spreadsheet applications (Microsoft Excel, LibreOffice Calc, Google Sheets) execute cells beginning with `=`, `+`, `-`, or `@` as active formulas or external links (CSV/formula injection). Because candidate records contain user-submitted notes, names, or addresses, untrusted cell content must be safely escaped.

## Decision

1. **Excel Generation Engine (`ExcelJS`):**
   - Adopt `exceljs` (pinned at `4.4.0`) to generate native OpenXML `.xlsx` spreadsheets in memory as binary buffers.
   - Configure a structured worksheet named `'Kandidati'` with frozen headers (`views: [{ state: 'frozen', ySplit: 1 }]`), custom header heights (24pt), bold white text on dark slate background (`#1E293B`), and auto-fitted column widths.

2. **Column Mapping and Field Projection (FR-067, FR-069):**
   - Standard export exports 27 comprehensive columns with localized Serbian titles:
     `ID`, `Ime`, `Prezime`, `Puno ime`, `Email`, `Telefon`, `Broj pasoša / LK`, `Datum rođenja`, `Državljanstvo`, `Fakultet`, `Grad studiranja`, `Program`, `Paket`, `Status procesa`, `Kod faze`, `Trenutna faza`, `Progres`, `Ima radnu ponudu`, `Poslodavac`, `Radna pozicija`, `Grad rada`, `Savezna država`, `Cena programa (EUR)`, `Način plaćanja`, `Admin beleška`, `Datum kreiranja`, `Datum izmene`.
   - When the `fields` query parameter is supplied (e.g. `fields=name,surname,passport,job` or `fields=firstName,lastName,idCardOrPassportNumber`), `resolveExportColumns` maps friendly aliases to canonical keys and exports only the requested columns.

3. **Formula Injection Sanitization:**
   - Implement `sanitizeExcelCellValue(value)`. Any string whose trimmed content starts with `=`, `+`, `-`, or `@` is prefixed with a single quote `'` (`'${value}`) so spreadsheet clients treat the cell as a safe literal.

4. **Multi-Criteria Filter Parity (FR-066, FR-068, FR-074):**
   - The export endpoint (`GET /api/admin/candidates/export`) supports the exact query parameters as the overview endpoint:
     `currentStep`, `processStatus`, `programCode`, `withoutJobOffer`, `hasJobOffer`, `passportNumber`, `q`, `search`, and `fields`.
   - The export service evaluates up to 10,000 records without page limits to generate a complete snapshot of the matching candidate cohort.

5. **Auditing (FR-070):**
   - Every execution writes an immutable event to `audit-events` with `eventType: 'CANDIDATE_DATA_EXPORTED'`, recording `actor: adminId`, `actorType: 'ADMIN'`, `metadata: { exportedCount, filters, fields, format: 'XLSX', filename }`.
   - A dedicated database migration (`20261008_200000_admin_candidate_export_audit_event.ts`) extends PostgreSQL `enum_audit_events_event_type` with `'CANDIDATE_DATA_EXPORTED'`.

6. **HTTP Response Specification:**
   - `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition`: `attachment; filename="kandidati-YYYY-MM-DD.xlsx"`
   - `Cache-Control`: `no-store`
   - Requires authenticated administrative access (`collection === 'users'`), returning `401 Unauthorized` for anonymous requests and `403 Forbidden` for candidate accounts.

## Consequences

- Administrators can export complete or filtered candidate cohorts to professional, styled Excel sheets in one click.
- Strict column projection satisfies FR-067 contractual acceptance criteria.
- Complete audit trails guarantee compliance and accountability for personal data exports.
