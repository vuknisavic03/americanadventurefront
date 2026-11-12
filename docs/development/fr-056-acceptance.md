# FR-056 — provera zahteva za avionsku kartu

Koristite samo probnog kandidata i sintetičke datume/destinacije. Ovaj korak ne kupuje
kartu i ne predstavlja ponudu leta; on agenciji dostavlja podatke potrebne za FR-057.

## Pokretanje u WSL terminalu

```bash
cd /home/nemanja/AmericanAdventure26
docker compose up -d database
cd apps/platform
npm ci
npm run migrate
npm run dev
```

Nova migracija je `20260917_081937_flight_ticket_requests`. Za lokalni rad ostavite
`CANDIDATE_EMAIL_PROVIDER=capture`: email se ne šalje stvarnoj adresi, već se bezbedno
beleži u terminalu i bazi. Opciono postavite `FLIGHT_REQUEST_NOTIFICATION_EMAIL` na
adresu operativnog tima; bez nje koristi se `CANDIDATE_EMAIL_REPLY_TO`.

## 1. Pripremite probni proces

U `/admin` otvorite **Procesi kandidata**, izaberite probnog kandidata i postavite:

- status procesa: **Aktivan**;
- trenutni korak: **Putovanje i orijentacija**.

Sačuvajte proces. Odeljak **Zahtev za avionsku kartu** u adminu u početku treba da
kaže da kandidat još nije poslao zahtev.

## 2. Pošaljite zahtev kao kandidat

Prijavite se kao isti kandidat na `/moj-nalog`. U odeljku **Zahtev za avionsku kartu**
unesite, na primer:

- datum odlaska: `10.06.2027`;
- destinacija u SAD: `Ocean City, MD`;
- datum povratka: `12.09.2027`;
- povratna destinacija: `Beograd (BEG)`.

Kliknite **Pošalji zahtev agenciji**. Portal prikazuje verziju 1 i stanje obaveštenja.
Osvežite stranicu: sva četiri podatka moraju ostati sačuvana. Datum povratka koji nije
posle odlaska, nemoguć datum ili datum odlaska u prošlosti moraju biti odbijeni.

## 3. Proverite admin i bezbednost emaila

Osvežite isti proces u adminu. Odeljak prikazuje sva četiri podatka, vreme poslednje
izmene, verziju i stanje obaveštenja. Kada pozadinski posao obradi lokalnu poruku,
stanje postaje **Isporučeno**.

Email/terminalski zapis sme da sadrži ime kandidata, verziju i link ka admin portalu,
ali ne sme da sadrži datume ni destinacije. Ako je automatsko slanje neuspešno, zahtev
ostaje vidljiv u admin portalu sa jasnim stanjem greške.

## 4. Proverite izmenu i konflikt

Kandidat promeni povratnu destinaciju i klikne **Sačuvaj izmene i prosledi**. Verzija
postaje 2 i pravi se novo obaveštenje. Stara kartica ili istovremeni zahtev sa prethodnom
verzijom mora biti odbijen porukom da se stranica osveži.

Promenite proces na drugi korak ili status **Pauziran**. Postojeći zahtev ostaje vidljiv,
ali kandidatu više nije dozvoljeno menjanje.

## Automatske provere

```bash
docker compose --profile testing up -d e2e-database
cd apps/platform
npm run migrate:e2e
npm test
npm run lint
npm run typecheck
npm run test:e2e -- tests/integration/flight-ticket-request.spec.ts tests/e2e/flight-ticket-request-browser.spec.ts
```
