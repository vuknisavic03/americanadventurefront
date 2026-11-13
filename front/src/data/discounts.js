// discounts.js
// Podaci o promocijama i popustima prema zvaničnom dokumentu Prilog br. 1
// Usklađeno sa pravilima:
// 1. Dve vrste popusta: oni koji se obračunavaju odmah i oni koji se obračunavaju na kraju (na poslednjoj rati)
// 2. Može se iskoristiti samo JEDAN popust, ali kandidat može promeniti popust u bilo kom trenutku
// 3. Afilijate: popust za svakog dovedenog se dobija samo ako on prođe viziranje i dobije posao
// 4. Grupni popust: dobija se samo ako preko 5+ članova grupe dobije vizu i posao

// Garancija nije promocija: važi za svakog kandidata, ne bira se i ne isključuje popuste.
export const VISA_GUARANTEE = {
  title: "Novac nazad ako ne dobiješ vizu",
  text: "Ako ispunjavaš sve uslove programa predviđene ugovorom, a ambasada odbije vizu, vraćamo ti sav uplaćeni novac za program.",
};

// Uklonjeni id-jevi (stari podaci u bazi ili localStorage-u ih mogu još sadržati).
export const RETIRED_PROMOTION_IDS = ["money_back_guarantee"];

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
    description: "Za braću i sestre, odnosno srodnike prvog kolena koji se finansiraju iz istog budžeta. Svako dobija 50 dolara popusta na poslednjoj rati.",
    conditionType: "family",
    conditionText: "Srodnici prvog kolena, isti budžet",
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
    description: "Za grupu od najmanje pet kandidata koji se prijave istog dana. Svako dobija 100 dolara popusta, ako najmanje pet članova grupe dobije vizu i posao.",
    conditionType: "group",
    minMembers: 5,
    conditionText: "Najmanje pet članova grupe dobije vizu i posao",
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
    description: "Za nosioce Adventure Club kartice, odnosno ranije učesnike Work and Travel programa preko naše agencije. Popust od 100 dolara na program 2027, na poslednjoj rati.",
    conditionType: "club_card",
    conditionText: "Nosilac Adventure Club kartice",
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
    description: "Za svakog prijatelja kog prijaviš, tvoj program je jeftiniji za 100 dolara. Popust se obračunava na poslednjoj rati, kad prijatelj dobije vizu i posao.",
    conditionType: "affiliate",
    conditionText: "100 dolara po prijatelju koji dobije vizu i posao",
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
    description: "Potpisuješ ugovor i uplaćuješ 20% cene paketa, a ostatak tek posle vize. U ugovoru biraš opciju A. Važi do popune mesta.",
    conditionType: "none",
    conditionText: "20% do vize, 80% posle",
    active: true,
    isCustom: false,
  },
  {
    id: "pay_when_earn",
    number: 6,
    code: "PLATI-KAD-ZARADIS",
    name: "Platiš kad zaradiš",
    title: "Platiš kad zaradiš",
    amount: 0,
    currency: "USD",
    timing: "end",
    timingLabel: "Obračunava se na kraju (po povratku)",
    description: "Ograničenom broju kandidata odobravamo da pre polaska plate manji deo programa, a veći deo po povratku, najkasnije do 12. 10. 2027.",
    conditionType: "none",
    conditionText: "Veći deo programa plaća se po povratku",
    active: true,
    isCustom: false,
  },
  {
    id: "pay_in_full_300",
    number: 7,
    code: "CELOST-300",
    name: "Isplati program odmah i osiguraj popust ($300)",
    title: "Isplati odmah, uštedi $300",
    amount: 300,
    currency: "USD",
    timing: "immediate",
    timingLabel: "Obračunava se odmah",
    description: "Ako ceo program platiš odjednom, dobijaš 300 dolara popusta. U ugovoru biraš opciju B.",
    conditionType: "none",
    conditionText: "Uplata celog iznosa odjednom",
    active: true,
    isCustom: false,
  },
  {
    id: "lifeguard_early_bird",
    number: 8,
    code: "LIFEGUARD-300",
    name: "Lifeguard Early Bird popust ($300)",
    title: "Lifeguard Early Bird",
    amount: 300,
    currency: "USD",
    timing: "immediate",
    timingLabel: "Obračunava se odmah",
    description: "Za studente koji se prijave i dobiju posao spasioca dok akcija traje, odnosno do popune kvote.",
    conditionType: "none",
    conditionText: "Posao spasioca dobijen tokom akcije",
    active: true,
    isCustom: false,
  },
];

export const discountGroups = [
  {
    program: "Work and Travel 2027",
    notice:
      "Koristiš jednu pogodnost po prijavi. Pogodnosti se ne sabiraju, a izbor možeš da promeniš do konačnog obračuna.",
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
    program: "High School USA",
    items: [
      {
        id: "hs-installments",
        title: "Mesečne rate do avgusta 2027",
        text: "Program se plaća u jednakim mesečnim ratama. Što se ranije prijaviš, rate su manje.",
        timing: "end",
        timingLabel: "Model plaćanja na rate",
      },
    ],
  },
  {
    program: "Internship i Training",
    items: [
      {
        id: "intern-250",
        title: "Uplati samo $250 do viziranja",
        text: "Za kandidate iz kulinarstva: do vize uplaćuješ samo 250 dolara.",
        timing: "end",
        timingLabel: "Model plaćanja posle vize",
      },
      {
        id: "intern-50-50",
        title: "50/50 akcija",
        text: "Za pozicije u restoranu i na recepciji: pola troškova plaćaš iz Srbije, pola iz Amerike.",
        timing: "end",
        timingLabel: "Podela troškova",
      },
    ],
  },
];

// „8 razloga da se prijaviš ranije" (srpski).
export const earlyReasons = [
  "Ranija prijava donosi više pogodnosti.",
  "Imaš više vremena za dokumenta.",
  "Biraš između više poslova.",
  "Program plaćaš u više rata.",
  "Ranije kupljena avio karta je jeftinija, i do 200 evra.",
  "Imaš vremena da popraviš engleski.",
  "Na vreme dobijaš termin u ambasadi.",
  "Sigurno mesto, jer je broj učesnika ograničen na nivou celog sveta.",
]
