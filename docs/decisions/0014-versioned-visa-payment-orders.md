# ADR 0014: Verzionisani nalozi za uplatu troškova viziranja

- Status: Prihvaćeno
- Datum: 2026-09-09
- Zahtev: FR-049

## Kontekst

Nakon prihvatanja radne ponude proces kandidata prelazi na viziranje. FR-049 zahteva da sistem generiše nalog za uplatu troškova viziranja i da nalog bude pravilno vezan za kandidata. Vizni trošak nije deo ugovorene programske cene, pa ga ne treba mešati sa postojećim planom plaćanja programa.

Finansijski podaci koje kandidat vidi ne smeju naknadno tiho da se menjaju. Istovremeno, administrator mora moći da ispravi pogrešan račun, iznos ili instrukciju i da evidentira stvarni prijem uplate.

## Odluka

Vizni nalog je zaseban, verzionisan zapis vezan za kandidatski nalog, proces, kandidata i izvornu prijavu. Izdavanje je dozvoljeno samo administratoru, u aktivnom SWT koraku `VISA` i posle prihvatanja radne ponude.

Izdati nalog čuva iznos, valutu, primaoca, račun, model, poziv na broj, svrhu, rok i kandidatovo uputstvo. Ta polja, broj naloga, verzija i SHA-256 kontrolni otisak ne menjaju se nakon izdavanja. Ako je potrebna ispravka, aktivni nalog se otkazuje uz razlog i izdaje se nova verzija. Po procesu može postojati najviše jedan nalog koji čeka uplatu, a nakon evidentirane uplate ne izdaje se novi nalog.

Evidentiranje uplate ne predstavlja integraciju sa bankom. Administrator potvrđuje datum prijema i opcionu referencu izvoda; promena statusa, identitet administratora i poslovni kontekst ulaze u revizijski trag. Kandidat u portalu vidi samo sopstvene naloge i jasan status.

## Posledice

- Vizni troškovi ostaju odvojeni od programske finansijske kartice.
- Kandidat i administrator mogu dokazati koja verzija instrukcija je bila izdata.
- Pogrešan nalog se ne briše niti prepravlja, već ostaje u istoriji.
- Za automatsko potvrđivanje uplata biće potrebna posebna bankarska integracija i nova odluka.
- Sledeći vizni korak, upitnik iz FR-050, može se otvoriti nakon evidentirane uplate bez menjanja ovog finansijskog modela.
