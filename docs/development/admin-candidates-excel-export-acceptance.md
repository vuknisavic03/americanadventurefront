# FR-069 — Izvoz podataka kandidata u Excel (XLSX)

Ovaj dokument opisuje proceduru ručne i automatske verifikacije za drugu fazu **Administrativnog modula** prema ugovornoj specifikaciji **PRILOG 1 (v2.0)** (Sekcija 14, str. 19):
- **FR-069:** Izvoz u Excel (mogućnost izvoza svih ili filtriranih podataka o kandidatima u validan XLSX format).
- **FR-067:** Filter po imenu, prezimenu i broju pasoša (projekcija samo traženih kolona u izvozu).
- **FR-070:** Audit aktivnosti (evidentiranje revizijskog događaja o izvozu podataka u `audit-events`).

---

## 1. Pokretanje u lokalnom / WSL okruženju

```bash
cd /home/nemanja/AmericanAdventure26
git switch feat/admin-candidates-excel-export
docker compose up -d database
cd apps/platform
npm run dev
```

---

## 2. Ručna provera (Admin API i Download)

### A. Kompletan izvoz svih kandidata (FR-069)
1. Prijavite se administratorskim nalogom na platformu.
2. Pošaljite `GET /api/admin/candidates/export` (ili kliknite na "Izvezi u Excel" dugme u admin panelu).
3. Proverite da odgovor sadrži zaglavlja:
   - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition: attachment; filename="kandidati-YYYY-MM-DD.xlsx"`
4. Otvorite preuzeti `.xlsx` fajl u programu Microsoft Excel ili LibreOffice Calc i potvrdite:
   - Radni list se zove **Kandidati**.
   - Prvi red (zaglavlje) je zamrznut (frozen pane) i stilizovan tamnosivom pozadinom sa belim masnim slovima.
   - Sadrži standardne kolone na srpskom jeziku: *ID*, *Ime*, *Prezime*, *Puno ime*, *Email*, *Telefon*, *Broj pasoša / LK*, *Program*, *Status procesa*, *Trenutna faza*, *Progres*, *Ima radnu ponudu*, *Poslodavac*, *Radna pozicija*, *Grad rada*, *Savezna država*, *Cena programa*, *Datum kreiranja*.
   - Podaci u redovima odgovaraju stvarnim kandidatima u sistemu.

### B. Izvoz filtriranih podataka (FR-068, FR-066 + FR-069)
1. Pošaljite zahtev sa filterom kandidata bez radne ponude:
   `GET /api/admin/candidates/export?withoutJobOffer=true`
2. Otvorite preuzeti fajl i proverite da se u njemu nalaze **isključivo** kandidati koji nemaju prihvaćen Job Offer (kolona *Ima radnu ponudu* sadrži "Ne").
3. Pošaljite zahtev sa filterom po fazi:
   `GET /api/admin/candidates/export?currentStep=JOB_PLACEMENT`
4. Proverite da svi kandidati u izvezenom Excel fajlu imaju fazu "JOB_PLACEMENT".

### C. Izvoz sa selekcijom / projekcijom kolona (FR-067 + FR-069)
1. Pošaljite zahtev sa traženim kolonama:
   `GET /api/admin/candidates/export?fields=name,surname,passport,job`
2. Otvorite generisani fajl:
   - Fajl ima tačno 4 kolone: *Ime*, *Prezime*, *Broj pasoša / LK*, *Radna pozicija*.
   - Sve ostale kolone su izostavljene iz izvoza.

### D. Zaštita od formula injection-a (CSV/Formula Injection)
1. Kreirajte kandidata čija administrativna beleška ili ime počinje znakom `=`, `+`, `-` ili `@` (npr. `=SUM(A1:A10)` ili `@link`).
2. Izvezite kandidate u Excel.
3. Otvorite fajl u Excelu:
   - Ćelija je bezbedno prefiksovana jednostrukim navodnikom (`'=SUM(A1:A10)`).
   - Excel prikazuje vrednost kao običan tekst i ne izvršava nikakve formule ili eksterne komande.

### E. Provera revizijskog traga (FR-070)
1. Nakon svakog izvoza, proverite kolekciju `audit-events` u bazi podataka:
   - Kreiran je zapis sa `eventType: 'CANDIDATE_DATA_EXPORTED'`.
   - `actor` odgovara ID-ju ulogovanog administratora, `actorType: 'ADMIN'`.
   - Polje `metadata` beleži broj izvezenih kandidata (`exportedCount`), primenjene filtere (`filters`) i naziv fajla (`filename`).

---

## 3. Automatski testovi

### Unit testovi (Vitest)
```bash
npm run test src/modules/admin-candidates/export.test.ts src/modules/admin-candidates/rules.test.ts src/modules/admin-candidates/service.test.ts
```

### Integracioni testovi (Playwright)
```bash
npm run test:integration tests/integration/admin-candidate-export.spec.ts
```
Ovaj test pokriva neautorizovane zahteve (401/403), generisanje XLSX fajla, parsiranje radnog lista, filtriranje po radnoj ponudi, projekciju kolona i kreiranje zapisa u `audit-events`.
