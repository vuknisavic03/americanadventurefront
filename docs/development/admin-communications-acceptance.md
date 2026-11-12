# FR-071, FR-072, FR-073 — Komunikacija i notifikacije kandidata

Ovaj dokument opisuje proceduru ručne i automatske verifikacije za treću fazu **Administrativnog modula** prema ugovornoj specifikaciji **PRILOG 1 (v2.0)** (Sekcija 14, str. 19):
- **FR-071:** Notifikacije (in-app obaveštenja i obaveštenja za akcije kandidata: ugovor, uplata, viza).
- **FR-072:** Email komunikacija (pojedinačno i grupno slanje emailova preko generičkih šablona sa promenljivim podacima i evidencijom).
- **FR-073:** SMS komunikacija (pojedinačno i grupno slanje SMS notifikacija preko šablona sa evidencijom statusa i praćenjem dužine segmenata).
- **FR-070:** Audit aktivnosti (evidentiranje revizijskih događaja za individualno i grupno slanje u `audit-events`).

---

## 1. Pokretanje u lokalnom / WSL okruženju

```bash
cd /home/nemanja/AmericanAdventure26
git switch feat/admin-communications-and-notifications
docker compose up -d database
cd apps/platform
npm run dev
```

---

## 2. Ručna provera (Admin i Candidate API)

### A. Pregled kataloga šablona (FR-072, FR-073)
1. Prijavite se administratorskim nalogom.
2. Pošaljite `GET /api/admin/communications/templates`.
3. Potvrdite da odgovor (status 200) vraća listu šablona sa metapodacima:
   - Email šabloni: `EMAIL_GENERAL_ANNOUNCEMENT`, `EMAIL_DOCUMENT_REMINDER`, `EMAIL_PAYMENT_REMINDER`, `EMAIL_ACTION_REQUIRED`.
   - SMS šabloni sa izračunatim segmentima (`smsMetrics`): `SMS_GENERAL`, `SMS_URGENT_ACTION`, `SMS_PAYMENT_DUE`, `SMS_DOCUMENT_MISSING`.
   - In-app šabloni: `IN_APP_GENERAL`, `IN_APP_ACTION_REQUIRED`, `IN_APP_DOCUMENT_NOTICE`, `IN_APP_PAYMENT_NOTICE`.

### B. Slanje individualnog emaila (FR-072)
1. Pošaljite `POST /api/admin/communications/send`:
   ```json
   {
     "candidateProcessId": 1,
     "channel": "EMAIL",
     "templateKey": "EMAIL_GENERAL_ANNOUNCEMENT",
     "templateParams": {
       "customNote": "Vaša prijava je uspešno prihvaćena."
     }
   }
   ```
2. Proverite da odgovor vraća status 200 sa `status: "DELIVERED"`.
3. Proverite evidenciju u bazi:
   - Kolekcija `communication-logs` sadrži novi zapis sa kanalom `EMAIL`, popunjenim tekstom i statusom `DELIVERED`.
   - Kolekcija `audit-events` sadrži zapis sa `eventType: 'ADMIN_COMMUNICATION_SENT'`.

### C. Slanje individualne SMS poruke (FR-073)
1. Pošaljite `POST /api/admin/communications/send`:
   ```json
   {
     "candidateProcessId": 1,
     "channel": "SMS",
     "templateKey": "SMS_URGENT_ACTION",
     "actionRequiredTitle": "Dostava pasoša",
     "actionRequiredDueAt": "2026-11-20T12:00:00.000Z"
   }
   ```
2. Proverite da je broj telefona automatski normalizovan u E.164 format (npr. `+38164...`).
3. Proverite da je status poruke `DELIVERED` i da je evidentiran zapis u `communication-logs`.

### D. In-app notifikacija i portal kandidata (FR-071)
1. Kao administrator pošaljite in-app notifikaciju:
   ```json
   {
     "candidateProcessId": 1,
     "channel": "IN_APP",
     "templateKey": "IN_APP_ACTION_REQUIRED",
     "actionRequiredTitle": "Potpisivanje ugovora",
     "actionRequiredDueAt": "2026-11-30T10:00:00.000Z"
   }
   ```
2. Prijavite se kao kandidat i pošaljite `GET /api/candidate/notifications`:
   - Odgovor vraća notifikaciju sa `actionRequiredTitle: "Potpisivanje ugovora"`, rokom i `isRead: false`.
   - `unreadCount` je `>= 1`.
3. Kao kandidat pošaljite `PATCH /api/candidate/notifications`:
   ```json
   {
     "notificationIds": [1]
   }
   ```
4. Ponovo pošaljite `GET /api/candidate/notifications?unreadOnly=true` i proverite da je notifikacija uspešno označena kao pročitana (`isRead: true`).

### E. Grupno slanje (Batch)
1. Kao administrator pošaljite grupnu notifikaciju:
   ```json
   {
     "candidateProcessIds": [1, 2],
     "channel": "EMAIL",
     "templateKey": "EMAIL_DOCUMENT_REMINDER",
     "templateParams": {
       "dueDate": "01.12.2026."
     }
   }
   ```
   *Ili sa filterom kohorte (npr. `filters: { "withoutJobOffer": true }`).*
2. Proverite da odgovor vraća:
   ```json
   {
     "total": 2,
     "succeeded": 2,
     "failed": 0
   }
   ```
3. Proverite da `audit-events` sadrži događaj sa `eventType: 'ADMIN_BATCH_COMMUNICATION_SENT'`.

### F. Pregled i filtriranje evidencije komunikacije
1. Kao administrator pošaljite `GET /api/admin/communications/logs?channel=SMS`:
   - Prikazuju se isključivo zapisi poslate SMS komunikacije.
2. Pošaljite `GET /api/admin/communications/logs?search=Petar`:
   - Pretraga pronalazi poruke po imenu primaoca, adresi ili sadržaju.

---

## 3. Automatski testovi

Pokretanje jediničnih testova:
```bash
npm run test -- src/modules/admin-communications/
```

Pokretanje svih testova i provera tipova:
```bash
npm run typecheck
npm run lint
npm run test
```
