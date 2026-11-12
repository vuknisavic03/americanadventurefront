# FR-059 — provera orijentacionog sastanka pred putovanje

Koristite isključivo probnog kandidata i sintetičke podatke. Ovaj korak proverava
zakazivanje, prikaz termina i evidenciju prisustva; ne rezerviše spoljni Calendly
termin i ne šalje automatsku poruku kandidatu.

## Pokretanje u WSL terminalu

Ako je razvojni server pokrenut, prvo ga zaustavite pomoću `Ctrl+C`.

```bash
cd /home/nemanja/AmericanAdventure26
git status --short
git fetch origin
git switch feat/travel-orientation-meetings
git pull --ff-only
docker compose up -d database
cd apps/platform
npm ci
npm run migrate
npm run dev
```

Migracija za FR-059 mora biti primenjena pre otvaranja portala. Ne treba menjati
`.env` niti dodavati Calendly ključ.

## 1. Zakažite sastanak

1. Otvorite `/admin`, zatim **Procesi kandidata** i probnog kandidata čiji je
   proces aktivan i nalazi se u koraku **Priprema putovanja**.
2. Pronađite odeljak **Orijentacioni sastanak pred putovanje**.
3. Unesite početak u budućnosti, opciono kraj, vremensku zonu, način održavanja
   i lokaciju ili sintetički link, na primer `https://example.invalid/orijentacija`.
4. Unesite instrukciju koju kandidat sme da vidi i posebnu internu napomenu.
5. Kliknite **Zakaži termin**. Proverite da se pojavila istorija i dugme
   **Promeni termin**.

Sistem odbija prošli datum, neispravnu vremensku zonu, trajanje duže od četiri
sata i zastarelu verziju termina.

## 2. Proverite kandidatski portal i kalendar

1. Prijavite se tim kandidatom na `/moj-nalog`.
2. U odeljku **Orijentacioni sastanak pred putovanje** proverite datum, način
   održavanja, lokaciju i instrukciju.
3. Interna napomena ne sme biti vidljiva kandidatu.
4. Kliknite **Preuzmi termin za kalendar (.ics)**. Fajl treba da se zove
   `orijentacioni-sastanak.ics` i može se uvesti u kalendar.
5. Promenite termin u admin portalu i proverite novi datum nakon osvežavanja.
   `.ics` je trenutna kopija, pa posle izmene treba preuzeti novi fajl.

## 3. Evidentirajte ishod

Prisustvo i izostanak moguće je evidentirati tek kada termin počne. Za brzu
ručnu proveru zakažite termin nekoliko minuta unapred.

1. Pre početka klik na **Evidentiraj prisustvo** mora biti odbijen.
2. Kada termin počne, kliknite **Evidentiraj prisustvo**.
3. Kandidat posle osvežavanja vidi da je orijentacija završena, a sledeća akcija
   postaje **Pripremite se za putovanje**.
4. Za drugi probni termin proverite **Evidentiraj izostanak** ili **Otkaži termin**.
5. Zaključeni termin ostaje u istoriji i više ne nudi kalendarski fajl.

## Automatske provere

```bash
docker compose --profile testing up -d e2e-database
cd apps/platform
npm run migrate:e2e
npm test
npm run lint
npm run typecheck
npm run test:e2e -- tests/integration/orientation-meeting.spec.ts tests/e2e/orientation-meeting-browser.spec.ts
```

Testovi proveravaju administratorske dozvole, zaštitu od tuđeg termina,
zastarele verzije, odvojenost od drugih priprema, skrivanje interne napomene,
kalendarski fajl, revizijski trag i prikaz u oba portala.
