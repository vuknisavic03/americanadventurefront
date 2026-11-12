// Vesti — podaci.
// Tekstovi su napisani za novi sajt na osnovu objava sa workandtravel.rs (stanje: novembar 2026).
// Naslov, sažetak i telo mogu biti string/niz (samo SR) ili objekat po jezicima ({ SR, EN, … }).
// `image`: putanja do fotografije; dok je nema, prikazuje se podloga sa ikonicom po `theme`
// (plane | document | school).
const news = [
  {
    slug: "high-school-usa-2027-28-prijave",
    category: "High School USA",
    date: "15.09.2026.",
    image: null,
    theme: "school",
    title: "High School USA 2027/28: prijave su otvorene",
    excerpt:
      "Polugodište ili cela školska godina u američkoj državnoj školi, uz život u porodici domaćinu. Rok za prijavu je 31. mart 2027, a ko se prijavi ranije ima više mesečnih rata.",
    body: {
      SR: [
        "Otvorene su prijave za školsku 2027/28. godinu. Učenik pohađa američku državnu srednju školu i živi u proverenoj porodici domaćinu, a lokalni koordinator je tu tokom celog boravka.",
        "Mogu da se prijave učenici od 14,5 do 18,5 godina koji su engleski učili najmanje tri godine i imaju prosek iznad 3. Program za celu godinu košta 9.400 dolara, a za polugodište 8.400 dolara, uz 95 dolara za prijavu. U cenu ulaze nastava, smeštaj i ishrana u porodici. Osiguranje, viza i avio karta plaćaju se posebno.",
        "Prvi korak je informativni razgovor sa učenikom i jednim roditeljem. Traženje porodice traje od tri nedelje do nekoliko meseci, pa je bolje ne čekati rok. Plaćanje ide u ratama do avgusta 2027.",
      ],
    },
  },
  {
    slug: "work-and-travel-2027-prijave",
    category: "Work and Travel",
    date: "01.09.2026.",
    image: null,
    theme: "plane",
    title: "Work and Travel USA 2027: prijave su u toku",
    excerpt:
      "Počela je nova sezona. Ko se prijavi ranije bira između više poslova, plaća na više rata i obično kupuje jeftiniju avio kartu.",
    body: {
      SR: [
        "Prijave za leto 2027. su otvorene za redovne studente od 19 do 26 godina. Broj učesnika je ograničen na nivou celog programa, pa se mesta popunjavaju kako sezona odmiče.",
        "Biraš između tri paketa. U Full paketu posao i smeštaj obezbeđujemo mi. U Self paketu posao nalaziš sam. Lifeguard paket vodi na bazene u okolini Vašingtona, Baltimora i Bostona, gde su satnice od 16 do 18,75 dolara.",
        "Za Lifeguard paket trenutno važi popust od 300 dolara, uz bonus do 500 dolara za one koji počnu da rade do 23. maja. Ko isplati program odjednom štedi do 300 dolara, a ograničen broj studenata može da plati veći deo programa tek kada zaradi.",
        "Ako nisi siguran da li ispunjavaš uslove, popuni prijavu i javićemo ti se sa procenom.",
      ],
    },
  },
  {
    slug: "sta-je-zapravo-work-and-travel",
    category: "Vodič",
    date: "01.09.2026.",
    image: null,
    theme: "document",
    title: "Šta je zapravo Work and Travel, koliko košta i koliko se zaradi",
    excerpt:
      "Program nije letovanje i nije garancija zarade. Evo šta dobijaš, šta plaćaš i na šta da računaš pre nego što se prijaviš.",
    body: {
      SR: [
        "Work and Travel je program kulturne razmene pod nadzorom američkog Stejt departmenta. Namenjen je redovnim studentima, a rad je dozvoljen od 21. maja do 10. oktobra, najviše četiri meseca. Posle toga imaš još 30 dana za putovanje.",
        "Cena programa za 2027. kreće se od 1.875 dolara za Self paket do 2.275 dolara za Full paket. U cenu ulaze obrazac DS-2019, SEVIS taksa, zdravstveno osiguranje i priprema za intervjue. Posebno plaćaš vizu (185 dolara), avio kartu i smeštaj, koji najčešće košta od 50 do 200 dolara nedeljno.",
        "Satnice su uglavnom od 10 do 20 dolara. Sa 40 sati nedeljno i satnicom od 12 dolara to je oko 480 dolara nedeljno pre poreza. Prekovremeni sati plaćaju se 50% više, a na nekim pozicijama veliki deo zarade čine napojnice. Broj sati zavisi od poslodavca i sezone i niko ne može da ga garantuje.",
        "Poslovi su sezonski i jednostavni: restorani, hoteli, prodavnice, zabavni parkovi, bazeni. Nalaze se u turističkim mestima, retko u centrima velikih gradova. Uspeh na fakultetu utiče na odluku ambasade, pa ispite vredi položiti na vreme.",
      ],
    },
  },
  {
    slug: "hospitality-trainee-usa",
    category: "Internship & Training",
    date: "06.10.2025.",
    image: null,
    theme: "document",
    title: "Hospitality Trainee: godinu dana u američkom ugostiteljstvu",
    excerpt:
      "Program za diplomce sa najmanje godinu dana iskustva u ugostiteljstvu. Pozicije su u restoranu, kuhinji i na recepciji, na više od 30 lokacija.",
    body: {
      SR: [
        "Hospitality Trainee je dvanaestomesečni program na J-1 vizi za one koji su završili fakultet ili višu školu i imaju bar godinu dana iskustva u ugostiteljstvu.",
        "Radi se u restoranu, kuhinji, na recepciji ili u domaćinstvu hotela. Među lokacijama su Mineapolis, Lejk Taho, Majami, Orlando, Denver i Nešvil.",
        "Cena programa je 2.995 dolara. Za kandidate iz kulinarstva postoji mogućnost da do viziranja plate 250 dolara, a za pozicije u restoranu i na recepciji polovina troškova može da se plati iz Srbije, a polovina iz SAD.",
      ],
    },
  },
  {
    slug: "dual-diploma-online",
    category: "Dual Diploma",
    date: "15.11.2023.",
    image: null,
    theme: "school",
    title: "Dual Diploma: američka srednja škola bez odlaska iz Srbije",
    excerpt:
      "Šest online predmeta u američkoj školi, sopstvenim tempom, uz redovnu školu kod kuće. Na kraju učenik ima dve diplome.",
    body: {
      SR: [
        "Dual Diploma je program za srednjoškolce koji žele američku diplomu, a ne žele ili ne mogu da odu na godinu dana u SAD. Nastava je potpuno online i uči se kada učeniku odgovara.",
        "Za diplomu je potrebno šest predmeta. Engleski i istorija SAD su obavezni, a ostale učenik bira. Program traje od jedne do četiri godine, najčešće dve ili tri. Po jednom predmetu treba izdvojiti oko dva i po sata nedeljno.",
        "Škole partneri su Thornton Academy i Washington Academy u Mejnu i Wayland Academy u Viskonsinu. Program vodi Educatius Academy, a uz nastavu ide i savetovanje za upis na američke fakultete.",
      ],
    },
  },
];

export default news;
