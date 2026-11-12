# Provera punomoćja za preuzimanje pasoša - FR-052

Koristite samo sintetičke podatke i testnog kandidata. Nemojte unositi JMBG, adresu ili dokument stvarne osobe. Tekst šablona u ovom koraku je probni; agencija treba da odobri konačan tekst pre produkcije i da pravno proveri da li je za stvarnu namenu dovoljan ovaj način elektronskog prihvatanja.

## Preduslovi

Kandidat mora imati aktivan Work & Travel proces na koraku „Viza“, validiran JMBG, verifikovan pasoš, pregledan vizni upitnik i svih pet prihvaćenih stavki vizne dokumentacije iz FR-051. Lokalna baza i aplikacija treba da rade, a `SENSITIVE_DATA_*` vrednosti moraju biti postavljene samo u lokalnom `.env` fajlu.

## Administrator - priprema šablona

1. Otvorite Administracija → Ugovori i dokumentacija → Šabloni punomoćja.
2. Kreirajte novi zapis sa programom „Work & Travel“, verzijom `1`, statusom „Nacrt“ i sintetičkim tekstom. Možete koristiti polja navedena ispod polja za tekst: ime, JMBG, adresa, broj i datum punomoćja.
3. Sačuvajte nacrt, zatim promenite samo status u „Aktivan“ i ponovo sačuvajte.
4. Proverite da sadržaj aktivne verzije više ne može da se menja. Za novu formulaciju treba napraviti novu verziju, a staru aktivnu verziju povući.
5. Za jedan program sme da postoji tačno jedan aktivan šablon; u suprotnom je generisanje namerno blokirano.

## Administrator - generisanje

1. Otvorite Administracija → Procesi kandidata → testni kandidat.
2. U odeljku „Punomoćje za preuzimanje pasoša“ proverite da se prikazuje aktivni šablon i da nema blokirajućih poruka.
3. Kliknite „Generiši punomoćje“. Treba da se prikaže jedinstven broj oblika `AA-PUN-GGGG-000001` i status „Čeka prihvatanje kandidata“.
4. Kliknite „Preuzmi nacrt“. PDF treba da ima vodeni žig da nije prihvaćen i da sadrži samo sintetičke podatke koje ste uneli.
5. Ponovni klik na generisanje ne sme napraviti drugo punomoćje za isti proces.

## Kandidat

1. Prijavite se kao testni kandidat na `/moj-nalog` u posebnoj browser sesiji.
2. U odeljku „Punomoćje za preuzimanje pasoša“ preuzmite i pregledajte nacrt.
3. Obeležite potvrdu da ste pročitali dokument i da su podaci tačni, zatim kliknite „Elektronski prihvati punomoćje“.
4. Status treba da postane „Elektronski prihvaćeno“, uz datum i referencu prihvatanja.
5. Preuzmite prihvaćenu verziju. Ona treba da sadrži evidenciju prihvatanja i napomenu da zapis nije kvalifikovani elektronski potpis.

## Završna administratorska provera

1. Osvežite isti proces kandidata u administraciji.
2. Status treba da bude „Elektronski prihvaćeno“, a dugme „Preuzmi za štampu“ dostupno.
3. Preuzeta konačna verzija mora biti ista prihvaćena verzija koju vidi kandidat.
4. Otvorite zapis punomoćja i proverite da se vide kontrolni otisci, verzija šablona, vreme i referenca, ali ne i šifrovani sadržaj.

## Negativne i bezbednosne provere

- Generisanje pre ispunjenih preduslova mora biti onemogućeno uz razumljivu poruku.
- Kandidat ne može da prihvati punomoćje drugog kandidata niti da preuzme tuđi PDF.
- Promenjen kontrolni otisak prikazane verzije mora da blokira prihvatanje.
- Dvostruki klik ili ponovljen zahtev ne sme da napravi dupli dokaz prihvatanja.
- JMBG i sadržaj PDF-a nisu čitljivi u bazi; čuvaju se šifrovano.
- Preuzimanje, generisanje i prihvatanje ostaju zabeleženi u revizijskom tragu.

## Automatske provere

Iz `apps/platform` pokrenite `npm run typecheck`, `npm run lint`, `npm test` i `npm run build`. Za bazne testove koristite isključivo `e2e-database` i `.env.e2e`: prvo `npm run migrate:e2e`, zatim `npm run test:integration -- tests/integration/passport-collection-authorization.spec.ts` ili ceo `npm run test:e2e`.
