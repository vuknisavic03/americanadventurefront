# ADR 0033: Commercial Discounts System (FR-031–034)

- Status: Accepted for MVP
- Date: 2026-10-12
- Related: Section 8 of PRILOG 1 (v2.0), PRILOG 1A (FR-031, FR-032, FR-033, FR-034, BR-008, BR-009)

## Context

Section 8 of **PRILOG 1 (v2.0)** ("8. Načini plaćanja, akcije i popusti", pp. 10–12) defines promotional and incentive discounts for Work & Travel candidates:

- **FR-031 – Popust na grupu (Group discount):**
  - Kandidati koji se prijavljuju u grupi ostvaruju definisani popust po članu (podrazumevano 50 USD / 5.000 centi).
  - Grupa ima jedinstveni identifikacioni kod, naziv, minimalni broj članova (podrazumevano 3) i status (aktivna / zatvorena). Prvi član koji unese kod grupe dobija ulogu vođe (`LEADER`), a ostali `MEMBER`.
- **FR-032 – Popust za Brand Ambassador-a (Brand Ambassador discount):**
  - Kandidati koji unesu referral kod registrovanog brend ambasadora dobijaju podrazumevani popust od 50 USD.
  - Ambasador ima definisanu sezonu, kontakt podatke i nagradu po realizovanoj prijavi (`rewardPerReferralCents`, npr. 2.500 centi).
- **FR-033 – Porodični popust (Family discount):**
  - Za kandidate čiji brat, sestra, blizanac ili supružnik takođe učestvuje u programu ili je prethodno učestvovao.
  - Podrazumevani popust je 50 USD. Kandidat unosi podatke o srodniku, a popust dobija status `PENDING` i zahteva administrativnu verifikaciju.
- **FR-034 – Popust za povratnike i Lifeguarde (Returnee and Lifeguard discount):**
  - **Returnee (povratnik):** Kandidat koji je već učestvovao u SWT programu prethodnih sezona ostvaruje popust od 100 USD (10.000 centi). Unosi godinu prethodnog učešća, prethodnog poslodavca i sponzora; status `PENDING` do verifikacije.
  - **Lifeguard (spasilac):** Kandidat sa važećom spasilačkom licencom (Crveni krst, Ellis & Associates, YMCA, StarGuard) ostvaruje popust od 50 USD (5.000 centi). Unosi sertifikaciono telo, broj licence i rok važenja; status `PENDING` do verifikacije.
- **Prilagođeni (Custom) komercijalni popust:**
  - Administrator ima mogućnost da dodeli diskrecioni popust sa namenskim opisom i internim beleškama (npr. sajamski popust, partnerske stipendije).

Pored evidencije i verifikacije, sistem popusta mora biti integrisan sa cenovnikom ponuda (`pricing.ts`), rasporedom rata (`adjustInstallmentsForDiscount`) i formiranjem finansijske kartice / plana plaćanja (`program-offer-selections` i `candidate-payment-plans`).

## Decision

1. **Čist domen poslovne logike (`modules/discounts/rules.ts`):**
   - Centralizovani podrazumevani iznosi: 50 USD (5.000 centi) za grupe, ambasadore, porodicu i spasioce; 100 USD (10.000 centi) za povratnike.
   - Normalizacija promo kodova (velika slova, uklanjanje nedozvoljenih znakova).
   - Validacije specifičnih ulaza:
     - `validateFamilyKinshipData`: obavezno ime srodnika i tip srodstva.
     - `validateReturneeData`: validacija godine učešća (2010 – tekuća godina).
     - `validateLifeguardData`: obavezno sertifikaciono telo i broj licence.
   - Validacija u odnosu na osnovnu cenu (`validateDiscountsAgainstBasePrice`): ukupan zbir popusta ne sme premašiti osnovnu cenu programa.
   - Proporcionalno skaliranje rata (`adjustInstallmentsForDiscount`): rate se proporcionalno umanjuju, a zaokruživanje centi se poravnava na poslednjoj rati kako bi zbir svih rata u cent bio identičan efektivnoj ceni.

2. **Payload CMS kolekcije:**
   - `DiscountGroups` (`discount-groups`): šifarnik grupa sa minimalnim brojem članova i statusom.
   - `BrandAmbassadors` (`brand-ambassadors`): šifarnik ambasadora sa referral kodom, visinom popusta i nagradom.
   - `CandidateDiscounts` (`candidate-discounts`): evidencija popusta po kandidatskom nalogu i procesu sa poljima specifičnim za svaki tip, statusom (`PENDING`, `VERIFIED`, `REJECTED`, `APPLIED`) i podacima o verifikaciji.

3. **Audit događaji i migracije:**
   - Dodati novi događaji u `AuditEvents`:
     - `DISCOUNT_CLAIMED`: kandidat ili admin je prijavio popust.
     - `DISCOUNT_VERIFIED`: administrator je odobrio popust.
     - `DISCOUNT_REJECTED`: administrator je odbio popust uz obavezan razlog.
     - `DISCOUNT_APPLIED`: popust je primenjen prilikom izbora načina plaćanja / formiranja plana.
   - Generisana migracija `20261012_120000_commercial_discounts.ts` sa odgovarajućim tabelama, enumima i spoljnim ključevima.

4. **Integracija sa plaćanjem:**
   - `selectPaymentMethod`: pri izboru načina plaćanja automatski povlači sve važeće (`VERIFIED` ili `APPLIED`) popuste za kandidatski proces, uračunava ih u snapshot izbora ponude i označava ih kao `APPLIED`.
   - `pricing.ts`: `buildPaymentSelectionSnapshot` prima `appliedDiscounts`, umanjuje `totalCents` i proporcionalno preraspoređuje raspored rata za `INSTALLMENTS`.

5. **API rute:**
   - `/api/candidate/discounts` (GET, POST): pregled popusta kandidata i podnošenje novih zahteva (kodovi, podaci o srodstvu/licenci).
   - `/api/admin/discounts` (GET, POST): pretraga i filtriranje popusta, diskreciona dodela popusta od strane administratora.
   - `/api/admin/discounts/[id]/verify` (POST): verifikacija popusta uz opcionu napomenu i korekciju iznosa.
   - `/api/admin/discounts/[id]/reject` (POST): odbijanje popusta uz obavezno obrazloženje.
   - `/api/admin/discounts/groups` (GET, POST): administracija grupa.
   - `/api/admin/discounts/ambassadors` (GET, POST): administracija brend ambasadora.

## Consequences

- U potpunosti su implementirani zahtevi **FR-031**, **FR-032**, **FR-033** i **FR-034**.
- Obračun rata i cena ostaje 100% deterministički u celim brojevima centi bez floating-point grešaka.
- Pružena je potpuna revizijska sledljivost za svaku promenu statusa ili odobrenje popusta.
