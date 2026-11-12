# ADR 0012: Zakazivanje pripreme za razgovor za posao

- Status: Prihvaćeno
- Datum: 2026-09-08

## Kontekst

Kandidat koji završi programsku aplikaciju i verifikaciju obaveznih Work & Travel dokumenata prelazi na korak „Posao i intervju“. Specifikacija zahteva zakazivanje pripreme i evidenciju prisustva, ali termin, promena termina i ishod moraju ostati proverljivi. Jedno promenljivo polje na profilu ne bi sačuvalo istoriju niti bi dovoljno jasno odvojilo informacije za kandidata od internih beležaka agencije.

## Odluka

Uvodi se zasebna evidencija termina pripreme povezana sa procesom, nalogom kandidata, prijavom i administratorom koji je izvršio radnju. Za jedan proces može postojati više pokušaja, ali servis pod zaključavanjem procesa dozvoljava najviše jedan aktivan termin sa statusom `SCHEDULED`.

Administrator može da zakaže ili promeni budući termin, navede način održavanja, lokaciju ili link, instrukcije za kandidata i odvojenu internu napomenu. Posle početka termina može da evidentira prisustvo ili izostanak; otkazivanje je dozvoljeno i pre početka. Svaka izmena koristi očekivanu verziju zapisa radi zaštite od istovremenog rada dva administratora i upisuje revizijski događaj.

Kandidat u portalu vidi vreme u zabeleženoj vremenskoj zoni, način održavanja, lokaciju ili link, instrukcije i istoriju svojih termina. Interna napomena i tehnička verzija zapisa uopšte se ne uključuju u model podataka namenjen kandidatu.

Završena priprema ne prebacuje proces automatski na korak vize. Potvrda zaposlenja i konkretna ponuda posla predstavljaju poseban naredni poslovni događaj iz zahteva FR-048.

## Posledice

- Zakazivanje i ishodi imaju jasnu istoriju i revizijski trag.
- Kandidat dobija samo informacije potrebne za dolazak i pripremu.
- Istovremene administratorske izmene ne mogu neprimetno da pregaze jedna drugu.
- Ovaj korak ne izmišlja model poslodavca ili ponude posla pre njihove zasebne odluke i implementacije.
