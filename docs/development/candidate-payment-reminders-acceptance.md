# Acceptance Guide: Candidate Payment Reminders and Overdue Notices (FR-039)

## Overview

This guide defines verification procedures for **FR-039 of PRILOG 1 (v2.0)** ("Opomene za plaćanje", pp. 12–13):

- **Contract Requirement:** *"Sistem šalje email i SMS podsetnike prema pravilima Admina."*
- **Acceptance Criterion:** *"Slanje se evidentira."*
- **Related Requirements:** FR-028 (Plaćanje na rate), FR-037 (Pregled uplata), BR-008, BR-009, NFR-005 (Auditabilnost).

Related documents:
- [ADR 0032: Candidate Payment Reminders and Overdue Notices Automation](../decisions/0032-candidate-payment-reminders-automation.md)
- [Requirements Traceability Matrix](../requirements/traceability-matrix.md)

---

## 1. Pokretanje i automatska verifikacija

```bash
cd /home/nemanja/AmericanAdventure26
git switch feat/fr-039-payment-reminders
cd apps/platform

# Pokretanje svih jediničnih testova (pravila evaluacije i servis podsetnika)
npx vitest run src/modules/payment-reminders

# Tipovi i linter
npm run typecheck
npm run lint

# Kompletna provera svih servisa
npm test
```

---

## 2. Funkcionalna verifikacija administratorskih servisa

### A. Pregled kandidata i dospelih obaveza
1. Prijavite se na platformu kao administrator.
2. Pošaljite `GET /api/admin/payments/reminders` sa opcionalnim filterima:
   - `triggerFilter=ALL` (podrazumevano): lista svih aktivnih planova sa neizmirenim obavezama.
   - `triggerFilter=PRE_DUE`: kandidati kojima rata dospeva u narednih N dana (podrazumevano 5 dana).
   - `triggerFilter=DUE_TODAY`: kandidati kojima rata dospeva na današnji dan.
   - `triggerFilter=OVERDUE`: kandidati sa prekoračenim rokom dospeća.
   - `search`: tekstualna pretraga po imenu, prezimenu, email adresi, telefonu ili nazivu rate.
3. Proverite da odgovor sadrži:
   - `stats`: `{ totalActivePlans, overdueCount, dueTodayCount, preDueCount, eligibleCount }`.
   - `items`: niz kandidata sa podacima o dugu, plaćenim iznosima, trenutno aktivnoj rati i datumu poslednjeg podsetnika.

### B. Pojedinačno slanje podsetnika kandidatu
1. Pošaljite `POST /api/admin/payments/reminders` sa telom:
   ```json
   {
     "candidateProcessId": 1,
     "obligationKey": "INSTALLMENT_2",
     "channel": "ALL",
     "customNote": "Molimo vas da blagovremeno izmirite ratu."
   }
   ```
2. Proverite da odgovor vrati status `200` i niz rezultata za svaki kanal (`EMAIL`, `SMS`, `IN_APP`).
3. Proverite da je u `communication-logs` kreiran zapis za svaki kanal:
   - `channel: 'EMAIL'`: formatiran naslov, tekst sa podacima za uplatu (iznos u USD i RSD po NBS kursu, račun, model 97, poziv na broj) i linkom ka PDF uplatnici sa NBS IPS QR kodom.
   - `channel: 'SMS'`: sažeta SMS poruka sa rokom dospeća i linkom ka portalu.
   - `channel: 'IN_APP'`: portal notifikacija sa naslovom i rokom dospeća.
4. Proverite da je u `audit-events` zabeležen događaj:
   - `eventType: 'PAYMENT_REMINDER_SENT'`, sa identifikatorom administratora, vremenom i metapodacima.

### C. Provera zaštite od slanja duplikata (Idempotencija)
1. Ponovite identičan zahtev za slanje podsetnika bez parametra `"force": true`.
2. Sistem automatski detektuje prethodno uspešno slanje za tekući ciklus i vraća:
   ```json
   {
     "status": "SKIPPED",
     "reason": "ALREADY_DELIVERED"
   }
   ```
3. U bazi se ne kreiraju dupli zapisi u `communication-logs`.
4. Ukoliko administrator izričito želi ponovno slanje, postavlja `"force": true`, nakon čega se podsetnik ponovo isporučuje.

### D. Grupno slanje podsetnika
1. Pošaljite `POST /api/admin/payments/reminders`:
   ```json
   {
     "batch": true,
     "triggerFilter": "OVERDUE",
     "channel": "ALL"
   }
   ```
2. Sistem prolazi kroz sve kandidate sa dospelim dugovanjem i isporučuje opomene.
3. Odgovor vraća agregirane podatke:
   ```json
   {
     "dispatched": 10,
     "skipped": 2,
     "failed": 0
   }
   ```

### E. Automatski periodični posao (Cron / Task runner)
1. Pošaljite `POST /api/admin/payments/reminders/evaluate`:
   ```json
   {
     "dryRun": false
   }
   ```
2. Posao vrši automatsku evaluaciju svih aktivnih planova i šalje podsetnike za obaveze koje ispunjavaju kriterijume.
