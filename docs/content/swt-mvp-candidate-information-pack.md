# SWT MVP Candidate Information Pack

- Status: Approved for MVP implementation; production content review required
- Version: 0.2
- Date: 2026-08-26
- Audience: SWT applicants marked as qualified
- Delivery trigger: `SELECTION_QUALIFIED`
- Candidate acknowledgement required: No
- Content owner: American Adventure Product Owner
- Publishing role: Super Admin
- MVP delivery format: UTF-8 HTML email with a plain-text fallback
- Related workflow: `docs/domain/pre-application-selection-workflow.md`

## 1. Purpose and limits

This is the initial MVP material bundle sent after an Admin marks an SWT pre-application as qualified.

It is an informational guide, not:

- a participation contract;
- a job offer or job guarantee;
- a visa guarantee;
- a final price list or payment instruction;
- legal, tax, immigration, or employment advice.

The content is accepted as the implementation default. The Product Owner must still perform factual and production-language review before activation with real candidates. Later versions may replace or extend this pack without changing the historical version assigned to an applicant.

## 2. Bundle manifest

The MVP bundle contains one candidate-facing guide:

- `SWT_MVP_INFORMATION_PACK_SR`, version `0.1`.

The consultation booking invitation is a second message and is sent only after this bundle has a successful system delivery record.

No contract, invoice, payment instruction, passport request, or sensitive-document upload request is part of this MVP bundle.

MVP delivery configuration:

- provider adapter: Resend;
- sender: `American Adventure <noreply@notify.workandtravel.rs>`;
- reply-to: `beograd@workandtravel.rs`;
- body: accessible UTF-8 HTML plus plain-text fallback;
- open and click tracking: disabled by default to minimize unnecessary tracking;
- acknowledgement and read receipt: not required.

## 3. Template variables

The delivery template may use only approved variables:

| Variable | Purpose |
|---|---|
| `{{firstName}}` | Candidate first name |
| `{{programName}}` | Display name of the selected program |
| `{{campaignName}}` | Active season or campaign |
| `{{agencyName}}` | Approved agency display name |
| `{{officialContactEmail}}` | Defaults to `beograd@workandtravel.rs`; configurable by program |
| `{{officialPhone}}` | Approved support number |
| `{{privacyPolicyUrl}}` | Current privacy-policy link |

The consultation link is intentionally not part of this first message. It is sent in the next workflow step.

## 4. Candidate-facing content - Serbian

### Dobro došli u sledeći korak prijave

Zdravo {{firstName}},

Hvala ti na interesovanju za program {{programName}} u okviru sezone {{campaignName}}.

Tvoja početna prijava je pregledana i možeš da nastaviš u sledeći korak procesa. Ova poruka ne predstavlja konačno prihvatanje na program, ugovor, ponudu za posao ili garanciju dobijanja vize.

### Šta sledi

1. Pročitaj ovaj kratki vodič i pripremi podatke ili pitanja koja želiš da razjasniš.
2. U posebnoj poruci dobićeš link za zakazivanje konsultacija.
3. Izaberi jedan od dostupnih termina.
4. Tokom konsultacija zaposleni agencije će objasniti naredne korake, dokumentaciju, rokove i obaveze koje važe za aktuelnu sezonu.
5. Korisnički profil se kreira tek nakon konsultacija i konačnog odobrenja agencije.

Nije potrebno da posebno potvrdiš da si pročitao/la ovaj vodič.

### Kako da se pripremiš za konsultacije

Pre razgovora proveri da li su podaci iz prijave tačni i pripremi:

- naziv fakulteta, grad i trenutnu godinu studija;
- informaciju da li je godina obnavljana ili pauzirana;
- trenutni broj ESPB bodova;
- okvirnu raspoloživost tokom letnje sezone;
- pitanja o programu, rokovima, poslovima, dokumentaciji, troškovima i narednim koracima;
- informaciju o promenama koje su nastale nakon slanja prijave.

Nemoj slati pasoš, JMBG, podatke platne kartice, bankovne podatke ili druge osetljive dokumente na neproverene email adrese ili putem neodobrenih kanala.

### Obaveze kandidata u ovoj fazi

Od kandidata se očekuje da:

- dostavlja tačne i potpune podatke;
- prijavi važnu promenu kontakt ili studentskih podataka;
- prati poruke koje stižu sa zvaničnih kontakata agencije;
- postavi pitanja kada neki korak, rok ili trošak nije jasan;
- ne vrši uplatu bez zvaničnog dokumenta i proverenog uputstva;
- ne deli pristupne podatke ili jednokratne linkove sa drugim osobama.

### Šta kandidat može da očekuje od agencije

Agencija će:

- objasniti tok procesa i sledeće korake;
- navesti koja dokumentacija je potrebna za aktuelnu fazu;
- razjasniti rokove i odgovornosti kada budu zvanično utvrđeni;
- koristiti zvanične kanale komunikacije;
- čuvati podatke iz prijave u zaštićenom administrativnom portalu;
- naknadno dostaviti ugovor, finansijska dokumenta i druga pravno relevantna dokumenta kroz odobren proces.

### Bezbedna komunikacija

Podaci iz tvoje prijave dostupni su ovlašćenim zaposlenima u zaštićenom administrativnom portalu. Kompletna prijava se ne prosleđuje zaposlenima emailom.

Poruku ili zahtev smatraj zvaničnim samo ako dolazi kroz kanale koje je objavila agencija. Ako nisi siguran/na da je poruka autentična, obrati se agenciji koristeći:

- email: {{officialContactEmail}}
- telefon: {{officialPhone}}
- politika privatnosti: {{privacyPolicyUrl}}

Nikada ne šalji lozinku, verifikacioni kod ili podatke platne kartice emailom.

### Važna napomena

Detaljni uslovi programa, ugovorne obaveze, cene, popusti, rokovi, dokumentacija za vizu i eventualna ponuda za posao biće predstavljeni kroz odgovarajuće kasnije korake i zvanične dokumente.

Ovaj vodič služi samo kao priprema za konsultacije.

Srdačan pozdrav,

{{agencyName}}

## 5. Delivery and versioning rules

- the assigned bundle version is immutable for the application;
- the exact rendered content or a content hash is retained with the delivery record;
- delivery is sent only to the email recorded on the selected pre-application;
- retries use the same idempotency key and do not create duplicate workflow transitions;
- a new content version applies only to later assignments unless an authorized Admin deliberately reassigns it;
- delivery-provider acceptance is sufficient for the MVP workflow; no read receipt or candidate acknowledgement is required;
- failure keeps the application in `QUALIFIED` and is visible in the Admin portal;
- after successful delivery, the system may schedule the separate consultation invitation.

## 6. Readiness checklist

### Ready for MVP implementation

- [x] content owner role assigned to the American Adventure Product Owner;
- [x] publishing restricted to Super Admin;
- [x] Serbian content selected as the MVP implementation default;
- [x] no candidate acknowledgement required;
- [x] no statement intentionally guarantees a job, visa, or participation;
- [x] applicant-facing sending subdomain selected;
- [x] delivery format selected as HTML email with plain-text fallback;
- [x] open and click tracking disabled by default.

### Required before production activation

- [ ] Product Owner factual and terminology review;
- [ ] legal/privacy review of the final wording;
- [ ] confirm the official phone and privacy-policy URL;
- [ ] verify the sending domain and test delivery;
- [ ] render and review the final email in major desktop and mobile clients;
- [ ] record the approved version and activation date in program configuration.
