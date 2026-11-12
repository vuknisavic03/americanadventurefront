# FR-053 i FR-054 — uputstvo za proveru

Koristite isključivo sintetičkog kandidata i test kontakt podatke. Podrazumevana podešavanja hvataju e-mail i SMS lokalno i ne šalju ih stvarnim osobama.

## Priprema

1. Pokrenite bazu iz korena projekta: `docker compose up -d database`.
2. Pre migracije postojeće lokalne baze napravite rezervnu kopiju. U `apps/platform` proverite stanje sa `npm run migrate:status`, zatim pokrenite `npm run migrate` i na kraju `npm run dev`.
3. Ako Payload prijavi mogući gubitak podataka ili razliku nastalu automatskim razvojnim usklađivanjem šeme, nemojte potvrditi nastavak. Migraciju tada proverite nad čistom izolovanom test bazom ili obnovljenom kopijom.
4. Kandidat mora imati aktivan proces na koraku „Viza“ i elektronski prihvaćeno punomoćje za preuzimanje pasoša.

## FR-053 — termin i revizijski trag

1. Prijavite se kao kandidat i otvorite `/moj-nalog`.
2. U odeljku „Termin u ambasadi“ unesite budući datum i vreme, pa kliknite „Sačuvaj termin“.
3. Osvežite stranicu. Termin i vreme planiranog podsetnika moraju ostati prikazani.
4. Promenite vreme i kliknite „Sačuvaj izmenjeni termin“. Prikazana verzija u administratorskom panelu mora se uvećati.
5. Kao administrator otvorite odgovarajući zapis u „Procesi kandidata“. Odeljak „Termin u ambasadi i podsetnici“ mora prikazati isti važeći termin.
6. U evidenciji revizijskih događaja proverite `EMBASSY_APPOINTMENT_SCHEDULED` i `EMBASSY_APPOINTMENT_RESCHEDULED`. Događaj izmene sadrži prethodni i novi termin.

## FR-054 — automatski podsetnik

1. Za brzu lokalnu proveru unesite termin koji je u naredna tri dana. Takav podsetnik je već dospeo i task se stavlja u red bez dodatnog čekanja.
2. Sačekajte automatski job runner ili kao administrator pokrenite red `candidate-communications` kroz Payload Jobs ekran.
3. U administratorskom odeljku procesa moraju postojati po jedna isporuka za `EMAIL` i `SMS`, obe sa statusom `DELIVERED` kada su provajderi podešeni na `capture`.
4. Ponovno pokretanje istih poslova ne sme napraviti duplu isporuku zbog jedinstvenog idempotency ključa.
5. Promenite termin pre izvršenja starog podsetnika. Stari posao mora biti preskočen, a poruke smeju sadržati samo novu verziju termina.

## Prava SMS isporuka

Za produkcijski SMS podesite `CANDIDATE_SMS_PROVIDER=webhook`, `CANDIDATE_SMS_WEBHOOK_URL`, `CANDIDATE_SMS_WEBHOOK_TOKEN` i `CANDIDATE_SMS_SENDER`. Webhook prima JSON polja `to`, `from`, `text` i `idempotencyKey`, uz Bearer token i istoimeno `Idempotency-Key` zaglavlje. Uspešan odgovor mora biti HTTP 2xx JSON oblika `{ "id": "provider-message-id" }`.

Token nikada ne sme biti commitovan. Pre uključivanja produkcije potrebno je proveriti ugovor, saglasnost za SMS komunikaciju, format brojeva, limit poruka, monitoring neuspelih isporuka i postupak zamene tajne.
