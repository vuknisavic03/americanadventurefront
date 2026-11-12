// front/src/data/candidateStore/mockSeed.js
// Zvanični paketi programa agencije (bez mock kandidata i pozivnica — sistem kreće čisto)

export const PROGRAM_PACKAGES = [
  {
    id: "swt-full",
    name: "Work & Travel USA — Full Placement",
    desc: "Agencija obezbeđuje proverenog poslodavca, smeštaj i DS-2019.",
    basePrice: 1850,
  },
  {
    id: "swt-self",
    name: "Work & Travel USA — Self Placement",
    desc: "Kandidat ima sopstvenu radnu ponudu (Job Offer); agencija vodi vizu i sponzorstvo.",
    basePrice: 1350,
  },
  {
    id: "swt-lifeguard",
    name: "Lifeguards SWT Summer 2026",
    desc: "Besplatna obuka za spasioce, obezbeđen posao na bazenima i visoka satnica.",
    basePrice: 1650,
  },
  {
    id: "camp-usa",
    name: "Camp Counselor USA 2026",
    desc: "Rad u letnjim kampovima sa decom; obezbeđen pun pansion i džeparac.",
    basePrice: 1100,
  },
];

export const INITIAL_INVITATIONS = [];

export const INITIAL_CANDIDATES = [];
