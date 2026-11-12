# FR-064..FR-068, FR-074 — Centralni pregled, pretraga, filteri i uređivanje profila kandidata

Ovaj dokument opisuje proceduru ručne i automatske verifikacije za prvu fazu **Administrativnog modula** prema ugovornoj specifikaciji **PRILOG 1 (v2.0)** (Sekcija 14):
- **FR-064:** Centralni pregled kandidata (objedinjeni podaci o profilu, procesu, radnoj ponudi i uplatama).
- **FR-065:** Pristup i uređivanje profila (izmena faza procesa, administratorskih zabeleški i kontakt podataka uz revizijski trag).
- **FR-066:** Filteri podataka i dokumenata (filtriranje po koraku procesa, statusu procesa, programu).
- **FR-067:** Filter po imenu, prezimenu i broju pasoša (namensko pretraživanje identifikatora i projekcija specifičnih kolona).
- **FR-068:** Filter kandidata bez radne ponude (izdvajanje studenata koji još uvek nemaju prihvaćeni Job Offer).
- **FR-074:** Search funkcija (pretraga po imenu, prezimenu, email adresi, broju telefona).

---

## 1. Pokretanje u lokalnom / WSL okruženju

```bash
cd /home/nemanja/AmericanAdventure26
git switch feat/admin-candidates-overview-and-filters
docker compose up -d database
cd apps/platform
npm run dev
```

---

## 2. Ručna provera (Admin API i Portal)

### A. FR-064: Centralni pregled kandidata
1. Prijavite se administratorskim nalogom na `/admin`.
2. Pozovite `GET /api/admin/candidates` (ili otvorite tabelu kandidata).
3. Proverite da svaki zapis objedinjuje:
   - Ime, prezime, email, telefon i fakultet/grad studiranja.
   - Trenutni korak (`currentStep`) sa opisnom oznakom na srpskom jeziku (npr. *Posao i intervju*, *Viza*).
   - Procenat napretka procesa (0–100%).
   - Status radne ponude (`hasJobOffer`: `true` / `false`) sa imenom poslodavca ukoliko je ponuda prihvaćena.
   - Paginaciju (`page`, `limit`, `total`, `totalPages`).

### B. FR-068: Filter kandidata bez radne ponude
1. Pošaljite zahtev sa parametrom: `GET /api/admin/candidates?withoutJobOffer=true`.
2. Proverite da lista sadrži **isključivo** kandidate koji još uvek nemaju prihvaćenu radnu ponudu.
3. Pošaljite zahtev sa `GET /api/admin/candidates?hasJobOffer=true` i proverite da se prikazuju samo studenti sa obezbeđenim poslom.

### C. FR-074: Pretraga kandidata
1. Pošaljite zahtev sa parametrom: `GET /api/admin/candidates?search=Petar` (ili deo email adrese / telefona).
2. Sistem trenutno filtrira kandidate čije ime, prezime, email ili telefon sadrže zadati termin (pretraga nije osetljiva na velika i mala slova).

### D. FR-066: Filteri po koraku i statusu procesa
1. Pošaljite zahtev sa: `GET /api/admin/candidates?currentStep=VISA`.
2. Lista prikazuje samo kandidate koji se trenutno nalaze u fazi pripreme ili obrade vize.
3. Kombinujte filtere, npr. `currentStep=JOB_PLACEMENT&withoutJobOffer=true`.

### E. FR-067: Filter po broju pasoša / lične karte i projekcija kolona
1. Pošaljite zahtev sa brojem pasoša: `GET /api/admin/candidates?passportNumber=010948`.
2. Pošaljite zahtev sa projekcijom kolona: `GET /api/admin/candidates?fields=fullName,idCardOrPassportNumber`.
3. Proverite da odgovor sadrži samo tražena polja uz obavezni `id`.

### F. FR-065 & FR-070: Pristup, izmena profila i audit
1. Otvorite detalje kandidata preko `GET /api/admin/candidates/:id`.
2. Ažurirajte profil kandidata putem `PATCH /api/admin/candidates/:id` sa podacima:
   ```json
   {
     "currentStep": "VISA",
     "adminNotes": "Student je uspešno prošao intervju sa poslodavcem."
   }
   ```
3. Proverite odgovor i osvežite detalje kandidata — promene su sačuvane.
4. U kolekciji `audit-events` proverite da je automatski kreiran zapis sa događajem `CANDIDATE_PROCESS_UPDATED` i ID-jem administratora koji je izvršio izmenu.

---

## 3. Automatske provere

Pokrenite testove iz direktorijuma `apps/platform`:

```bash
cd apps/platform
source ~/.nvm/nvm.sh

# 1. Unit testovi domena, pravila i servisa
npx vitest run src/modules/admin-candidates/

# 2. Tipovi i linter
npm run typecheck
npm run lint

# 3. Integracioni Playwright test
npm run test:integration -- tests/integration/admin-candidate-overview.spec.ts
```

Svi testovi moraju biti zeleni pre spajanja u `main`.
