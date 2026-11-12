# ADR 0004: Odvajanje programske ponude od prihvaćenog izbora plaćanja

- Status: Prihvaćeno
- Datum: 2026-08-29

## Kontekst

Work & Travel kandidat pre ugovora bira ponuđeni način plaćanja. Cena, popust i dinamika rata mogu se promeniti za buduće kandidate, ali kasnija promena komercijalnih pravila ne sme promeniti uslove koje je konkretan kandidat već izabrao. Iznosi će kasnije biti osnova za ugovor, evidenciju uplata i finansijske izveštaje.

## Odluka

Programska ponuda i izbor kandidata čuvaju se kao dva odvojena poslovna zapisa:

- `program-offers` sadrži administratorski definisane uslove i prolazi kroz statuse `DRAFT`, `PUBLISHED`, `ACCEPTED` i `WITHDRAWN`;
- `program-offer-selections` nastaje tek kada kandidat potvrdi izbor i sadrži nepromenljiv snapshot izabrane cene, popusta i dinamike;
- svi novčani iznosi čuvaju se kao celi broj centi u USD;
- samo nacrt može da menja komercijalne uslove, a objavljena ponuda može samo da bude prihvaćena ili povučena;
- baza jedinstvenim indeksima garantuje najviše jednu aktivnu ponudu i jedan prihvaćen izbor po procesu kandidata;
- kandidat bira kroz namenski autentifikovan serverski endpoint, dok kolekcije ne dozvoljavaju direktan klijentski upis;
- izbor, promena procesa i audit događaj čuvaju se u jednoj transakciji.

## Posledice

Pozitivno:

- prihvaćeni iznos se ne menja kada agencija kasnije promeni cenovnik;
- nema grešaka karakterističnih za računanje novca decimalnim brojevima;
- ugovor i finansijski modul kasnije mogu da koriste stabilan izvor podataka;
- konkurentni zahtevi kandidata ne mogu napraviti dva različita izbora.

Trošak:

- ponuda koja je već objavljena ne ispravlja se na mestu, već se povlači i pravi se novi nacrt;
- snapshot delimično duplira podatke, ali namerno čuva istorijsku istinu.

## Van ove odluke

Ova odluka ne definiše ugovor, naplatu, knjiženje, račun, kurs NBS, dokumentaciju jemca niti posebne popuste izvan direktnog popusta na jednokratno plaćanje.
