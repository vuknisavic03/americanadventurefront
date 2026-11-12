# Provera viznog upitnika kandidata — FR-050

Koristite sintetičkog kandidata i izmišljene podatke. Probni obrazac nije zvanična vizna prijava; sadržaj treba da potvrdi agencija.

## Priprema

Kandidat mora imati aktivan Work & Travel proces na koraku „Viza“ i evidentiranu uplatu viznih troškova. Koristite postojeće SENSITIVE_DATA_* ključeve iz lokalnog .env fajla. Ne menjajte postojeće ključeve i ne delite ih.

Na čistoj instalaciji primenite migracije pre pokretanja aplikacije. Ako razvojna baza koristi Payload automatsko usklađivanje šeme, nemojte potvrđivati upozorenje o brisanju podataka; prvo proverite stanje migracija i rezervnu kopiju. Iz apps/platform pokrenite npm run dev. Otvorite kandidata i administratora u odvojenim browser sesijama.

## Kandidat

1. Otvorite /moj-nalog i odeljak „Vizni upitnik“ ispod naloga za vizne troškove.
2. U „Mesto rođenja“ unesite „Test grad“. Kliknite „Sačuvaj nacrt upitnika“ i osvežite stranicu; odgovor treba da ostane sačuvan.
3. Pokušajte predaju nepotpunog obrasca. Obavezna polja treba da budu jasno označena.
4. Popunite obavezna polja izmišljenim podacima. Za prethodni boravak unesite „Nisam boravio/la — test“.
5. Kliknite „Predaj vizni upitnik“. Status postaje „Predato agenciji“, a uređivanje se zaključava.

## Administratorski pregled i dopuna

1. Otvorite Administracija → Procesi kandidata → konkretan kandidat → „Vizni upitnik“.
2. Proverite predate odgovore. Unesite „Molimo dopunite naziv fakulteta — test“ i kliknite „Vrati na dopunu“.
3. Osvežite kandidatov portal. Kandidat vidi napomenu i može da ispravi odgovore.
4. Ponovo predajte upitnik. Administrator sada vidi novu verziju; prethodni odgovori ostaju u „Istorija predaje i pregleda“.
5. Kliknite „Završi pregled upitnika“. Kandidat vidi „Pregled završen“. Ovaj status označava pregled u agenciji, ne odobrenje vize.

## Negativne provere

- Kandidat bez evidentirane vizne uplate ne može da koristi upitnik ni direktnim HTTP zahtevom.
- Drugi kandidat ne vidi tuđe odgovore. Direktno menjanje kolekcije je zabranjeno i administratoru.
- Otvorite dva prozora istog upitnika. Posle čuvanja u prvom, drugi mora dobiti poruku da osveži zastarelu reviziju.
- Predati i pregledani upitnici se ne menjaju kroz kandidatov obrazac.
- U bazi odgovori i napomene nisu čitljiv tekst. Revizijski događaji sadrže samo identifikatore, akciju i reviziju.

## Automatske provere

Iz apps/platform: npm run typecheck, npm run lint, npm test i npm run build.
Za izdvojenu bazu koristite compose servis e2e-database i .env.e2e. Pokrenite npm run migrate:e2e, zatim npm run test:e2e. Ove provere ne treba usmeravati ka razvojnoj ili produkcionoj bazi.
