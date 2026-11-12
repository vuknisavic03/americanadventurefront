export const CONTRACT_ACCEPTANCE_STATEMENT_VERSION = '2.0'

export function contractAcceptanceStatement(contractNumber: string) {
  return `Potvrđujem da sam pročitao/la ugovor broj ${contractNumber}, da razumem njegov sadržaj i da ga prihvatam.`
}

/**
 * 15 zvaničnih tačaka iz agencijskog dokumenta "Izjava o odgovornosti 2027.pdf"
 */
export const RESPONSIBILITY_STATEMENT_2027_POINTS = [
  'Upoznat/a sam sa svim uslovima Ugovora o pružanju usluga i u potpunosti prihvatam sva prava i obaveze definisane u Ugovoru;',
  'Svu potrebnu dokumentaciju dostaviću na vreme i sve uplate izvršiću u tačno predviđenim rokovima;',
  'Svestan/a sam da sve informacije o W&T programu stižu na moju ličnu e-mail adresu i odgovoran/a sam da je proveravam svakodnevno;',
  'American Adventure d.o.o. je posrednik između mene i Sponzorske agencije (Intrax/CCUSA) i poslodavca iz SAD, a Sponzorska agencija je odgovorna za mene tokom boravka u SAD;',
  'Odgovoran/a sam za svoje ponašanje u Sjedinjenim Američkim Državama;',
  'Odgovoran/a sam za pronalazak smeštaja u SAD, troškove hrane i transporta, osim ako radnom ponudom nije drugačije definisano;',
  'U slučaju problema sa poslom ili programom kontaktiraću isključivo ovlašćenu Sponzorsku agenciju u SAD;',
  'Ukoliko pronađem drugog poslodavca, nemam pravo da radim dok Sponzorska agencija ne odobri novi radni plasman;',
  'Poštovaću sve važeće savezne i lokalne zakone SAD;',
  'U skladu sa SEVIS propisima, imam obavezu da u roku od 72 sata od ulaska u SAD prijavim adresu stanovanja i svaku promenu adrese u roku od 7 dana;',
  'Dužan/a sam da jednom mesečno podnosim obavezni mesečni izveštaj (monthly check-in) Sponzorskoj agenciji;',
  'Radni deo programa definisan je DS-2019 obrascem. Po isteku krajnjeg datuma imam najviše 30 dana grejs perioda za povratak (najkasnije do 1. oktobra);',
  'Svestan/a sam da boravak preko dozvoljenog roka povlači hapšenje, deportaciju i zabranu ulaska u SAD do 10 godina;',
  'Tokom radnog dela programa pokriven/a sam zdravstvenim osiguranjem i dužan/a sam da platim i refundiram sve medicinske troškove pre napuštanja SAD;',
  'Dužan/a sam da plaćam poreze tokom rada u SAD i imam pravo na podnošenje zahteva za povraćaj poreza (tax refund) nakon kalendarske godine.',
] as const

/**
 * Zvanična pravila i saglasnost iz dokumenta "Saglasnost_Važne informacije SWT USA 2027.pdf"
 */
export const SPONSOR_CONSENT_2027_POINTS = [
  'Potvrđujem da je Summer Work and Travel (SWT) USA program međunarodne kulturne razmene pod okriljem US Department of State, a ne isključivo radni ili ekonomski program;',
  'Upoznat/a sam sa ulogom agencije American Adventure kao posrednika i odgovornošću sponzora (Intrax / CCUSA) i poslodavca u SAD;',
  'Upoznat/a sam sa obavezom da svi profili na društvenim mrežama budu otključani i javno dostupni pre intervjua za vizu;',
  'Upoznat/a sam sa uslovima otkaza, refunda i zadržavanja troškova u skladu sa ugovorom i pravilima sponzora.',
] as const

export function responsibilityStatement(candidateName: string, personalId: string) {
  return `Ja, ${candidateName}, JMBG: ${personalId}, pod punom materijalnom i moralnom odgovornošću izjavljujem da sam u celosti upoznat/a sa svih 15 pravila i obaveza W&T programa za sezonu 2027 i da ih bezuslovno prihvatam.`
}

export function sponsorConsentStatement(candidateName: string) {
  return `Ja, ${candidateName}, potvrđujem da sam upoznat/a sa svim važnim informacijama i pravilima kulturne razmene SWT USA 2027 i dajem punu saglasnost za učešće u programu.`
}

