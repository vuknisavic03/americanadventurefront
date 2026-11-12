# FR-075 & BR-010 — Automatski prevod, generisanje i verifikacija prevedenih dokumenata

Ovaj dokument opisuje proceduru ručne i automatske verifikacije za Sekciju 15 ugovorne specifikacije **PRILOG 1 (v2.0)** (str. 20) i pravilo poslovne logike **BR-010** (PRILOG 1A):
- **FR-075:** Automatski prevod / generisanje prevedenog dokumenta (struktuirani prevod potvrda o statusu studenta, izjava jemca i opštih dokumenata na engleski jezik).
- **BR-010:** Obavezna ljudska verifikacija (AI/OCR ili automatski izlaz koji utiče na zvanični dokument mora proći kroz administrativnu proveru i odobrenje pre overe i izdavanja).
- **FR-070:** Revizijski trag (evidentiranje događaja kreiranja, izmene, odobrenja i odbijanja prevoda u `audit-events`).

---

## 1. Pokretanje u lokalnom / WSL okruženju

```bash
cd /home/nemanja/AmericanAdventure26
git switch feat/fr-075-document-translation
cd apps/platform
npm run dev
```

---

## 2. Koraci verifikacije (Kandidatski i Administratorski API)

### A. Kandidat podnosi zahtev za prevod dokumenta (FR-075)
1. Prijavite se na portal kao kandidat (`candidate-accounts`).
2. Pošaljite `POST /api/candidate/translations/request`:
   ```json
   {
     "documentType": "STUDENT_STATUS_CERTIFICATE",
     "title": "Potvrda o statusu studenta"
   }
   ```
3. Proverite da odgovor vraća HTTP status `201 Created`:
   - Polje `status` ima vrednost `"PENDING_REVIEW"`.
   - Polje `translatedData` sadrži automatski mapirane akademske podatke (univerzitet, fakultet, godina studija, status budžet/samofinansiranje, ESPB bodovi) na engleskom jeziku.
   - U bazi je kreiran zapis u kolekciji `translated-documents`.
   - U kolekciji `audit-events` kreiran je događaj `DOCUMENT_TRANSLATION_REQUESTED`.

### B. Pregled prevoda sa strane kandidata
1. Kao prijavljeni kandidat, pošaljite `GET /api/candidate/translations`.
2. Potvrdite status `200 OK` i prisustvo podnetog dokumenta sa statusom `"PENDING_REVIEW"` i `pdfAvailable: false`.
3. Pokušaj preuzimanja neoverenog PDF dokumenta `GET /api/translations/{id}/download` mora vratiti status `400 Bad Request` jer dokument još nije prošao administrativnu overu.

### C. Administratorski pregled i pretraga zahteva
1. Prijavite se administratorskim nalogom (`users`).
2. Pošaljite `GET /api/admin/translations?status=PENDING_REVIEW`.
3. Potvrdite status `200 OK` i prisustvo liste zahteva koji čekaju proveru.
4. Pošaljite `GET /api/admin/translations/{id}` i proverite detaljan uvid u izvorne podatke (`sourceData`) i nacrt prevoda (`translatedData`).

### D. Administratorska korekcija nacrta prevoda (Human-in-the-Loop)
1. Pošaljite `PATCH /api/admin/translations/{id}`:
   ```json
   {
     "adminNotes": "Usklađen tačan akreditovani naziv smera.",
     "translatedData": {
       "studyProgramEn": "Software Engineering and Information Systems"
     }
   }
   ```
2. Potvrdite status `200 OK`:
   - Dokument je ažuriran, polje `version` je uvećano na `2`.
   - U kolekciji `audit-events` zabeležen je događaj `DOCUMENT_TRANSLATION_UPDATED`.

### E. Zvanično odobrenje i generisanje sertifikovanog PDF-a (BR-010)
1. Pokušaj odobrenja bez administratorske sesije mora biti odbijen sa HTTP statusom `401 Unauthorized` (stroga primena pravila BR-010).
2. Sa validnom administratorskom sesijom, pošaljite `POST /api/admin/translations/{id}/review`:
   ```json
   {
     "action": "APPROVE",
     "adminNotes": "Dokument pregledan i overen za potrebe sponzora i vize."
   }
   ```
3. Potvrdite odgovor sa statusom `200 OK`:
   - `status: "APPROVED"`
   - `pdfChecksum`: generisan je SHA-256 heš dužine 64 karaktera (npr. `a1b2c3...`).
   - U bazi je zabeležen `reviewedBy` (ID administratora), `reviewedAt` i `pdfChecksum`.
   - U kolekciji `audit-events` zabeležen je događaj `DOCUMENT_TRANSLATION_APPROVED`.

### F. Odbijanje neispravnog dokumenta (Alternativni scenario)
1. Pošaljite `POST /api/admin/translations/{id}/review`:
   ```json
   {
     "action": "REJECT",
     "rejectionReason": "Priložena potvrda nema čitljiv pečat studentske službe."
   }
   ```
2. Ako `rejectionReason` nije naveden, sistem vraća `400 Bad Request`.
3. Sa navedenim razlogom, dokument dobija status `"REJECTED"`, a u reviziji se beleži `DOCUMENT_TRANSLATION_REJECTED`.

### G. Preuzimanje zvaničnog sertifikovanog PDF-a
1. Kandidat ili administrator šalje `GET /api/translations/{id}/download`.
2. Potvrdite odgovor:
   - HTTP status `200 OK`.
   - `Content-Type: application/pdf`.
   - `ETag: "{pdfChecksum}"`.
   - `Content-Disposition: attachment; filename="prevod-...pdf"`.
3. Otvorite generisani PDF i vizuelno proverite:
   - Zaglavlje: "AMERICAN ADVENTURE" i bedž "CERTIFIED ENGLISH TRANSLATION".
   - Kartica sa podacima o kandidatu.
   - Tabela sa struktuiranim prevedenim podacima na engleskom jeziku.
   - Zvanična izjava agencije o tačnosti prevoda za sponzore i ambasadu SAD.
   - Blok za potpis sa imenom administratora koji je izvršio proveru, ulogom i datumom verifikacije.
   - Podnožje sa brojem verifikacije i SHA-256 kontrolnim zbirom dokumenta.
4. Pokušaj preuzimanja od strane drugog kandidata vraća `403 Forbidden`.

---

## 3. Automatsko testiranje

U terminalu pokrenite:

```bash
# 1. Provera tipova
npm run typecheck

# 2. Linter (max 0 upozorenja)
npm run lint

# 3. Pokretanje testova domenskog modula i PDF renderera
npx vitest run src/modules/document-translations

# 4. Pokretanje svih testova platforme
npm run test

# 5. Build provera
npm run build
```

Sve provere moraju proći bez grešaka (exit code 0).
