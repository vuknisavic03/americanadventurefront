# FR-060, FR-061, FR-062 — Provera materijala, povezivanja studenata i korisnih saveta za boravak u USA

Ovaj dokument opisuje proceduru ručne i automatske verifikacije za tri ugovorna funkcionalna zahteva:
- **FR-060:** Materijali za boravak u USA (zvanični priručnici, vodič za osiguranje, SEVIS pravila, SOS hitni kontakti).
- **FR-061:** Povezivanje studenata po poslodavcu i saveznoj državi (Peer Networking) uz strogu zaštitu privatnosti (GDPR/ZZPL opt-in).
- **FR-062:** Korisni saveti za boravak u USA (SSN procedura, bankovni računi, smeštaj, prevoz, američka kultura rada).

---

## 1. Pokretanje u lokalnom / WSL okruženju

```bash
cd /home/nemanja/AmericanAdventure26
git switch feat/usa-stay-materials-and-support
docker compose up -d database
cd apps/platform
npm run migrate
npm run dev
```

Baza podataka mora sadržati primenjenu migraciju `20261008_120000_fr_060_062_usa_stay_support`.

---

## 2. Ručna provera (Kandidatski portal i Admin panel)

### A. FR-060: Materijali za boravak u USA

1. Prijavite se na `/admin` kao administrator.
2. Otvorite sekciju **Boravak u SAD i podrška** -> **Materijali za boravak u SAD**.
3. Kreirajte novi zapis:
   - **Naziv:** `SWT Studentski Priručnik 2026`
   - **Kategorija:** `Zvanični priručnik (Handbook)`
   - **Ciljni program:** `Work & Travel USA (SWT)`
   - **URL/putanja:** `https://example.com/handbook-2026.pdf`
   - **Naziv fajla:** `handbook-2026.pdf`
   - **Objavljeno:** Štiklirano (`true`)
4. Prijavite se na `/moj-nalog` sa nalogom studenta čiji je proces u koraku `TRAVEL_PREPARATION` ili `USA_STAY`.
5. U tabu / sekciji **Materijali za boravak u SAD** proverite da se priručnik prikazuje sa odgovarajućom ikonicom, opisom i linkom za preuzimanje.
6. Neobjavljeni materijali (`published: false`) ili materijali za druge programe ne smeju se prikazivati studentu.

### B. FR-062: Korisni saveti za boravak u USA

1. U `/admin` panelu otvorite **Boravak u SAD i podrška** -> **Korisni saveti za boravak u SAD**.
2. Dodajte nekoliko saveta sa različitim tematskim kategorijama:
   - Kategorija `SSN` (označite kao `Prikaži na vrhu (Pinned)`).
   - Kategorija `BANKING` (npr. otvaranje računa u Chase / Bank of America).
   - Kategorija `HOUSING` i `TRANSPORT`.
3. Na kandidatskom portalu `/moj-nalog` otvorite sekciju **Korisni saveti za život i rad u SAD**.
4. Proverite:
   - Pinovani saveti se prikazuju na samom vrhu liste sa bedžom "Važan savet".
   - Klikom na kategorijske filtere (Sve, SSN, Bankovni račun, Smeštaj, Prevoz...) lista se trenutno filtrira na klijentu.
   - Svaka kartica sadrži kratak sažetak i detaljno uputstvo.

### C. FR-061: Povezivanje studenata po poslodavcu i saveznoj državi (Peer Networking)

1. Potrebna su najmanje dva kandidata sa prihvaćenom radnom ponudom (`employment-offers` sa statusom `ACCEPTED`) pod istim poslodavcem (npr. *Cedar Point Amusement Park*, Sandusky, OH) ili u istoj saveznoj državi.
2. **Zaštita privatnosti (Podrazumevano stanje bez pristanka):**
   - Prijavite se nalogom prvog kandidata (`Kandidat A`) na `/moj-nalog`.
   - U sekciji **Kolege i studenti na istoj lokaciji** sistem prepoznaje vašu lokaciju i prikazuje: *"Pronađeno 2 kolega na vašoj lokaciji ili u državi OH"*.
   - **Nijedno ime, email ili kontakt podatak drugih studenata NIJE prikazan** dok `Kandidat A` eksplicitno ne aktivira pristanak.
3. **Davanje pristanka (Opt-In):**
   - Kliknite na dugme **"Dozvoli deljenje kontakta"**.
   - Sistem šalje `POST /api/candidate/usa-stay/peers/consent` sa `{ consent: true }`.
   - Ukoliko je `Kandidat B` takođe dao pristanak, sada se u odeljku **Kolege kod istog poslodavca** pojavljuje kartica sa imenom i email adresom `Kandidata B`.
   - Studenti koji **nisu** dali saglasnost se **nikada ne pojavljuju** na listi.
4. **Povlačenje pristanka (Opt-Out):**
   - Kliknite na dugme **"Povuci saglasnost"**.
   - Sistem ažurira stanje na `{ consent: false }`.
   - Lista sa kontaktima se odmah uklanja iz prikaza, a podaci `Kandidata A` prestaju da budu vidljivi drugim studentima.

---

## 3. Automatske provere

Pokrenite testove iz direktorijuma `apps/platform`:

```bash
cd apps/platform
source ~/.nvm/nvm.sh

# 1. Unit testovi pravila i servisa
npm test -- src/modules/usa-stay/

# 2. Tipovi i linter
npm run typecheck
npm run lint

# 3. Integracioni Playwright test
npm run test:integration -- tests/integration/usa-stay.spec.ts
```

Svi testovi moraju biti zeleni pre spajanja u `main`.
