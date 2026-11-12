# Provera kataloga poslova, kandidatovih opcija i konačne radne ponude

Koristite isključivo sintetičkog kandidata, izmišljene poslodavce i test email adresu. Ne unosite stvarne lične ili poslovne podatke.

## Preduslovi

1. Primenite migracije na razvojnu ili izdvojenu E2E bazu.
2. Pokrenite platformu i prijavite se kao administrator.
3. Izaberite aktivan SWT proces na koraku `JOB_PLACEMENT` i pripremite pristup portalu tog sintetičkog kandidata.
4. Za lokalni razvoj koristite `CANDIDATE_EMAIL_PROVIDER=capture`, kako poruka ne bi bila poslata stvarnoj osobi.

## Centralni katalog

1. U admin portalu otvorite kolekciju **Katalog poslova**.
2. Dodajte najmanje dve sintetičke otvorene pozicije za istu kampanju i program kao kandidat. Unesite različite gradove, vrste posla, satnice ili uslove smeštaja kako bi poređenje bilo vidljivo.
3. Dodajte i jednu poziciju za drugu kampanju ili sa statusom nacrta. Ona ne sme biti ponuđena na procesu ovog kandidata.
4. Otvorite proces kandidata i pronađite odeljak **Katalog i opcije poslova kandidata**.
5. Proverite pretragu i filter vrste posla. Čekirajte obe odgovarajuće pozicije i kliknite **Pošalji izabrane opcije kandidatu**.
6. Proverite da je nastala jedna uža lista, dve kandidatove opcije, revizijski događaj `JOB_SHORTLIST_SENT` i poruka kategorije `JOB_SHORTLIST`. Obaveštenje treba da vodi na portal, bez kompletnih uslova u emailu.

## Poređenje i interesovanje kandidata

1. Otvorite `/moj-nalog` kao odgovarajući sintetički kandidat.
2. U odeljku **Vaše opcije poslova** proverite da obe pozicije prikazuju poslodavca, lokaciju, period, satnicu, očekivane sate, smeštaj i uputstvo.
3. Označite prvu opciju sa **Zainteresovan/a sam**, a drugu sa **Trenutno me ne interesuje**.
4. Osvežite stranicu. Izbori moraju ostati sačuvani.
5. Na drugoj opciji kliknite **Vrati u razmatranje**, pa je označite kao zainteresovanu. Kandidat tako može da se interesuje za više poslova istovremeno.
6. U revizijskom tragu proverite događaje `JOB_OPTION_PREFERENCE_UPDATED`. Tehničke verzije i interne beleške ne smeju biti prikazane kandidatu.

## Potvrda poslodavca i konačna ponuda

1. Vratite se na proces kandidata u admin portalu. Obe zainteresovane opcije treba da budu vidljive.
2. Na jednoj od njih kliknite **Potvrdi posao i pošalji zvaničnu ponudu**. Ovo simulira prethodno dobijenu potvrdu poslodavca.
3. Proverite da je nastala nepromenljiva konačna ponuda sa statusom `PUBLISHED`, da je izabrana opcija `EMPLOYER_CONFIRMED` i da nije moguće istovremeno potvrditi drugu opciju.
4. Proverite poruku kategorije `EMPLOYMENT_OFFER` i revizijske događaje `EMPLOYMENT_OFFER_PUBLISHED` i `EMPLOYMENT_OFFER_NOTIFICATION_SENT`.
5. Na kandidatovom portalu proverite da se potvrđena opcija jasno razlikuje od ostalih i da je zvanična ponuda prikazana u posebnom odeljku.

## Prihvatanje

1. Proverite naziv poslodavca i pozicije, lokaciju, period, satnicu, sate, smeštaj, rok i uputstvo u zvaničnoj ponudi.
2. Bez označavanja potvrde pokušajte prihvatanje; zahtev mora ostati neizvršen.
3. Označite izjavu i kliknite **Elektronski prihvati radnu ponudu**.
4. Portal mora prikazati vreme i referencu prihvatanja, ponuda dobija status `ACCEPTED`, izabrana opcija status `SELECTED`, ostale status `NOT_SELECTED`, broj raspoloživih mesta u katalogu umanjuje se za jedan, a proces prelazi na `VISA`.
5. Ako je prihvaćeno poslednje poznato mesto, proverite da je posao u katalogu automatski dobio status `CLOSED`. Ponovljeno slanje istog zahteva ne sme ponovo umanjiti broj mesta.
6. Osvežite stranicu i ponovite zahtev. Ne sme nastati drugi dokaz prihvatanja niti dodatno pomeranje procesa.

## Povlačenje i zaštitna pravila

1. Na novom sintetičkom procesu pošaljite opciju, iskažite interesovanje i formirajte konačnu ponudu.
2. Unesite razlog i povucite konačnu ponudu pre prihvatanja. Istorija mora čuvati ponudu, kandidat je više ne može prihvatiti, a povezana opcija se vraća u stanje interesovanja.
3. Potvrdite istu ili drugu zainteresovanu opciju i proverite da nova konačna ponuda dobija sledeći broj verzije.
4. Povucite običnu opciju uz razlog i proverite da kandidat više ne može da je izabere.
5. Pokušajte slanje istog kataloškog posla istom kandidatu, slanje posla iz druge kampanje, promenu tuđe opcije, potvrdu opcije bez interesovanja i radnje van koraka `JOB_PLACEMENT`. Svi zahtevi moraju biti kontrolisano odbijeni.

## Automatizovane provere

Iz direktorijuma `apps/platform` pokrenite:

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

Servisni testovi proveravaju nepromenljiv snimak kataloških uslova, slanje uže liste, promenu kandidatovog interesovanja, potvrdu konačne ponude, dokaz prihvatanja i prelazak na vizu. Integracioni test proverava da administratorske i kandidatove rute nisu dostupne bez odgovarajuće sesije.
