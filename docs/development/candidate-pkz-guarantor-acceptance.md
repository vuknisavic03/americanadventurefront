# Acceptance Vodič: PKZ i Jemac (FR-029, FR-030)

Ovaj dokument opisuje procedure verifikacije i scenarije prihvatanja za model plaćanja **„Platiš kad zaradiš“ (PKZ)** i prateće podatke jemca, šifrovano postavljanje očitane lične karte, administrativnu verifikaciju i generisanje **Ugovora o solidarnom jemstvu i meničnog ovlašćenja**.

---

## 1. Poslovna pravila i validacije (FR-029 & FR-030)

1. **Preduslov:** Kandidat mora imati objavljenu ponudu programa sa uključenom PKZ opcijom (`payWhenYouEarn.enabled: true`), definisanim početnim depozitom (`depositCents`) i odloženim iznosom (`deferredAmountCents`).
2. **Izbor PKZ modela:**
   - Kandidat bira `PAY_WHEN_YOU_EARN` na portalu.
   - Sistem snima snapshot izbora i prelazi u fazu pripreme ugovora i prikupljanja podataka jemca.
3. **Validacija podataka jemca:**
   - JMBG jemca se proverava po modulu 11 kontrolne cifre.
   - Punoletnost: jemac mora imati najmanje 18 godina u trenutku provere.
   - Potpuni podaci o zaposlenju: poslodavac, radno mesto, status zaposlenja, mesečna primanja u RSD.
   - Kontakt podaci: adresa prebivališta, telefon, email, organ koji je izdao ličnu kartu.
   - Broj menica: najmanje 2 potpisane blanko solo menice.

---

## 2. Šifrovanje i bezbednost podataka

1. **JMBG jemca:**
   - Šifruje se primenom algoritma AES-256-GCM sa kontekstom `guarantor-jmbg:${candidateAccountId}`.
   - Računa se jedinstveni HMAC-SHA-256 fingerprint radi sprečavanja duplikata.
   - Nijedan javni API ili JSON odgovor ne vraća pun JMBG jemca (samo maskiran oblik `1505975******`).
2. **Očitana lična karta jemca:**
   - Dozvoljeni formati: PDF, JPEG, PNG do 5 MB.
   - Validacija zaglavlja datoteke (magic bytes).
   - Šifrovano skladištenje u `candidate-private-documents` sa oznakom `GUARANTOR_ID_CARD`.
   - Pristup dešifrovanom fajlu ima isključivo ovlašćeni administrator kroz auditovanu rutu `/api/admin/guarantor/:id/id-card`.

---

## 3. Administratorski tok i verifikacija

1. **Pregled zahteva:**
   - Administrator na ruti `/api/admin/guarantor` vidi listu unetih jemaca sa filterima po statusu (`PENDING_REVIEW`, `VERIFIED`, `REJECTED`) i pretrazi.
2. **Provera dokumentacije:**
   - Administrator preuzima i pregleda očitanu ličnu kartu jemca radi upoređivanja sa unetim podacima.
3. **Odbijanje jemca:**
   - Ukoliko je lična karta nečitka, istekla ili podaci ne odgovaraju, administrator poziva `POST /api/admin/guarantor/:id/reject` sa obaveznim obrazloženjem.
   - Status postaje `REJECTED`, a kandidat na portalu dobija obrazloženje i mogućnost unosa ispravljenih podataka ili zamene jemca.
4. **Verifikacija i generisanje ugovora:**
   - Ukoliko su podaci ispravni, administrator poziva `POST /api/admin/guarantor/:id/verify`.
   - Status jemca i dokumenta prelazi u `VERIFIED`.
   - Sistem automatski generiše **Ugovor o solidarnom jemstvu i menično ovlašćenje** u PDF formatu sa brojem `AA-JEM-GGGG-XXXXXX`.
   - Ugovor sadrži sve tri ugovorne strane (Agencija, Kandidat, Jemac-platac), odloženi iznos, klauzulu solidarnog jemstva po ZOO čl. 1004, menično ovlašćenje za 2 blanko solo menice i polja za svojeručne potpise.

---

## 4. Preuzimanje ugovora i kandidatov portal

1. **Kandidatski pristup:**
   - Kandidat preko `GET /api/candidate/guarantor` prati status verifikacije jemca.
   - Nakon što je jemac verifikovan, kandidat preuzima ugovor preko `GET /api/candidate/guarantor/contract-pdf`.
   - Ugovor se preuzima dešifrovan, a integritet je zagarantovan SHA-256 kontrolnim otiskom.
