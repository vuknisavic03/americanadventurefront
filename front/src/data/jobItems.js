// jobItems.js
// Demo lista predloženih poslova koje agencija (admin) ubacuje za studenta.
// Sadržaj je placeholder za demo — backend kasnije servira prave ponude.
// UI labela (Satnica, Smeštaj, ...) ide preko prevoda; sadržaj ponude je podatak.
//
// Slike: picsum.photos sa fiksnim seed-om (stabilne po poslu). Ako se ne učitaju,
// JobImage prikazuje brendirani placeholder (vidi Dashboard.jsx).

const img = (seed) => `https://picsum.photos/seed/${seed}/900/600`;

const jobItems = [
  {
    id: "lifeguard-oc",
    title: "Spasilac na bazenu",
    employer: "Ocean Breeze Resort",
    category: "Bazen / Spasilačka služba",
    city: "Ocean City, Maryland",
    wage: "$16.00 / sat",
    hoursPerWeek: "35–40 h",
    housing: "Obezbeđen smeštaj — $130/ned",
    period: "jun – septembar",
    tips: "Bakšiš nije tipičan",
    images: [img("aa-lifeguard-1"), img("aa-lifeguard-2"), img("aa-lifeguard-3")],
    summary: "Nadzor bazenskog kompleksa popularnog letovališta na obali Atlantika.",
    description:
      "Radićeš kao spasilac na velikom bazenskom kompleksu resorta uz samu plažu. Posao podrazumeva stalni nadzor kupača, održavanje reda i sigurnosti, kao i osnovno održavanje čistoće oko bazena. Poslodavac obezbeđuje obuku i sertifikaciju po dolasku, pa prethodno iskustvo nije obavezno — ali je poznavanje plivanja uslov. Resort se nalazi na svega 10 minuta hoda od smeštaja.",
    duties: [
      "Nadzor kupača i reagovanje u hitnim situacijama",
      "Provera i beleženje kvaliteta vode (hlor, pH)",
      "Održavanje čistoće oko bazena i ležaljki",
      "Komunikacija sa gostima i pružanje informacija",
    ],
  },
  {
    id: "housekeeping-tahoe",
    title: "Sobarica / Housekeeping",
    employer: "Tahoe Pines Lodge",
    category: "Hotel / Domaćinstvo",
    city: "South Lake Tahoe, Kalifornija",
    wage: "$17.50 / sat",
    hoursPerWeek: "32–40 h",
    housing: "Obezbeđen smeštaj — $110/ned",
    period: "jun – oktobar",
    tips: "Mogući bakšiš od gostiju",
    images: [img("aa-house-1"), img("aa-house-2"), img("aa-house-3")],
    summary: "Priprema i čišćenje soba u planinskom lodge-u kraj jezera Tahoe.",
    description:
      "Planinski lodge na obali čuvenog jezera Tahoe traži članove housekeeping tima. Zaduženja uključuju čišćenje i pripremu soba između gostiju, zamenu posteljine i peškira, dopunjavanje potrepština i prijavljivanje kvarova recepciji. Tempo je dinamičan, naročito vikendom, ali tim je mlad i internacionalan. Idealno za one koji vole prirodu — planinarenje i jezero su nadohvat ruke.",
    duties: [
      "Čišćenje i priprema soba po standardu hotela",
      "Zamena posteljine, peškira i potrošnog materijala",
      "Prijava kvarova i nedostataka recepciji",
      "Vođenje evidencije o očišćenim sobama",
    ],
  },
  {
    id: "linecook-yellowstone",
    title: "Pomoćnik u kuhinji",
    employer: "Canyon Grill House",
    category: "Restoran / Kuhinja",
    city: "West Yellowstone, Montana",
    wage: "$15.50 / sat",
    hoursPerWeek: "30–40 h",
    housing: "Obezbeđen smeštaj — $95/ned",
    period: "maj – septembar",
    tips: "Podela bakšiša (tip pool)",
    images: [img("aa-cook-1"), img("aa-cook-2"), img("aa-cook-3")],
    summary: "Priprema namirnica i pomoć kuvarima u restoranu na ulazu u Yellowstone.",
    description:
      "Restoran na samom ulazu u nacionalni park Yellowstone traži pomoćnike u kuhinji. Radićeš rame uz rame sa iskusnim kuvarima na pripremi namirnica, jednostavnih jela i održavanju higijene radnog prostora. Posao je odličan za sticanje iskustva u ugostiteljstvu; lokacija je savršena za istraživanje jednog od najlepših parkova u SAD u slobodno vreme.",
    duties: [
      "Priprema i obrada namirnica (mise en place)",
      "Pomoć na liniji tokom servisa",
      "Pranje i održavanje kuhinjskog pribora",
      "Poštovanje HACCP standarda higijene",
    ],
  },
  {
    id: "retail-myrtle",
    title: "Prodavac u prodavnici suvenira",
    employer: "Beachside Gifts & Co.",
    category: "Maloprodaja",
    city: "Myrtle Beach, Južna Karolina",
    wage: "$14.50 / sat",
    hoursPerWeek: "32–40 h",
    housing: "Pomoć pri pronalasku smeštaja",
    period: "jun – septembar",
    tips: "Bakšiš nije tipičan",
    images: [img("aa-retail-1"), img("aa-retail-2"), img("aa-retail-3")],
    summary: "Rad sa kupcima i na kasi u prodavnici suvenira na šetalištu.",
    description:
      "Živahna prodavnica suvenira na čuvenom šetalištu Myrtle Beach-a traži ljubazne prodavce. Posao uključuje rad na kasi, izlaganje robe, pomoć kupcima i održavanje urednosti prodajnog prostora. Idealno za komunikativne osobe koje žele da vežbaju engleski u direktnom kontaktu sa gostima. Lokacija je u srcu turističke zone, na par koraka od plaže.",
    duties: [
      "Rad na kasi i naplata",
      "Savetovanje i pomoć kupcima",
      "Izlaganje i dopunjavanje robe",
      "Održavanje urednosti prodavnice",
    ],
  },
  {
    id: "server-orlando",
    title: "Konobar / Posluga hrane i pića",
    employer: "Sunshine Park Eats",
    category: "Zabavni park / Ugostiteljstvo",
    city: "Orlando, Florida",
    wage: "$13.00 / sat + bakšiš",
    hoursPerWeek: "35–40 h",
    housing: "Obezbeđen smeštaj — $140/ned",
    period: "maj – oktobar",
    tips: "Izdašan bakšiš",
    images: [img("aa-server-1"), img("aa-server-2"), img("aa-server-3")],
    summary: "Posluživanje gostiju u ugostiteljskim objektima zabavnog parka.",
    description:
      "Jedan od najpoznatijih zabavnih parkova u Orlandu traži članove tima za poslugu hrane i pića. Radićeš u dinamičnom okruženju punom gostiju iz celog sveta — primaćeš porudžbine, posluživati hranu i piće i brinuti o doživljaju gostiju. Uz osnovnu satnicu ide i bakšiš, što ovu poziciju čini jednom od finansijski najisplativijih. Park nudi i pogodnosti za zaposlene.",
    duties: [
      "Primanje porudžbina i posluživanje gostiju",
      "Rad na POS kasi",
      "Priprema radnog mesta i dopuna zaliha",
      "Briga o čistoći i doživljaju gostiju",
    ],
  },
  {
    id: "frontdesk-virginia",
    title: "Recepcioner",
    employer: "Atlantic View Hotel",
    category: "Hotel / Recepcija",
    city: "Virginia Beach, Virdžinija",
    wage: "$16.50 / sat",
    hoursPerWeek: "32–40 h",
    housing: "Obezbeđen smeštaj — $125/ned",
    period: "jun – septembar",
    tips: "Bakšiš nije tipičan",
    images: [img("aa-front-1"), img("aa-front-2"), img("aa-front-3")],
    summary: "Prijava gostiju i pomoć na recepciji hotela uz okean.",
    description:
      "Hotel uz samu obalu okeana u Virginia Beach-u traži recepcionere za letnju sezonu. Posao podrazumeva prijavu i odjavu gostiju, davanje informacija, primanje rezervacija telefonom i osnovnu administraciju. Pozicija je odlična za usavršavanje engleskog jezika i veština komunikacije, jer si prva tačka kontakta sa gostima. Prednost imaju studenti sa dobrim poznavanjem engleskog.",
    duties: [
      "Prijava i odjava gostiju (check-in / check-out)",
      "Davanje informacija i pomoć gostima",
      "Primanje rezervacija i poziva",
      "Osnovna administracija i naplata",
    ],
  },
];

export default jobItems;
