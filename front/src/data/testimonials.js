// Iskustva studenata — podaci.
// Strukturne labele (Agencija/Lokacija/Poslodavac) idu kroz prevod (exp.*).
// Tekst utiska je lokalizovan po jeziku (text: { EN, SR, HR, MK, BS }) — komponenta
// bira jezik prema izabranom u UI-ju. Backend kasnije servira iste iz baze.
const testimonials = [
  {
    name: "Aleksandar Dujaković",
    employer: "Hanson Enterprises",
    place: "Ogunquit, Maine",
    aspects: [
      {
        key: "exp.agency",
        text: {
          EN: "Everything correct — all the info on time.",
          SR: "Sve korektno — sve informacije na vreme.",
          HR: "Sve korektno — sve informacije na vrijeme.",
          MK: "Se korektno — site informacii navreme.",
          BS: "Sve korektno — sve informacije na vrijeme.",
        },
      },
      {
        key: "exp.location",
        text: {
          EN: "A lovely little coastal town with a nice beach and great restaurants.",
          SR: "Prelep gradić na obali, sa lepom plažom i dobrim restoranima.",
          HR: "Prekrasan gradić na obali, s lijepom plažom i dobrim restoranima.",
          MK: "Prekrasno gratče na krajbrežjeto, so ubava plaža i dobri restorani.",
          BS: "Prekrasan gradić na obali, s lijepom plažom i dobrim restoranima.",
        },
      },
      {
        key: "exp.employer",
        text: {
          EN: "Great accommodation, pay on time, everything in the contract honored.",
          SR: "Odličan smeštaj, plate na vreme, sve iz ugovora ispoštovano.",
          HR: "Odličan smještaj, plaće na vrijeme, sve iz ugovora ispoštovano.",
          MK: "Odlično smestuvanje, platite navreme, se od dogovorot ispoštuvano.",
          BS: "Odličan smještaj, plate na vrijeme, sve iz ugovora ispoštovano.",
        },
      },
    ],
  },
  {
    name: "Nemanja",
    employer: "Village Tavern Restaurant & Inn",
    place: "Hammondsport, New York",
    aspects: [
      {
        key: "exp.agency",
        text: {
          EN: "Everything great — cooperation, communication, lovely people!",
          SR: "Sve super — saradnja, komunikacija i divni ljudi!",
          HR: "Sve super — suradnja, komunikacija i divni ljudi!",
          MK: "Se super — sorabotka, komunikacija i prekrasni lugje!",
          BS: "Sve super — saradnja, komunikacija i divni ljudi!",
        },
      },
      {
        key: "exp.location",
        text: {
          EN: "A town of 700 on Lake Keuka — quiet, with vineyards, breweries and a clean lake.",
          SR: "Mestašce od 700 ljudi na jezeru Keuka — mirno, vinogradi, pivare i čisto jezero.",
          HR: "Mjestašce od 700 ljudi na jezeru Keuka — mirno, vinogradi, pivovare i čisto jezero.",
          MK: "Mesto od 700 lugje na ezeroto Keuka — mirno, lozja, pivarnici i čisto ezero.",
          BS: "Mjestašce od 700 ljudi na jezeru Keuka — mirno, vinogradi, pivare i čisto jezero.",
        },
      },
      {
        key: "exp.employer",
        text: {
          EN: "Fair conditions; work is valued and everything can be arranged. The owners have 30+ years in the business, and great accommodation goes through them too.",
          SR: "Korektni uslovi; rad se ceni i sve se dogovara. Poslodavci su u poslu preko 30 godina, a kroz njih ide i odličan smeštaj.",
          HR: "Korektni uvjeti; rad se cijeni i sve se dogovara. Vlasnici su u poslu preko 30 godina, a kroz njih ide i odličan smještaj.",
          MK: "Korektni uslovi; rabotata se ceni i se dogovara. Sopstvenicite se vo biznisot nad 30 godini, a preku niv ide i odlično smestuvanje.",
          BS: "Korektni uvjeti; rad se cijeni i sve se dogovara. Vlasnici su u poslu preko 30 godina, a kroz njih ide i odličan smještaj.",
        },
      },
    ],
  },
  {
    name: "Jelena",
    employer: "Surf Hotel",
    place: "Block Island, Rhode Island",
    aspects: [
      {
        key: "exp.agency",
        text: {
          EN: "The whole process went smoothly, in a friendly atmosphere.",
          SR: "Cela procedura prošla glatko, u prijatnoj atmosferi.",
          HR: "Cijeli postupak prošao glatko, u ugodnoj atmosferi.",
          MK: "Celata procedura mina glatko, vo prijatna atmosfera.",
          BS: "Cijeli postupak prošao glatko, u ugodnoj atmosferi.",
        },
      },
      {
        key: "exp.location",
        text: {
          EN: "The island is stunning; they welcomed us like family, with accommodation right across from work on the ocean shore.",
          SR: "Ostrvo je neverovatno lepo; primili su nas kao porodicu, smeštaj preko puta posla na obali okeana.",
          HR: "Otok je nevjerojatno lijep; primili su nas kao obitelj, smještaj preko puta posla na obali oceana.",
          MK: "Ostrovot e neverojatno ubav; ne primija kako semejstvo, smestuvanje preku pat od rabotata na okeanskiot breg.",
          BS: "Otok je nevjerovatno lijep; primili su nas kao porodicu, smještaj preko puta posla na obali oceana.",
        },
      },
      {
        key: "exp.employer",
        text: {
          EN: "$6/h plus tips (~$5/h), 80–85h a week. Long days, but only if you want — nobody forces you.",
          SR: "6$/h + napojnice (~5$/h), 80–85h nedeljno. Dugi dani, ali samo ako želiš — niko te ne tera.",
          HR: "6$/h plus napojnice (~5$/h), 80–85h tjedno. Dugi dani, ali samo ako želiš — nitko te ne tjera.",
          MK: "6$/h plus bakšiš (~5$/h), 80–85h nedelno. Dolgi denovi, no samo ako sakaš — nikoj ne te tera.",
          BS: "6$/h plus napojnice (~5$/h), 80–85h sedmično. Dugi dani, ali samo ako želiš — niko te ne tjera.",
        },
      },
    ],
  },
];

export default testimonials;
