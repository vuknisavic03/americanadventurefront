# Acceptance Vodič: Komercijalni Popusti (FR-031–034)

Ovaj dokument opisuje proceduru verifikacije i prihvatanja implementacije sistema komercijalnih popusta za Work & Travel program.

## Obuhvaćeni funkcionalni zahtevi

- **FR-031 – Popust na grupu (Group discount):**
  - Unos validnog koda grupe (`groupCode`) dodeljuje definisani iznos popusta (podrazumevano 50 USD / 5.000 centi).
  - Prvi član koji unese kod grupe dobija ulogu `LEADER`, a svaki sledeći `MEMBER`.
- **FR-032 – Popust za Brand Ambassador-a (Brand Ambassador discount):**
  - Unos referral koda ambasadora (`ambassadorCode`) dodeljuje definisani popust (podrazumevano 50 USD) i automatski se verifikuje ako je kod aktivan.
- **FR-033 – Porodični popust (Family discount):**
  - Kandidat unosi tip srodstva i ime srodnika. Zahtev dobija status `PENDING` dok ga administrator ne pregleda i odobri.
- **FR-034 – Popust za povratnike i spasioce (Returnee & Lifeguard discount):**
  - **Returnee:** Kandidat unosi godinu prethodnog učešća (2010 – tekuća) za popust od 100 USD (10.000 centi); status `PENDING`.
  - **Lifeguard:** Kandidat unosi licencu i sertifikaciono telo za popust od 50 USD (5.000 centi); status `PENDING`.
- **Custom administrativni popust:**
  - Administrator može direktno dodeliti proizvoljan popust kandidatu.

---

## Verifikacija API endpoints

### 1. Kandidatski portal
- `GET /api/candidate/discounts`:
  - Zahteva aktivnu sesiju kandidata.
  - Vraća listu svih prijavljenih popusta sa trenutnim statusom (`PENDING`, `VERIFIED`, `REJECTED`, `APPLIED`).
- `POST /api/candidate/discounts`:
  - Omogućava prijavu popusta za grupu, ambasadora, porodicu, returnee ili spasioca.
  - Sprečava dupliranje popusta istog tipa za isti proces.

### 2. Administratorski panel
- `GET /api/admin/discounts`:
  - Listanje, filtriranje po statusu i tipu, pretraga i paginacija.
- `POST /api/admin/discounts`:
  - Dodeljivanje custom popusta.
- `POST /api/admin/discounts/[id]/verify`:
  - Odobravanje popusta uz opcioni unos beleške i korekcije iznosa. Evidentira `DISCOUNT_VERIFIED` u audit logu.
- `POST /api/admin/discounts/[id]/reject`:
  - Odbijanje popusta uz obavezno navođenje razloga. Evidentira `DISCOUNT_REJECTED` u audit logu.
- `GET, POST /api/admin/discounts/groups`:
  - Pregled i kreiranje grupa.
- `GET, POST /api/admin/discounts/ambassadors`:
  - Pregled i kreiranje brend ambasadora.

---

## Integracija sa ugovorom i ratama
1. Pri izboru načina plaćanja (`selectPaymentMethod`):
   - Svi odobreni popusti kandidata (`VERIFIED`) se sabiraju.
   - Osnovna cena se umanjuje za ukupan iznos popusta (`totalCents = basePrice - discounts`).
   - Kod plaćanja na rate (`INSTALLMENTS`), rate se proporcionalno umanjuju, a zaokruživanje se niveliše na poslednjoj rati.
   - Svi iskorišćeni popusti dobijaju status `APPLIED` i beleže se u revizijskom tragu (`DISCOUNT_APPLIED`).
2. Finansijska kartica (`CandidatePaymentPlans`) se kreira sa tačno umanjenim iznosom i rasporedom rata.

---

## Testiranje

Pokretanje jediničnih testova logike i servisa:
```bash
npx vitest run src/modules/discounts/
npx vitest run src/modules/program-offers/
```

Pokretanje kompletnog Playwright integracionog testa:
```bash
npm run test:integration -- tests/integration/candidate-discounts.spec.ts
```
