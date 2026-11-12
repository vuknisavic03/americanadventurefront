# Prihvatni scenario: programska ponuda i izbor načina plaćanja

## Preduslovi

- migracije su primenjene;
- postoji aktivan i verifikovan kandidatski nalog sa procesom;
- administrator je prijavljen na `/admin`;
- kandidat je prijavljen na `/moj-nalog`.

## 1. Kreiranje nacrta

1. U administraciji otvoriti **Kandidatski portal → Programske ponude**.
2. Kreirati ponudu i izabrati međusobno povezane kandidatski nalog, proces i izvornu prijavu.
3. Uneti osnovnu cenu u centima, na primer `300000` za 3.000 USD.
4. Uključiti najmanje jedan način plaćanja i uneti budući datum u **Ponuda važi do**.
5. Sačuvati status **Nacrt**.

Očekivano: nacrt je vidljiv administratoru, ali nije prikazan kandidatu.

## 2. Provera poslovnih pravila

1. Uključiti plaćanje na rate i pokušati čuvanje sa dve rate.
2. Zatim uneti tri rate čiji zbir nije jednak osnovnoj ceni.
3. Za PKZ uneti početni i odloženi iznos čiji zbir nije jednak osnovnoj ceni.

Očekivano: administracija prikazuje razumljivu validacionu grešku i ne objavljuje neispravnu ponudu.

## 3. Objavljivanje

1. Ispraviti podatke i promeniti status na **Objavljena kandidatu**.
2. Sačuvati ponudu.
3. Otvoriti kandidatov `/moj-nalog`.

Očekivano: kandidat vidi osnovnu cenu, samo uključene modele, popust, dinamiku rata i rok ponude. Objavljeni komercijalni uslovi više ne mogu da se menjaju u administraciji.

## 4. Kandidatov izbor

1. Izabrati jedan način plaćanja.
2. Označiti potvrdu da su uslovi pregledani.
3. Kliknuti **Potvrdi način plaćanja**.

Očekivano:

- portal prikazuje zaključan sažetak izbora i konačan iznos;
- za rate ostaje prikazana sačuvana dinamika;
- za PKZ ostaju prikazani početni i odloženi iznos;
- sledeća akcija kandidata postaje čekanje pripreme ugovora;
- u administraciji je ponuda u statusu **Prihvaćena**;
- postoji jedan zapis u **Izbori načina plaćanja**.

## 5. Idempotentnost i izolacija

1. Ponoviti isti mrežni zahtev ili osvežiti portal posle potvrde.
2. Prijaviti se kao drugi kandidat i pokušati pristup tuđem ID-u ponude.

Očekivano: isti izbor ne pravi duplikat, drugačiji izbor ne prepisuje prvi, a drugi kandidat dobija odgovor da ponuda nije pronađena.

## 6. Povlačenje neizabrane ponude

1. Napraviti i objaviti novu ponudu za drugi proces.
2. Pre kandidatovog izbora promeniti status na **Povučena**.

Očekivano: ponuda više nije dostupna kandidatu i zaključana je za dalje izmene.

## Tehnička provera

Iz `apps/platform` pokrenuti:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

U okruženju sa PostgreSQL bazom dodatno pokrenuti `npm run migrate`.
