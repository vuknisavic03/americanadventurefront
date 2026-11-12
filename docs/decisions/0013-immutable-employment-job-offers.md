# ADR 0013: Katalog poslova, kandidatove opcije i nepromenljive konačne ponude

- Status: Prihvaćeno
- Datum: 2026-09-08

## Kontekst

Zahtev FR-048 predviđa da kandidat posle potvrde zaposlenja dobije obaveštenje, radnu ponudu i uputstvo, a da se status procesa ažurira. U praksi agencija pre potvrde često ima više mogućih poslova. Slanje samo jedne opcije i njeno trenutno pretvaranje u konačnu ponudu nepotrebno ograničava kandidata i meša iskazivanje interesovanja sa potvrdom poslodavca.

Uslovi koji su kandidatu prikazani moraju ostati proverljivi čak i ako administrator kasnije izmeni centralni katalog. Konačna ponuda dodatno utiče na odluku kandidata i naredni korak viziranja, pa ni njeni uslovi ne smeju naknadno neprimetno da se izmene.

## Odluka

Administrator održava centralni katalog poslova po sezoni i programu. Posao sadrži poslodavca, poziciju, kategoriju, lokaciju, period, satnicu, očekivane sate, smeštaj, raspoloživost i uputstvo. Katalog je operativna lista i može da se ažurira; svaka izmena povećava njegovu reviziju.

Na aktivnom procesu u koraku `JOB_PLACEMENT` administrator filtrira katalog i čekira od jedne do dvadeset odgovarajućih opcija. Slanje stvara verzionisanu užu listu i poseban nepromenljiv snimak svake izabrane opcije sa SHA-256 kontrolnim otiskom. Kasnija izmena kataloga zato ne menja ono što kandidat vidi. Kandidat dobija kratko obaveštenje da su opcije dostupne u zaštićenom portalu; email ne sadrži kompletne uslove.

Kandidat može nezavisno da označi više opcija kao `INTERESTED`, da označi da ga neka trenutno ne interesuje ili da odluku vrati na neodlučeno. Ove radnje nisu prihvatanje ponude niti potvrda zaposlenja. Svaka promena koristi verziju stanja radi zaštite od istovremenog prepisivanja i ulazi u revizijski trag.

Tek nakon što kandidat označi interesovanje i poslodavac potvrdi dostupnost, administrator jednu opciju pretvara u konačnu radnu ponudu. Tada nastaje nepromenljiv zapis konkretnih uslova, pouzdan outbox događaj i naredna akcija kandidata. Istovremeno može postojati samo jedna aktivna konačna ponuda. Ako je treba ispraviti, administrator je povlači uz obavezan razlog; povezana opcija se vraća u stanje interesovanja i može se ponovo razmatrati.

Kandidat može elektronski da prihvati samo svoju trenutno objavljenu, neisteklu konačnu ponudu. Prihvatanje se vezuje za nalog, tačan otisak ponude, verzionisanu izjavu, vreme i nepromenljivu referencu dokaza. Ono je elektronska evidencija saglasnosti u portalu, a ne kvalifikovani elektronski potpis. Prihvatanje atomski umanjuje poznati broj raspoloživih mesta u katalogu, zatvara posao kada stigne do nule, označava izabranu opciju, zatvara ostale opcije i uže liste i pomera proces na `VISA`. Ako broj mesta nije unet, ne menja se jer sistem ne pretpostavlja nepoznatu raspoloživost.

## Posledice

- Administrator ponovo koristi uređene poslove iz centralnog kataloga, umesto ručnog prepisivanja istih uslova za svakog kandidata.
- Kandidat može prirodno da uporedi više poslova i promeni interesovanje pre konačne odluke.
- Iskazano interesovanje se jasno razlikuje od potvrde poslodavca i pravog prihvatanja ponude.
- Agencija i kandidat mogu naknadno da utvrde koje su opcije prikazane i koji su tačno uslovi konačno prihvaćeni.
- Dva administratora, zastareo ekran ili ponovljen zahtev ne mogu neprimetno da pregaze aktivno stanje.
- Povučena, istekla ili tuđa ponuda ne može da bude prihvaćena.
- Automatsko rangiranje prema preferencijama, rezervacija broja mesta i integracije sa poslodavcima ostaju posebna buduća proširenja.
