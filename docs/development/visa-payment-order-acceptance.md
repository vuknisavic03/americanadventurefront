# Provera naloga za uplatu troškova viziranja

Ovaj scenario proverava FR-049 bez korišćenja pravih bankarskih podataka ili stvarne uplate.

## Preduslovi

1. Koristite isključivo sintetičkog kandidata i izmišljene podatke primaoca.
2. Kandidat mora imati aktivan SWT proces, prihvaćenu radnu ponudu i trenutni korak `VISA`.
3. Pokrenite bazu, migracije i razvojni server.
4. Otvorite proces kandidata u administraciji i kandidatov portal u odvojenoj sesiji.

Na razvojnoj bazi na kojoj je Payload ranije automatski menjao šemu, pre prihvatanja upozorenja o gubitku podataka napravite rezervnu kopiju ili migraciju prvo proverite na čistoj testnoj bazi.

## Izdavanje naloga

1. U procesu kandidata pronađite odeljak **Vizni nalog za uplatu**.
2. Unesite sintetički iznos, valutu, primaoca, račun, poziv na broj, svrhu, budući rok i jasno uputstvo.
3. Kliknite **Izdaj nalog kandidatu**.
4. Proverite da administrator vidi broj i prvu verziju naloga, iznos, rok i status da čeka uplatu.
5. Osvežite kandidatov portal. Proverite da su svi izdati podaci vidljivi samo tom kandidatu i da sledeća akcija traži uplatu do unetog roka.

## Zaštita od duplikata i neispravnog toka

1. Ponovite isti zahtev ili brzo kliknite dugme više puta. Mora nastati samo jedan nalog.
2. Dok postoji nalog koji čeka uplatu pokušajte da izdate drugi. Sistem mora odbiti zahtev.
3. Na drugom procesu koji nije u koraku `VISA` pokušajte izdavanje. Sistem mora odbiti zahtev.
4. Proces bez prihvaćene radne ponude ne sme dobiti vizni nalog čak i ako je korak ručno promenjen.

## Otkazivanje i nova verzija

1. Unesite razlog od najmanje pet znakova i otkažite aktivni nalog.
2. Proverite da otkazani nalog ostaje u istoriji i da kandidat više ne dobija instrukciju da plaća po njemu.
3. Izdajte nalog sa ispravljenim sintetičkim podacima.
4. Novi nalog mora dobiti sledeći broj verzije, dok prethodni ostaje neizmenjen.

## Evidentiranje uplate

1. Na aktivnom nalogu unesite sintetički datum prijema koji nije pre izdavanja niti u budućnosti.
2. Opciono unesite izmišljenu referencu izvoda i napomenu.
3. Kliknite **Evidentiraj uplatu**.
4. Proverite da nalog dobija status plaćen, datum i administratora koji je evidentirao uplatu.
5. Kandidatov portal mora prikazati potvrđen status, a sledeća akcija najaviti vizni upitnik.
6. Ponovni zahtev za istu uplatu ne sme promeniti zapis niti napraviti novi nalog.

## Provera isteka

1. Na testnom nalogu koristite rok koji je već prošao promenom testnog vremena ili pripremljenim sintetičkim zapisom.
2. Portal mora jasno upozoriti kandidata da ne plaća bez kontakta sa agencijom.
3. Administrator i dalje može evidentirati stvarno primljenu zakašnjelu uplatu ili otkazati nalog i izdati novu verziju.

## Automatske provere

Iz direktorijuma `apps/platform` pokrenite:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Integracioni scenario dodatno proverava da administratorska ruta nije dostupna bez administratorske sesije. Migracija mora proći i na praznoj i na postojećoj bazi.
