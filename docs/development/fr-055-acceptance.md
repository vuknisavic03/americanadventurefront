# FR-055 — provera pripreme kandidata za razgovor u ambasadi

Koristite isključivo probnog kandidata i sintetičke podatke. Ova priprema je sastanak
sa agencijom, a ne zvaničan termin u ambasadi niti odluka o odobrenju vize.

## Pokretanje u WSL terminalu

Ako je razvojni server pokrenut, prvo ga zaustavite pomoću `Ctrl+C`.

```bash
cd /home/nemanja/AmericanAdventure26
git status --short
```

Ako postoje lokalne izmene, sačuvajte ih pre promene grane; nemojte koristiti
`git reset --hard`. Kod za ovaj korak nalazi se na `feat/embassy-interview-preparation`.
Ako ste već na toj grani i kod je ažuran, preskočite promenu grane.

```bash
git fetch origin
git switch feat/embassy-interview-preparation
git pull --ff-only
docker compose up -d database
cd apps/platform
npm ci
npm run migrate
npm run dev
```

Migracija `20260916_164103_embassy_interview_preparation` mora biti primenjena pre
otvaranja portala. Ne treba menjati `.env`, dodavati provajdera ni unositi nove ključeve.
Postojeći termini pripreme ostaju sačuvani kao priprema za razgovor za posao.

## 1. Zakažite pripremu

1. Otvorite `/admin`, zatim **Procesi kandidata** i probnog kandidata čiji je proces
   aktivan i nalazi se u koraku **Viza**.
2. Pronađite odeljak **Priprema za razgovor u ambasadi**. Ne koristite odeljak
   za pripremu za posao niti odeljak sa zvaničnim terminom u ambasadi.
3. Unesite početak u budućnosti, opciono kraj (najviše četiri sata posle početka),
   način održavanja i lokaciju. Na primer: „Probna sala — Beograd“.
4. Unesite instrukciju „Ponesite probni spisak pitanja“ i internu napomenu
   „Ovo vidi samo administrator“.
5. Kliknite **Zakaži termin**. Sačekajte poruku i osvežavanje odeljka.

Vreme unosite u vremenskoj zoni uređaja, koja piše iznad polja. Polje
„Vremenska zona“ određuje zonu prikaza kandidatu; podrazumevana je `Europe/Belgrade`.
Termin pripreme dogovorite pre razgovora u ambasadi. Sistem dozvoljava da pripremu
dogovorite i pre nego što kandidat unese zvaničan termin; ne proverava raspoloživost
zaposlenih niti rezerviše termin kod ambasade.

## 2. Proverite kandidatski portal

1. Prijavite se tim kandidatom na `/moj-nalog` (drugi pregledač/profil olakšava proveru).
2. U odeljku **Priprema za razgovor u ambasadi** proverite datum, lokaciju i instrukciju.
3. Interna napomena ne sme biti vidljiva.
4. Kliknite **Preuzmi termin za kalendar (.ics)**. Fajl je moguće uvesti u kalendar.
   To je trenutna kopija: posle pomeranja termina preuzmite novu, a staru uklonite
   iz kalendara ako je vaš kalendar ne ažurira pri ponovnom uvozu.
5. Proverite da zvaničan termin u ambasadi i njegovi podsetnici nisu promenjeni.

## 3. Promena i otkazivanje

1. Administrator menja početak i klikne **Promeni termin**.
2. Kandidat osvežava portal i vidi novi datum.
3. Administrator klikne **Otkaži termin**. Kandidat vidi otkazivanje i više nema
   preuzimanje kalendara za taj termin.
4. Zakazivanje posle otkazivanja pravi novi termin; prethodni ostaje u istoriji.

## 4. Prisustvo i izostanak

Za brzu ručnu proveru zakažite probni termin nekoliko minuta unapred.
Pre početka server mora odbiti evidenciju prisustva ili izostanka.
Kada termin počne, kliknite **Evidentiraj prisustvo**. Kandidat posle osvežavanja
vidi da je priprema završena. Za drugi probni termin proverite **Evidentiraj izostanak**.
Zaključeni termin nije moguće ponovo zaključiti; po potrebi se zakazuje novi.

Prisustvo ne znači da je viza odobrena i ne pomera proces iz koraka Viza.
Kandidat ne može sam sebi evidentirati prisustvo niti menjati termin.

## Automatske provere

```bash
# Iz korena projekta; testna baza je odvojena od vaše razvojne baze.
docker compose --profile testing up -d e2e-database
cd apps/platform
# .env.e2e mora pokazivati na posebnu bazu čije ime završava sa _e2e ili _test.
npm run migrate:e2e
npm test
npm run lint
npm run typecheck
npm run test:e2e -- tests/integration/embassy-preparation.spec.ts tests/e2e/embassy-preparation-browser.spec.ts
```

Testovi proveravaju dozvole, razdvajanje dve vrste pripreme, zaštitu od tuđih
termina, istovremene zahteve, zastarele verzije, istoriju, revizijski trag,
skrivanje internih napomena, kalendar i rad oba portala bez grešaka u pregledaču.
