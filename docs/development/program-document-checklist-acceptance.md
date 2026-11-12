# Provera programske dokumentacije za Work & Travel

Koristite isključivo sintetičke fajlove. Tokom razvoja ili demonstracije platforme nikada ne postavljajte pravu fotografiju osobe, potvrdu o studiranju, CV, pasoš ili drugi lični dokument.

## Preduslovi

1. Primenite migracije sa ove grane na privremenu razvojnu bazu ili bazu za koju postoji proverena rezervna kopija.
2. Pokrenite platformu i prijavite se kao aktivan, verifikovan kandidat čiji se proces nalazi na koraku `DOCUMENTS`.
3. Pripremite tri sintetička fajla:
   - JPEG ili PNG sa jednobojnom pozadinom i tekstom `SINTETIČKA PROFILNA FOTOGRAFIJA — NIJE PRAVA OSOBA`;
   - PDF od jedne stranice ili sliku sa naslovom `SINTETIČKA POTVRDA O STUDIRANJU` i izmišljenim podacima;
   - PDF od jedne stranice sa naslovom `SYNTHETIC ENGLISH CV` i izmišljenim podacima.

Aplikacija proverava stvarni sadržaj i potpis fajla. Preimenovanje tekstualnog fajla u `.pdf`, `.jpg` ili `.png` ne pravi ispravan test dokument.

## Postavljanje i provera dokumenata kao kandidat

1. Otvorite `/moj-nalog` i pronađite odeljak **Dokumenti za Work & Travel**.
2. Proverite da kontrolna lista sadrži tačno tri stavke: profilnu fotografiju, potvrdu o studiranju i CV na engleskom.
3. Pokušajte da postavite nepodržani format i fajl veći od 5 MB. Oba zahteva moraju biti odbijena bez pravljenja zapisa dokumenta.
4. Postavite po jedan ispravan sintetički fajl za svaku stavku. Posle svakog postavljanja osvežite stranicu i proverite da stavka prikazuje status **Čeka proveru agencije**.
5. Proverite da kandidat može da preuzme samo sopstvene fajlove i da zahtev bez prijavljene sesije dobija odgovor `401`.

## Administratorska provera i zamena dokumenta

1. Prijavite se na `/admin` i otvorite **Privatni dokumenti kandidata**.
2. Otvorite novopostavljenu sintetičku stavku i proverite da su kandidat, vrsta dokumenta, naziv fajla, format i veličina vidljivi, ali da šifrovana polja baze nije moguće menjati.
3. Preuzmite dokument, potvrdite da je to originalni sintetički fajl, a zatim ga odbijte uz jasan razlog.
4. Ponovo se prijavite kao kandidat, proverite da je razlog odbijanja vidljiv i postavite ispravljenu sintetičku verziju.
5. Proverite da stari zapis ima status `SUPERSEDED`, a zamenski dokument status `UPLOADED`.
6. Verifikujte zamenski dokument. Proverite da kandidat više ne može da zameni verifikovanu stavku preko rute za postavljanje dokumenata.

## Završna kontrola i revizijski trag

1. Verifikujte samo dve stavke i proverite da proces kandidata ostaje na koraku `DOCUMENTS`.
2. Verifikujte treću stavku i proverite da proces samo jednom prelazi na `JOB_PLACEMENT`.
3. Proverite da portal kandidata prikazuje sledeću aktivnost i da sva tri dokumenta ostaju dostupna za kontrolisano preuzimanje.
4. Pregledajte revizijske događaje za svako postavljanje, pristup, odbijanje ili verifikaciju, kao i za završni prelazak procesa. Metapodaci smeju da sadrže identifikatore dokumenata, vrste i verziju kontrolne liste, ali nikada nešifrovan sadržaj dokumenta.
