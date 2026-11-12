// discounts.js
// Podaci o promocijama i popustima prema zvaničnom dokumentu Prilog br. 1
// Usklađeno sa pravilima:
// 1. Dve vrste popusta: oni koji se obračunavaju odmah i oni koji se obračunavaju na kraju (na poslednjoj rati)
// 2. Može se iskoristiti samo JEDAN popust, ali kandidat može promeniti popust u bilo kom trenutku
// 3. Afilijate: popust za svakog dovedenog se dobija samo ako on prođe viziranje i dobije posao
// 4. Grupni popust: dobija se samo ako preko 5+ članova grupe dobije vizu i posao

export const DEFAULT_PROMOTIONS = [
  {
    id: "family",
    number: 1,
    code: "FAMILY-50",
    name: "Family Discount",
    title: "Family popust",
    amount: 50,
    currency: "USD",
    timing: "end", // 'immediate' | 'end'
    timingLabel: "Obračunava se na kraju (poslednja rata)",
    description:
      "Kandidati koji dolaze iz iste porodice i finansiraju se iz istog budžeta, što podrazumeva da su krvni srodnici prvog kolena, mogu ostvariti Family Discount. Popust od $50 po Naručiocu usluga na poslednju ratu.",
    conditionType: "family",
    conditionText: "Krvni srodnici prvog kolena iz istog budžeta",
    active: true,
    isCustom: false,
  },
  {
    id: "group",
    number: 2,
    code: "GRUPNI-100",
    name: "Grupni popust (5+)",
    title: "Grupni popust",
    amount: 100,
    currency: "USD",
    timing: "end",
    timingLabel: "Obračunava se na kraju (poslednja rata)",
    description:
      "Za grupnu prijavu od najmanje 5 kandidata, grupa ostvaruje popust od $100 po prijavljenom kandidatu. Grupa se treba prijaviti istog dana. Popust se ostvaruje samo ako najmanje 5 članova grupe uspešno dobije vizu i posao.",
    conditionType: "group",
    minMembers: 5,
    conditionText: "Najmanje 5 članova grupe mora dobiti vizu i posao",
    active: true,
    isCustom: false,
  },
  {
    id: "adventure_club",
    number: 3,
    code: "CLUB-100",
    name: "Adventure Club Card popust",
    title: "Adventure Club kartica",
    amount: 100,
    currency: "USD",
    timing: "end",
    timingLabel: "Obračunava se na kraju (poslednja rata)",
    description:
      "Svaki nosilac kartice, raniji učesnik SWT programa American Adventure agencije, ostvaruje popust od $100 na Work and Travel program 2027 i taj popust se ostvaruje prilikom plaćanja poslednje rate.",
    conditionType: "club_card",
    conditionText: "Nosilac Adventure Club kartice (raniji učesnik SWT)",
    active: true,
    isCustom: false,
  },
  {
    id: "cashback",
    number: 4,
    code: "CASHBACK-100",
    name: "Cashback / Afilijate (Dovedi prijatelja)",
    title: "Dovedi prijatelja",
    amount: 100,
    currency: "USD",
    timing: "end",
    timingLabel: "Obračunava se na kraju (poslednja rata)",
    description:
      "Ukoliko prijavljeni kandidat prijavi svog prijatelja na program, cena programa će mu se umanjiti za $100 po prijatelju i taj popust se ostvaruje prilikom plaćanja poslednje rate. Popust se dobija samo ako dovedeni kandidat prođe viziranje i dobije posao.",
    conditionType: "affiliate",
    conditionText: "$100 po prijatelju koji dobije vizu i posao",
    active: true,
    isCustom: false,
  },
  {
    id: "pay_after_visa",
    number: 5,
    code: "PLATI-VIZA-20",
    name: "Plati do viziranja 20% a ostatak posle",
    title: "Plati 20% do vize, ostatak posle",
    amount: 0,
    currency: "USD",
    timing: "end",
    timingLabel: "Model plaćanja (posle viziranja)",
    description:
      "Ova ponuda je aktuelna do popunjavanja mesta. Kandidat potpisuje Ugovor i uplaćuje 20% od cene odabranog programa. Izaberi opciju A plaćanja programa.",
    conditionType: "none",
    conditionText: "Uplata 20% do vize, preostalih 80% nakon dobijanja vize",
    active: true,
    isCustom: false,
  },
  {
    id: "money_back_guarantee",
    number: 6,
    code: "REFUND-100",
    name: "Garancija povraćaja novca u slučaju odbijanja vize",
    title: "Novac nazad ako ne dobiješ vizu",
    amount: 0,
    currency: "USD",
    timing: "immediate",
    timingLabel: "Obračunava se odmah / Garancija",
    description:
      "Ukoliko kandidat ispunjava sve uslove programa predviđenim Ugovorom a bude odbijen za vizu - refundiramo sav uplaćeni novac u celosti.",
    conditionType: "none",
    conditionText: "100% refundacija uplaćenog novca ako viza bude odbijena",
    active: true,
    isCustom: false,
  },
  {
    id: "pay_when_earn",
    number: 7,
    code: "PLATI-KAD-ZARADIS",
    name: "Platiš kad zaradiš",
    title: "Platiš kad zaradiš",
    amount: 0,
    currency: "USD",
    timing: "end",
    timingLabel: "Obračunava se na kraju (po povratku)",
    description:
      "Ograničenom broju kandidata se odobrava da manji deo troškova programa plati pre odlaska na program, dok se veći deo plaća po dolasku sa programa a najkasnije do 12.10.2027. godine.",
    conditionType: "none",
    conditionText: "Veći deo troškova programa se plaća po povratku sa programa",
    active: true,
    isCustom: false,
  },
  {
    id: "pay_in_full_300",
    number: 8,
    code: "CELOST-300",
    name: "Isplati program odmah i osiguraj popust ($300)",
    title: "Isplati odmah, uštedi $300",
    amount: 300,
    currency: "USD",
    timing: "immediate",
    timingLabel: "Obračunava se odmah",
    description:
      "Isplatom troškova programa u celosti ostvarujete dodatni popust od $300. Odaberi opciju B za isplatu programa u Ugovoru o pružanju usluga.",
    conditionType: "none",
    conditionText: "Uplata celokupnog iznosa programa odjednom (Opcija B)",
    active: true,
    isCustom: false,
  },
  {
    id: "lifeguard_early_bird",
    number: 9,
    code: "LIFEGUARD-300",
    name: "Lifeguard Early Bird popust ($300)",
    title: "Lifeguard Early Bird",
    amount: 300,
    currency: "USD",
    timing: "immediate",
    timingLabel: "Obračunava se odmah",
    description:
      "Studenti koji se prijave i dobiju posao u toku trajanja akcije ili do popunjavanja kvote, ostvaruju pravo na popust u iznosu od $300.",
    conditionType: "none",
    conditionText: "Prijava i obezbeđen posao spasioca u toku trajanja akcije",
    active: true,
    isCustom: false,
  },
];

export const discountGroups = [
  {
    program: "Promocije Work and Travel 2027",
    notice:
      "Naručilac usluge može iskoristiti jednu od ponuđenih promocija i ne postoji opcija da se više promocija kombinuju. Može se koristiti samo jedan popust, a izabrani popust možete promeniti u bilo kom trenutku pre konačnog obračuna.",
    items: DEFAULT_PROMOTIONS.map((promo) => ({
      id: promo.id,
      title: promo.title,
      text: promo.description,
      amount: promo.amount,
      timing: promo.timing,
      timingLabel: promo.timingLabel,
      conditionText: promo.conditionText,
    })),
  },
  {
    program: "High School USA Program",
    items: [
      {
        id: "hs-early",
        title: "Early Bird popust — $300",
        text: "Đaci koji su se prijavili do 1.10.2026. dobijaju $300 popusta na cenu programa.",
        timing: "immediate",
        timingLabel: "Obračunava se odmah",
      },
      {
        id: "hs-installments",
        title: "Jednake mesečne rate do avgusta 2027",
        text: "Plaćanje na jednake mesečne rate — ranija prijava znači više rata.",
        timing: "end",
        timingLabel: "Model plaćanja na rate",
      },
    ],
  },
  {
    program: "Internship & Training USA Program",
    items: [
      {
        id: "intern-250",
        title: "Uplati samo $250 do viziranja",
        text: "Specijalan plan otplate za kandidate iz oblasti kulinarstva.",
        timing: "end",
        timingLabel: "Model plaćanja posle vize",
      },
      {
        id: "intern-50-50",
        title: "50/50 akcija",
        text: "Za Food & Beverage i Front Desk kandidate: pola troškova programa iz Srbije, pola iz USA.",
        timing: "end",
        timingLabel: "Podela troškova",
      },
    ],
  },
];

// „8 razloga da se prijaviš ranije" (srpski).
export const earlyReasons = [
  "Ranijom prijavom ostvaruješ razne popuste.",
  "Više vremena za prikupljanje potrebne dokumentacije.",
  "Veći izbor poslova.",
  "Mogućnost plaćanja programa na rate.",
  "Ranija kupovina avio-karte — ušteda do 200 EUR, zavisno od lokacije u USA.",
  "Vremena da usavršiš engleski pre početka programa.",
  "Na vreme obezbeđuješ termin za intervju u Ambasadi SAD u Beogradu.",
  "Osiguravaš učešće — broj mesta na svetskom nivou je ograničen.",
];
