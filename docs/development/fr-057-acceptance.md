# FR-057 — provera ponude avionske karte

Koristite isključivo probnog kandidata i sintetičke letove. Ovaj korak ne rezerviše,
ne kupuje i ne izdaje avionsku kartu i ne pravi nalog za uplatu.

## Pokretanje u WSL terminalu

```bash
cd /home/nemanja/AmericanAdventure26
docker compose up -d database
cd apps/platform
npm ci
npm run migrate
npm run dev
```

## 1. Pripremite zahtev kandidata

U adminu otvorite probni **Proces kandidata** i postavite aktivan korak **Putovanje i
orijentacija**. Kao isti kandidat u `/moj-nalog` popunite i pošaljite sintetički
**Zahtev za avionsku kartu** iz FR-056.

## 2. Objavite ponudu iz admina

U istom procesu pronađite odeljak **Ponuda avionske karte kandidatu**. Zahtev iz
FR-056 mora biti prikazan iznad forme. Unesite dve sintetičke opcije, na primer:

- Synthetic Air, `BEG–FRA–JFK`, cena `850.00 EUR`;
- Demo Atlantic, `BEG–AMS–JFK`, cena `910.00 EUR`.

Za svaku opciju unesite buduća vremena odlaska, dolaska i povratka, sintetički opis
prtljaga i opcione uslove tarife. Kliknite **Objavi ponudu kandidatu**. Ponuda dobija
verziju 1, a druga objava je blokirana dok kandidat ne odgovori ili admin ne povuče
aktivnu ponudu.

## 3. Odgovorite kao kandidat

U `/moj-nalog` otvorite **Ponuda avionske karte**. Uporedite obe opcije, označite
jednu, potvrdite izjavu i kliknite **Prihvati izabranu opciju**. Posle osvežavanja
izbor i referenca odgovora moraju ostati vidljivi, a ponovno slanje istog odgovora ne
sme napraviti duplikat.

Za proveru odbijanja koristite drugog probnog kandidata ili novu verziju nakon
povlačenja: unesite opcioni razlog, potvrdite izjavu i kliknite **Odbij celu ponudu**.
Admin mora videti odgovor i razlog.

## 4. Proverite privatnost i kontrolu verzija

Lokalna capture email poruka sme da sadrži samo ime, verziju/broj opcija i link ka
portalu. Ne sme sadržati rutu, datume, cenu ni uslove tarife. Objavljena ponuda mora
blokirati izmenu FR-056 zahteva. Ispravka ponude radi se preko **Povuci ponudu** uz
razlog, pa objavljivanjem nove verzije.

## Automatske provere

```bash
docker compose --profile testing up -d e2e-database
cd apps/platform
npm run migrate:e2e
npm test
npm run lint
npm run typecheck
npm run test:e2e -- tests/integration/flight-ticket-offer.spec.ts tests/e2e/flight-ticket-offer-browser.spec.ts
```
