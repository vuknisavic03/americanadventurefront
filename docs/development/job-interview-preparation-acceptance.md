# Provera pripreme kandidata za razgovor za posao

Za proveru koristite isključivo sintetičkog kandidata i izmišljene lokacije, linkove i napomene.

## Preduslovi

1. Primenite migracije na razvojnu bazu za koju postoji rezervna kopija ili na privremenu E2E bazu.
2. Pokrenite platformu i prijavite se kao administrator.
3. Izaberite aktivan SWT proces koji se nalazi na koraku `JOB_PLACEMENT`.
4. U drugom prozoru pripremite prijavu na portal tog sintetičkog kandidata.

## Zakazivanje i vidljivost

1. U administratorskom zapisu procesa pronađite odeljak **Priprema za razgovor za posao**.
2. Zakažite budući termin do četiri sata trajanja, izaberite način održavanja i unesite izmišljenu lokaciju ili nevažeći test link, na primer domen `example.invalid`.
3. Unesite različit tekst u instrukcije za kandidata i internu napomenu.
4. Osvežite `/moj-nalog` i proverite da kandidat vidi datum, vreme, način održavanja, lokaciju i instrukcije.
5. Proverite da kandidat nigde ne vidi internu napomenu niti tehničku verziju zapisa.
6. Promenite termin u administraciji i proverite da istorija i portal prikazuju izmenjene podatke, bez pravljenja dva istovremeno aktivna termina.

## Ishodi i poslovna pravila

1. Pokušajte da evidentirate prisustvo ili izostanak pre početka termina. Zahtev mora biti odbijen.
2. Otkazivanje budućeg termina mora biti dozvoljeno, a kandidat zatim vidi da čeka novi termin.
3. Zakažite novi termin. Za lokalnu proveru prisustva koristite termin čiji je početak već nastupio, bez menjanja produkcionih podataka.
4. Evidentirajte izostanak i proverite da sledeća akcija kandidata traži dogovor novog termina.
5. Zakažite sledeći pokušaj i evidentirajte prisustvo. Proces mora ostati na `JOB_PLACEMENT` i kandidat treba da vidi da čeka informacije o poslu.
6. Proverite da pokušaj zakazivanja za neaktivan proces ili proces na drugom koraku dobija kontrolisano odbijanje.

## Bezbednost i revizijski trag

1. Pozovite GET i POST rutu `/api/admin/interview-preparations/{candidateProcessId}` bez administratorske sesije. Oba zahteva moraju vratiti `401` i `Cache-Control: no-store`.
2. Otvorite revizijske događaje i proverite događaje za zakazivanje, promenu, otkazivanje, prisustvo i izostanak.
3. Revizijski metapodaci smeju da sadrže identifikatore, broj pokušaja, vreme, vremensku zonu i način održavanja, ali ne internu napomenu ili instrukcije kandidata.
4. U dva administratorska prozora otvorite isti aktivni termin. Izmenite ga u prvom, pa pokušajte drugu izmenu iz zastarelog prozora. Druga izmena mora biti odbijena porukom da je termin u međuvremenu promenjen.
