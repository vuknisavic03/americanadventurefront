# Provera vizne dokumentacije kandidata - FR-051

Koristite samo sintetičke fajlove i izmišljene podatke. Lista je početna pomoć agenciji i kandidatu; agencija mora da potvrdi konačne zahteve prema mestu podnošenja zahteva.

## Preduslovi

Kandidat mora imati aktivan Work & Travel proces na koraku „Viza“, evidentiranu viznu uplatu i vizni upitnik sa statusom „Pregled završen“. Postojeći pasoš treba da bude verifikovan. Ne menjajte niti delite SENSITIVE_DATA_* ključeve iz lokalnog .env fajla.

## Kandidat

1. Prijavite se na /moj-nalog u posebnoj browser sesiji.
2. U odeljku „Dokumentacija za vizu“ proverite da se vide svih pet stavki i tačan broj prihvaćenih dokumenata.
3. Napravite mali sintetički PDF čiji sadržaj ne predstavlja pravi dokument. Postavite ga kao „Potvrda obrasca DS-160“.
4. Status treba da postane „Čeka proveru agencije“, a ponovno postavljanje te stavke da bude zaključano do odluke administratora.
5. Za „Fotografiju za vizu“ proverite da PDF bude odbijen, a sintetički JPEG ili PNG prihvaćen za postavljanje.

## Administrator

1. Otvorite Administracija → Procesi kandidata → konkretan kandidat → „Dokumentacija za vizu“.
2. Otvorite dokument koji čeka proveru. Preuzmite ga samo ako je potrebno; preuzimanje ostaje evidentirano.
3. Unesite „Dokument nije čitljiv - test“ i kliknite „Odbij dokument“.
4. Kandidat treba da vidi „Potrebna je zamena“ i napomenu, a zatim može da postavi novu verziju.
5. Otvorite novu verziju i kliknite „Verifikuj dokument“. Stara verzija mora ostati u evidenciji kao zamenjena.
6. Kada su svih pet stavki prihvaćene, lista prikazuje „Lista je kompletna“, a sledeća akcija kandidata najavljuje informacije o terminu u ambasadi.

## Negativne i bezbednosne provere

- Pre završenog pregleda viznog upitnika upload mora biti odbijen.
- Kandidat ne može da postavi pasoš kroz novu rutu niti da menja verifikovan dokument.
- Drugi kandidat ne može da preuzme tuđi dokument.
- Dozvoljeni su validni PDF, JPEG i PNG fajlovi do 5 MB; fotografija prihvata samo JPEG ili PNG.
- Sadržaj fajla nije čitljiv u bazi. Audit beleži tip, veličinu i identifikatore, ne sadržaj dokumenta.
- Datum i status svake provere ostaju vezani za administratora.

## Automatske provere

Iz apps/platform pokrenite npm run typecheck, npm run lint, npm test i npm run build. Za testove sa bazom koristite isključivo e2e-database i .env.e2e: npm run migrate:e2e, pa npm run test:e2e.
