// Vesti — podaci.
// Naslov / sažetak / telo su lokalizovani ({ EN, SR, HR, MK, BS }); kategorija i
// datum su neutralni podaci. `image` je URL ili putanja do fotke; ako se ne učita,
// prikazuje se brendirani placeholder po `theme`. `body` je niz pasusa po jeziku.
//
// Trenutne slike su generičke (Lorem Picsum) — zameni ih pravim fotkama tako što
// promeniš `image` (npr. /images/news/work-and-travel-2025.jpg).
const news = [
  {
    slug: "osvoji-kartu-za-ameriku-2025",
    category: "Work and Travel",
    date: "15.04.2025.",
    image: "https://picsum.photos/seed/americanadventure-wat/1280/720",
    theme: "plane",
    title: {
      EN: "Win a ticket to America – Work and Travel USA 2025",
      SR: "Osvoji kartu za Ameriku – Work and Travel USA 2025",
      HR: "Osvoji kartu za Ameriku – Work and Travel USA 2025",
      MK: "Osvoj karta za Amerika – Work and Travel USA 2025",
      BS: "Osvoji kartu za Ameriku – Work and Travel USA 2025",
    },
    excerpt: {
      EN: "Pack your bags — an American summer awaits! With Work and Travel USA 2025 you work, travel and meet people from all over the world, and we're with you every step of the way. Apply on time to secure the best positions and discounts.",
      SR: "Spakuj kofere — leto u Americi te čeka! Uz Work and Travel USA 2025 radiš, putuješ i upoznaješ ljude iz celog sveta, a mi smo tu na svakom koraku. Prijavi se na vreme i obezbedi najbolje pozicije i popuste.",
      HR: "Spakiraj kofere — ljeto u Americi te čeka! Uz Work and Travel USA 2025 radiš, putuješ i upoznaješ ljude iz cijelog svijeta, a mi smo uz tebe na svakom koraku. Prijavi se na vrijeme i osiguraj najbolje pozicije i popuste.",
      MK: "Spakuvaj gi kuferite — leto vo Amerika te čeka! So Work and Travel USA 2025 rabotiš, patuvaš i zapoznavaš lugje od cel svet, a nie sme so tebe na sekoj čekor. Prijavi se navreme i obezbedi gi najdobrite pozicii i popusti.",
      BS: "Spakuj kofere — ljeto u Americi te čeka! Uz Work and Travel USA 2025 radiš, putuješ i upoznaješ ljude iz cijelog svijeta, a mi smo uz tebe na svakom koraku. Prijavi se na vrijeme i osiguraj najbolje pozicije i popuste.",
    },
    body: {
      EN: [
        "Work and Travel USA is a cultural exchange program that lets students legally work and travel across the United States during their summer break. It's a chance to earn money, improve your English and gain experience you'll remember for life.",
        "As a participant you get a J-1 visa, a job with a vetted employer and our agency's support from application to return. We help you with the paperwork, embassy interview prep and finding accommodation.",
        "Spots are limited, and the best positions and discounts go to those who apply first. Apply on time, win your ticket to America and start the adventure with American Adventure.",
      ],
      SR: [
        "Work and Travel USA je program kulturne razmene koji studentima omogućava da tokom letnjeg raspusta legalno rade i putuju po Sjedinjenim Američkim Državama. To je prilika da zaradiš, usavršiš engleski i stekneš iskustvo koje se pamti ceo život.",
        "Kao učesnik dobijaš J-1 vizu, posao kod proverenog poslodavca i podršku naše agencije od prijave do povratka. Pomažemo ti oko dokumentacije, pripreme za intervju u ambasadi i pronalaska smeštaja.",
        "Broj mesta je ograničen, a najbolje pozicije i popusti odlaze prvima. Prijavi se na vreme, osvoji svoju kartu za Ameriku i započni avanturu uz American Adventure.",
      ],
      HR: [
        "Work and Travel USA je program kulturne razmjene koji studentima omogućuje da tijekom ljetnih praznika legalno rade i putuju po Sjedinjenim Američkim Državama. To je prilika da zaradiš, usavršiš engleski i stekneš iskustvo koje pamtiš cijeli život.",
        "Kao sudionik dobivaš J-1 vizu, posao kod provjerenog poslodavca i podršku naše agencije od prijave do povratka. Pomažemo ti oko dokumentacije, pripreme za intervju u veleposlanstvu i pronalaska smještaja.",
        "Broj mjesta je ograničen, a najbolje pozicije i popusti odlaze prvima. Prijavi se na vrijeme, osvoji svoju kartu za Ameriku i započni avanturu uz American Adventure.",
      ],
      MK: [
        "Work and Travel USA e programa za kulturna razmena što im ovozmožuva na studentite za vreme na letniot raspust legalno da rabotat i patuvaat niz Soedinetite Amerikanski Državi. Toa e prilika da zarabotiš, da go usovršiš angliskiot i da stekneš iskustvo što se pamti cel život.",
        "Kako učesnik dobivaš J-1 viza, rabota kaj proveren rabotodavec i poddrška od našata agencija od prijava do vrakanje. Ti pomagame okolu dokumentacijata, podgotovkata za intervju vo ambasadata i pronaogjanje smestuvanje.",
        "Brojot na mesta e ograničen, a najdobrite pozicii i popusti odat kaj prvite. Prijavi se navreme, osvoj ja svojata karta za Amerika i započni ja avanturata so American Adventure.",
      ],
      BS: [
        "Work and Travel USA je program kulturne razmjene koji studentima omogućava da tokom ljetnog raspusta legalno rade i putuju po Sjedinjenim Američkim Državama. To je prilika da zaradiš, usavršiš engleski i stekneš iskustvo koje se pamti cijeli život.",
        "Kao učesnik dobijaš J-1 vizu, posao kod provjerenog poslodavca i podršku naše agencije od prijave do povratka. Pomažemo ti oko dokumentacije, pripreme za intervju u ambasadi i pronalaska smještaja.",
        "Broj mjesta je ograničen, a najbolje pozicije i popusti odlaze prvima. Prijavi se na vrijeme, osvoji svoju kartu za Ameriku i započni avanturu uz American Adventure.",
      ],
    },
  },
  {
    slug: "istina-o-work-and-travel-programu",
    category: "Work and Travel",
    date: "28.03.2025.",
    image: "https://picsum.photos/seed/americanadventure-truth/1280/720",
    theme: "document",
    title: {
      EN: "The truth about the Work and Travel USA program",
      SR: "Istina o Work and Travel USA programu",
      HR: "Istina o Work and Travel USA programu",
      MK: "Vistinata za Work and Travel USA programot",
      BS: "Istina o Work and Travel USA programu",
    },
    excerpt: {
      EN: "A lot is said, but little is truly known. We bust the most common myths about the Work and Travel program and explain how the application, visa, job and life in America really look. No fine print — just verified, first-hand information.",
      SR: "Mnogo se priča, a malo zna. Razbijamo najčešće mitove o Work and Travel programu i objašnjavamo kako zaista izgledaju prijava, viza, posao i život u Americi. Bez sitnih slova — samo proverene informacije iz prve ruke.",
      HR: "Mnogo se priča, a malo zna. Razbijamo najčešće mitove o Work and Travel programu i objašnjavamo kako zaista izgledaju prijava, viza, posao i život u Americi. Bez sitnih slova — samo provjerene informacije iz prve ruke.",
      MK: "Mnogu se zboruva, a malku se znae. Gi rušime najčestite mitovi za Work and Travel programot i objasnuvame kako navistina izgledaat prijavata, vizata, rabotata i životot vo Amerika. Bez sitni bukvi — samo provereni informacii od prva raka.",
      BS: "Mnogo se priča, a malo zna. Razbijamo najčešće mitove o Work and Travel programu i objašnjavamo kako zaista izgledaju prijava, viza, posao i život u Americi. Bez sitnih slova — samo provjerene informacije iz prve ruke.",
    },
    body: {
      EN: [
        "A lot of half-truths circulate about the Work and Travel program. The truth is simple: it's a legal, government-regulated cultural exchange program that has existed for decades and through which millions of students from around the world have passed.",
        "With the right agency, the whole process is transparent — you know exactly what you're paying for, what the conditions are and what you get. We believe in honesty: no fine print, no hidden costs, just clear support from start to finish.",
      ],
      SR: [
        "Oko Work and Travel programa kruži mnogo poluinformacija. Istina je jednostavna: reč je o legalnom, državno regulisanom programu kulturne razmene koji postoji decenijama i kroz koji je prošlo na milione studenata iz celog sveta.",
        "Uz pravu agenciju, ceo proces je transparentan — znaš tačno šta plaćaš, koji su uslovi i šta dobijaš. Verujemo u iskrenost: bez sitnih slova, bez skrivenih troškova, samo jasna podrška od početka do kraja.",
      ],
      HR: [
        "Oko Work and Travel programa kruži mnogo poluinformacija. Istina je jednostavna: riječ je o legalnom, državno reguliranom programu kulturne razmjene koji postoji desetljećima i kroz koji su prošli milijuni studenata iz cijelog svijeta.",
        "Uz pravu agenciju, cijeli je proces transparentan — znaš točno što plaćaš, koji su uvjeti i što dobivaš. Vjerujemo u iskrenost: bez sitnih slova, bez skrivenih troškova, samo jasna podrška od početka do kraja.",
      ],
      MK: [
        "Okolu Work and Travel programot kružat mnogu poluinformacii. Vistinata e ednostavna: stanuva zbor za legalna, državno regulirana programa za kulturna razmena što postoi decenii i niz koja minale milioni studenti od cel svet.",
        "So vistinskata agencija, celiot proces e transparenten — znaeš točno što plakaš, koi se uslovite i što dobivaš. Veruvame vo iskrenost: bez sitni bukvi, bez skrieni troshoci, samo jasna poddrška od početok do kraj.",
      ],
      BS: [
        "Oko Work and Travel programa kruži mnogo poluinformacija. Istina je jednostavna: riječ je o legalnom, državno reguliranom programu kulturne razmjene koji postoji desetljećima i kroz koji su prošli milioni studenata iz cijelog svijeta.",
        "Uz pravu agenciju, cijeli proces je transparentan — znaš tačno šta plaćaš, koji su uvjeti i šta dobivaš. Vjerujemo u iskrenost: bez sitnih slova, bez skrivenih troškova, samo jasna podrška od početka do kraja.",
      ],
    },
  },
  {
    slug: "srednje-skole-u-americi",
    category: "High School USA",
    date: "10.03.2025.",
    image: "https://picsum.photos/seed/americanadventure-school/1280/720",
    theme: "school",
    title: {
      EN: "High schools in America – make your child's dream of an American education come true!",
      SR: "Srednje škole u Americi – ostvari detetov san o američkom obrazovanju!",
      HR: "Srednje škole u Americi – ostvari djetetov san o američkom obrazovanju!",
      MK: "Sredni učilišta vo Amerika – ostvari go sonot na tvoeto dete za amerikansko obrazovanie!",
      BS: "Srednje škole u Americi – ostvari djetetov san o američkom obrazovanju!",
    },
    excerpt: {
      EN: "A year in an American high school is truly transformative — fluent English, confidence and friendships for life. The High School USA program opens the door to quality education and a genuine American experience. Find out how to enrol your child.",
      SR: "Godina dana u američkoj srednjoj školi menja iz korena — znanje engleskog, samopouzdanje i prijateljstva za ceo život. Program High School USA otvara vrata kvalitetnog obrazovanja i pravog američkog iskustva. Saznaj kako da prijaviš svoje dete.",
      HR: "Godina dana u američkoj srednjoj školi mijenja iz temelja — znanje engleskog, samopouzdanje i prijateljstva za cijeli život. Program High School USA otvara vrata kvalitetnog obrazovanja i pravog američkog iskustva. Saznaj kako prijaviti svoje dijete.",
      MK: "Edna godina vo amerikansko sredno učilište menuva od koren — znaenje na angliski, samodoverba i prijatelstva za cel život. Programot High School USA otvora vrata kon kvalitetno obrazovanie i vistinsko amerikansko iskustvo. Doznaj kako da go prijaviš tvoeto dete.",
      BS: "Godina dana u američkoj srednjoj školi mijenja iz temelja — znanje engleskog, samopouzdanje i prijateljstva za cijeli život. Program High School USA otvara vrata kvalitetnog obrazovanja i pravog američkog iskustva. Saznaj kako prijaviti svoje dijete.",
    },
    body: {
      EN: [
        "High School USA lets high-schoolers spend a full school year at an American high school, live with a carefully selected host family and fully immerse themselves in the American way of life.",
        "Beyond excellent English, your child gains independence, new friendships and a worldview that opens doors to future studies and careers. Contact us and find out how to enrol your child.",
      ],
      SR: [
        "High School USA omogućava srednjoškolcima da provedu jednu školsku godinu u američkoj srednjoj školi, žive u pažljivo odabranoj porodici domaćina i u potpunosti urone u američki način života.",
        "Pored vrhunskog znanja engleskog, dete stiče samostalnost, nova prijateljstva i pogled na svet koji mu otvara vrata budućih studija i karijere. Kontaktiraj nas i saznaj kako da prijaviš svoje dete.",
      ],
      HR: [
        "High School USA omogućuje srednjoškolcima da provedu jednu školsku godinu u američkoj srednjoj školi, žive u pažljivo odabranoj obitelji domaćina i potpuno urone u američki način života.",
        "Osim vrhunskog znanja engleskog, dijete stječe samostalnost, nova prijateljstva i pogled na svijet koji mu otvara vrata budućih studija i karijere. Kontaktiraj nas i saznaj kako prijaviti svoje dijete.",
      ],
      MK: [
        "High School USA im ovozmožuva na srednoškolcite da pominat edna učebna godina vo amerikansko sredno učilište, da živeat vo vnimatelno izbrano semejstvo-domakin i celosno da se vronat vo amerikanskiot način na život.",
        "Pokraj vrven angliski, deteto steknuva samostojnost, novi prijatelstva i pogled na svetot što mu otvora vrati kon idni studii i kariera. Kontaktiraj ne i doznaj kako da go prijaviš tvoeto dete.",
      ],
      BS: [
        "High School USA omogućava srednjoškolcima da provedu jednu školsku godinu u američkoj srednjoj školi, žive u pažljivo odabranoj porodici domaćina i potpuno urone u američki način života.",
        "Osim vrhunskog znanja engleskog, dijete stiče samostalnost, nova prijateljstva i pogled na svijet koji mu otvara vrata budućih studija i karijere. Kontaktiraj nas i saznaj kako prijaviti svoje dijete.",
      ],
    },
  },
];

export default news;
