// Iskustva učesnika — doslovno preneta sa workandtravel.rs (izvoz 12.11.2026).
// Tekstovi su izjave učesnika, bez izmena; `quote`, `extraJob`, `employerNote` i `job` imaju SR i EN verziju.
// Ocene (Pozitivno / Neutralno / Negativno) su ocene samih učesnika.
const experiencesPage = [
  {
    "slug": "dajana-grubac-block-island-rhode-island",
    "name": "Dajana Grubač",
    "place": "Block Island, Rhode Island",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Block-Island-RI-2-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Prvi put smo išle preko ove agencije i sve je bilo ok.",
      "EN": "We went through this agency for the first time and everything was ok."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Prvi put smo bile u Americi drugarica i ja i bilo je super. Mesto je malo ali ima studenata i mladih ljudi. Može da se nadje drugi, čak i treći posao bez problema i odlično smo se provele.",
      "EN": "My friend and I were in America for the first time and it was great. The place is small but there are students and young people. You can find a second, even a third job without any problems and we had a great time."
    },
    "job": {
      "SR": "Busser/dishwasher,Bethany Coviello",
      "EN": "Busser / dishwasher, Bethany Coviello"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Postavljanje stolova i dočekivanje gostiju, odnošenje prljavih tanjira i njihovo stavljanje u mašine za pranje.",
      "EN": "Setting tables and welcoming guests, taking dirty plates and putting them in the washing machines."
    },
    "wage": "9$ na sat",
    "hours": "32h",
    "tips": "200$ nedeljno"
  },
  {
    "slug": "djordje-milojevic-wisconsin-dells-wisconsin",
    "name": "Djordje Milojević",
    "place": "Wisconsin Dells, Wisconsin",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Wisconsin-Dells-Wisconsin-3-4.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Super sve, veoma sam zadovoljan! Uvek su tu da pomognu ako treba.",
      "EN": "Great everything, I am very satisfied! They are always there to help if needed."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Našao sam 4 dodatna posla, može lako da se nadje.",
      "EN": "I found 4 extra jobs, it can be easily found."
    },
    "job": {
      "SR": "Housekeeper ,All Star Value Inn",
      "EN": "Housekeeper, All Star Value Inn"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Sredjivanje soba, održavanje motela, veoma dobar poslodavac i veoma pozitivno iskustvo. Posao nije težak.",
      "EN": "Room cleaning, motel maintenance, very good employer and very positive experience. The work is not difficult."
    },
    "wage": "9$",
    "hours": "40-45",
    "tips": "40$ mesečno"
  },
  {
    "slug": "gino-battestin-block-island-rhode-island",
    "name": "Gino Battestin",
    "place": "Block Island, Rhode Island",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/block-Island-RI-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "U agenciji su ažurni i pružaju verodostojne informacije.",
      "EN": "They are up-to-date in the agency and provide credible information."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Mirno ostrvo, sa veoma prijatnom okeanskom klimom, i nisam imao problema sa klimom iako imam astmu. Drugi posao vam može naći sponzorska agencija a možete i sami ako se raspitate u hotelima i restoranima.",
      "EN": "A quiet island, with a very pleasant oceanic climate, and I had no climate problems even though I have asthma. Another job can be found by a sponsoring agency, or you can find one yourself if you inquire at hotels and restaurants."
    },
    "job": {
      "SR": "Front Desk,1661 Inn",
      "EN": "Front Desk, 1661 Inn"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Mnogo javljanja na telefon jer se rezervacije najviše prave putem telefonskog poziva, pa treba naučiti kako funkcioniše rezervacioni sistem. Poslepodnevna smena radi check in-ove, ali ponekad je potrebna i pomoc oko posluživanja vina koja ulaze u cenu aranžmana.",
      "EN": "Many phone calls because reservations are mostly made by phone call, so you need to learn how the reservation system works. The afternoon shift is for check-ins, but sometimes help is needed to serve the wines that are included in the price of the arrangement."
    },
    "wage": "$9",
    "hours": "42"
  },
  {
    "slug": "igor-mladenovic-park-city-utah",
    "name": "Igor Mladenović",
    "place": "Park City, Utah",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Park-City-Utah-2.jpg",
    "quote": {
      "SR": "Veoma pozitivno, vrlo su ažurni i profesionalni. Našli su posao i mesto koje mi odgovara, topla preporuka svima.",
      "EN": "I am satisfied with the work of..."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Velika je mogućnost nalaženja drugog posla. U pitanju je turističko mesto sa pregršt mogućnosti. Meštani su prijatni i druželjubivi, noćni život je solidan.",
      "EN": "There is a great possibility of finding another job. It is a tourist place with a handful of possibilities. The locals are pleasant and friendly, the nightlife is solid."
    },
    "job": {
      "SR": "Dishwasher,Waldorf Astoria",
      "EN": "Dishwasher, Waldorf Astoria"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Pranje sudova, odlaganje sudova.",
      "EN": "Washing dishes, postponing dishes."
    },
    "wage": "$11",
    "hours": "32-40",
    "tips": "$200"
  },
  {
    "slug": "jovana-spasojevic-block-island-rhode-island",
    "name": "Jovana Spasojević",
    "place": "Block Island, Rhode Island",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Block-Island-RI-3.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Sve je bilo super.",
      "EN": "Everything was great."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Leto je bilo toplo i puno sunca, nije bilo kiše skoro uopšte. Radila sam 2 posla skoro celo leto i baš je bilo sve super i društvo i celokupno mesto.",
      "EN": "The summer was warm and full of sun, there was no rain almost at all. I did 2 jobs almost all summer and everything was great and the company and the whole place."
    },
    "job": {
      "SR": "busser/dishwasher,Bethany Coviello",
      "EN": "busser / dishwasher, Bethany Coviello"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Pomoć konobarima i odnošenje prljavih tanjra i čaša u mašine za pranje sudova.",
      "EN": "Assisting waiters and taking dirty plates and glasses to dishwashers."
    },
    "wage": "$9",
    "hours": "32-40h",
    "tips": "170 i 200 dolara"
  },
  {
    "slug": "katarina-stefanovic-block-island-rhode-island",
    "name": "Katarina Stefanović",
    "place": "Block Island, Rhode Island",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Block-Island-RI-5.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Spremni su da odgovore na sva vaša pitanja, da pomognu šta god da vam treba.",
      "EN": "They are ready to answer all your questions, to help whatever you need."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Iako je ostrvo malo, postoje ogromne mogućnosti za pronalaženje drugog posla. Ja sam ga pronašla u jednom restoranu posle nedelju dana i ostala sam da radim tu do kraja sezone. Klima je odlična, u julu i avgustu bude oko 30 stepeni. Što se noćnog života tiče ima nekoliko pub-ova za izlaske. Meštani su divni ljudi. Vrlo im je interesantno da nas upoznaju. Druženje je super, kako sa našim ljudima tako i sa ljudima iz drugih država. Kada budete imali slobodan dan, ako već ne radite drugi posao, iskoristite taj dan za obilaženje ostrva a ne za spavanje. Upoznajte se sa što više ljudi, nemojte da provodite vreme isključivo sa našima. Ljudi koji žive na ostrvu puno znaju o njemu i može da se desi da vas svuda vodaju, kao mene. Ja sam posetila neka mesta na ostrvu koje je malo ko posetio ko je bio tamo.",
      "EN": "Although the island is small, there are huge opportunities to find another job. I found it in a restaurant after a week and stayed there to work until the end of the season. The climate is excellent, in July and August it will be around 30 degrees. As for the nightlife there are several pubs for going out. The locals are wonderful people. It is very interesting for them to meet us. Socializing is great, both with our people and with people from other countries. When you have a day off, if you are not already doing other work, use that day to tour the island and not to sleep. Meet as many people as possible, don’t spend time exclusively with ours. People who live on the island know a lot about him and it can happen that they take you everywhere, like me. I visited some places on the island that few people visited who were there."
    },
    "job": {
      "SR": "Housekeeping,The 1661 Inn",
      "EN": "Housekeeping, the 1661 Inn"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Dobila sam dve zgrade i posao mi je bio da ih održavam. Imala sam 6 soba i 4 apartmana. Satnica je dobra, napojnica ima ali sve zavisi od broja soba koje su zauzete.",
      "EN": "I got two buildings and my job was to maintain them. I had 6 rooms and 4 suites. The schedule is good, there is a tip, but everything depends on the number of rooms that are occupied."
    },
    "wage": "$9",
    "hours": "36",
    "tips": "$20-40"
  },
  {
    "slug": "marko-milutinovic-park-city-utah",
    "name": "Marko Milutinović",
    "place": "Park City, Utah",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Park-City-UT-7.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Svi u agenciji su fer i korektni, uvek spremni da pomognu i odgovore na sva pitanja. Definitivno ću preporučiti svima.",
      "EN": "Everyone in the agency is fair and correct, always ready to help and answer all questions. I will definitely recommend to everyone."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Uvek može da se nadje dodatni posao ( vrlo lako sa dobrim satnicama ), ljudi su ljubazni, fini, malo je mesto pa se dosta ljudi zna medjusobno. Celu sezonu je bilo izuzetno toplo i lepo, vazduh je dosta suv ali navikneš se brzo.",
      "EN": "You can always find extra work (very easy with good hours), people are kind, nice, it’s a small place so a lot of people know each other. The whole season was extremely warm and nice, the air is quite dry, but you get used to it quickly."
    },
    "job": {
      "SR": "Housekeeping,Waldorf Astoria",
      "EN": "Housekeeping, Waldorf Astoria"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Sredjivanje soba, nameštanje kreveta i čišćenje. Ništa previše naporno i fizički zahtevno.",
      "EN": "Room tidying, bed making and cleaning. Nothing too strenuous and physically demanding."
    },
    "wage": "$12",
    "hours": "40",
    "tips": "$10"
  },
  {
    "slug": "masa-dragasevic-chicago-illinois",
    "name": "Maša Dragašević",
    "place": "Chicago, Illinois",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Chicago-IL-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Nema bolje agencije. Preko organizacije, do samog odlaska u Ameriku, sve je bilo besprekorno. Pre samog odlaska bili su nam potančano objašnjeni uslovi, opcije i sve moguće informacije kada stignemo tamo.",
      "EN": "There is no better agency. Through the organization, until I went to America, everything was flawless. Before leaving, we were explained in detail the conditions, options and all possible information when we got there."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Ja sam bila u Čikagu. Kao što znate, to je drugi po redu najveći srpski grad. Uživala sam, upoznala sam mnogo prijatelja, što naših ljudi što Amerikanaca. Amerikanci su jako prijatan narod i Čikago je jedan od većih gradova gde je život jako pristupačan. Nije toliko skupo a mogućnosti za zaradu su jako velike. Toplo preporučujem. Mnogo zabave i dobar provod.",
      "EN": "I was in Chicago. As you know, it is the second largest Serbian city in a row. I enjoyed it, I met a lot of friends, both our people and Americans. Americans are a very pleasant people and Chicago is one of the bigger cities where life is very accessible. It is not that expensive and the earning opportunities are very large. Warmly recommend. Lots of fun and good fun."
    },
    "job": {
      "SR": "Sever, The playbook",
      "EN": "North, The playbook"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Ja sam radila kao server u jednom restoran-klubu. Bukvalno živiš od tipsa koji je jako veliki. Radiš puno ali vredi…i jako te cene ukoliko si dobar radnik. Server je kao konobar u Srbiji i mogućnosti za zaradu su jako velike. Za one komunikativnije ovo je posao koji je super i doneće vam mnogo zabave. 🙂",
      "EN": "I worked as a server in a restaurant-club. You literally live off a tip that is very big. You work a lot but it is worth a lot if you are a good worker. Server is like a waiter in Serbia and the earning opportunities are very great. For those who are more communicative, this is a job that is great and will bring you a lot of fun. 🙂"
    },
    "wage": "$4,95",
    "hours": "60",
    "tips": "$500 po danu"
  },
  {
    "slug": "milan-stojanov-bolton-landing-new-york",
    "name": "Milan Stojanov",
    "place": "Bolton Landing, New York",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Bolton-Landing-NY-3-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "I kada sam dobio otkaz, i Srpska i Američka agencija su bile uz mene i pomogle mi da pronadjem novi posao.",
      "EN": "And when I got fired, both the Serbian and American agencies were with me and helped me find a new job."
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Pošto sezona počinje, slobodno mogu da kazem prvog jula, iako zvanično kažu da počinje ranije, pravi posao je od prvog jula do sedmog septembra (do car show-a). Nalaženje dodatnog posla u predsezoni je bilo veoma teško, jer jednostavno nema dovoljno posla. Tek početkom sezone (1 jul), stanje se menja, i tada je relativno lako pronaći posao, samo treba biti dovoljno uporan i neprobirljiv.",
      "EN": "Since the season starts, I can freely say July 1st, although they officially say it starts earlier, the real work is from July 1st to September 7th (until the car show). Finding additional work in the pre-season was very difficult, because there is simply not enough work. Only at the beginning of the season (July 1), the situation changes, and then it is relatively easy to find a job, you just need to be persistent and unpretentious enough."
    },
    "job": {
      "SR": "Housekeeper,Twin Bay Village",
      "EN": "Housekeeper, Twin Bay Village"
    },
    "employerRating": "Negativno",
    "employerNote": {
      "SR": "Nemam običaj da govorim ružno o drugim ljudima, ali moj poslodavac nije veliki humanista, u stvari uopšte nije human. I da bih sprečio druge studente da odu da rade u TWIN BAY VILLAGE, APELUJEM, DA NE RADE U TWIN BAY VILLAGE. AKO SLUČAJNO NEKO POMISLI, SLOBODNO NEKA SE JAVI MENI, ILI SVIM DRUGIM STUDENTIMA KOJI SU IMALI TU NESREĆU DA RADE TAMO. RADO ĆEMO PODELITI SVA NEGATIVNA ISKUSTVA ,JER POZITIVNA GOTOVO I DA NE POSTOJE.",
      "EN": "I don’t have a habit of talking badly about other people, but my employer is not a great humanist, in fact he is not human at all. And to prevent other students from going to work at TWIN BAY VILLAGE, I APPEAL, NOT TO WORK AT TWIN BAY VILLAGE. IF ANYONE ACCIDENTALLY THINKS, FEEL FREE TO CONTACT ME, OR ALL OTHER STUDENTS WHO HAVE HAD THE ACCIDENT TO WORK THERE. WE WILL BE HAPPY TO SHARE ALL THE NEGATIVE EXPERIENCES, BECAUSE THE POSITIVE IS ALMOST NOT EXISTING."
    },
    "wage": "$8.75",
    "hours": "35"
  },
  {
    "slug": "milana-krivic-north-myrtle-beach-south-carolina",
    "name": "Milana Krivić",
    "place": "North Myrtle Beach, South Carolina",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Myrtle-beach-2-6.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Odlična organizacija, zaposleni i poslovne ponude.",
      "EN": "Great organization, employees and business offers."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Mesto je mirnije, namenjeno uglavnom za odmor starijih ljudi ili porodica. Nema mnogo mesta za izlazak, ali ima u Myrtle Beach-u. Lako se može naći drugi posao, ima dosta restorana i hotela.",
      "EN": "The place is quieter, intended mainly for the elderly or families. There aren’t many places to go out, but there are in Myrtle Beach. You can easily find another job, there are plenty of restaurants and hotels."
    },
    "job": {
      "SR": "Server,Kohrs Family Ice cream",
      "EN": "Server, Kohrs Family Ice cream"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Prodaja sladoleda.",
      "EN": "Sales of ice cream."
    },
    "wage": "$8",
    "hours": "32",
    "tips": "Dnevno oko $10"
  },
  {
    "slug": "milos-cupara-park-city-utah",
    "name": "Miloš Cupara",
    "place": "Park City, Utah",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Park-City-UT-5.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Sve su uradili kako treba, vrlo brzo i ekspeditivno.",
      "EN": "They did everything right, very quickly and expeditiously."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Velika je potražnja za radnom snagom. Neverovatno lepa priroda, mirniji noćni život. Avanturisti i planinari su dobrodošli.",
      "EN": "There is a great demand for labor. Incredibly beautiful nature, quieter nightlife. Adventurers and hikers are welcome."
    },
    "job": {
      "SR": "Housekeeper,Hilton Waldorf Astoria",
      "EN": "Housekeeper, Hilton Waldorf Astoria"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Dobra atmosfera, prilika za prekovremeni rad, razne aktivnosti za zaposlene tokom radne nedelje.",
      "EN": "Good atmosphere, opportunity for overtime work, various activities for employees during the working week."
    },
    "wage": "$11",
    "hours": "40"
  },
  {
    "slug": "milos-lazic-park-city-utah",
    "name": "Miloš Lazić",
    "place": "Park City, Utah",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Park-City-Utah-4.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Odlična organizacija od strane agencije, jako prijatno osoblje uvek spremni da odgovore na sva vaša pitanja, imaju jako dobre poslovne ponude i programe. Ja ću ove godine ponovo ići preko njih i svakome bih je preporučio.",
      "EN": "Great organization by the agency, very friendly staff always ready to answer all your questions, have very good business offers and programs. I will go over them again this year and would recommend it to anyone."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "U pitanju je restoran italijanske kuhinje, jako je prijatan ambijent za rad. Celokupna kuhinja i svi zaposleni su pravi profesionalci i bilo mi je zadovoljstvo raditi sa takvom ekipom.",
      "EN": "It is a restaurant of Italian cuisine, it is a very pleasant environment for work. The entire kitchen and all employees are true professionals and it was a pleasure to work with such a team."
    },
    "job": {
      "SR": "Kuvar, Waldorf Astoria Park City",
      "EN": "Chef, Waldorf Astoria Park City"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Kuvar na liniji i kuvar na pripremi, jako zanimljiv posao i možete nauciti mnoge stvari.",
      "EN": "Chef on line and chef on preparation, very interesting job and you can learn many things."
    },
    "wage": "$12.55",
    "hours": "40"
  },
  {
    "slug": "nemanja-jovanovic-bretton-woods-new-hampshire",
    "name": "Nemanja Jovanović",
    "place": "Bretton Woods, New Hampshire",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/bRETTON-woods-NH-2.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Uvek su spremni da pomognu, organizacija 10.",
      "EN": "They are always ready to help, organization 10."
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Bio sam izmedju planina u hotelu, najbliže mesto mi je bilo na 40 minuta kolima, tako da nisam ni tražio drugi posao.",
      "EN": "I was between the mountains in a hotel, the nearest place was 40 minutes away by car, so I wasn’t even looking for another job."
    },
    "job": {
      "SR": "Prepcook, AMC Higland Center",
      "EN": "Prepcook, AMC Higland Center"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Priprema hrane za večeru, pravljenje sendviča.",
      "EN": "Preparing food for dinner, making sandwiches."
    },
    "wage": "$8-9",
    "hours": "50",
    "tips": "$50"
  },
  {
    "slug": "nikola-mrmak-park-city-utah",
    "name": "Nikola Mrmak",
    "place": "Park City, Utah",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Park-City-Utah-2-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Veoma su odgovorni, prijatni za saradnju, fleksibilni za svaku vrstu saradnje i dogovora.",
      "EN": "They are very responsible, pleasant to cooperate, flexible for any kind of cooperation and agreement."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Ljudi su prijatni, klima je planinska, nije pakao, autobusi su besplatni, ima noćnog života. Mesto je predivno, država Utah je kulturna baština, gospodska država.",
      "EN": "The people are nice, the climate is mountainous, it’s not hell, the buses are free, there is nightlife. The place is beautiful, the state of Utah is a cultural heritage, a lordly state."
    },
    "job": {
      "SR": "Housekeeping, Waldorf Astoria",
      "EN": "Housekeeping, Waldorf Astoria"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Čišćenje soba, moguć i timski rad, da dvoje studenata rade istovremeno jednu sobu.",
      "EN": "Room cleaning, possible team work, for two students to work in one room at the same time."
    },
    "wage": "$12",
    "hours": "40",
    "tips": "$50"
  },
  {
    "slug": "sladjana-tejic-boston-massachusetts",
    "name": "Sladjana Tejić",
    "place": "Boston, Massachusetts",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Boston-MA-4.jpg",
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Boston je prelep grad koji omogućava studentima da vide mnogo lepe stvari. Isto tako, grad, u kome žive veoma uspešni i obrazovani ljudi od kojih može dosta da se nauči i da se sklope velika prijateljstva. Grad je skuplji za zivot, ali svakako vredi. Sve je skupo, ali je i zarada dobra. Grad koji svakako treba posetiti!",
      "EN": "Boston is a beautiful city that allows students to see many beautiful things. Also, a city where very successful and educated people live, from whom a lot can be learned and great friendships can be made. The city is more expensive to live in, but definitely worth it. Everything is expensive, but the earnings are also good. A city that is definitely worth a visit!"
    },
    "job": {
      "SR": "Server, Boston Harbor Hotel",
      "EN": "Server, Boston Harbor Hotel"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Od svih zaposlenih se očekuje maximalna usluga koja priliči hotelu sa 5*. Nadredjeni su veoma prijatni i vlada lepa atmosfera. Rad je bio na otvorenoj terasi koja se nalazi uz okean, gde iz sata u sat pristižu i isplovljavaju brodovi.",
      "EN": "All employees are expected to provide maximum service for a 5 * hotel. The superiors are very pleasant and there is a nice atmosphere. The work was on an open terrace located by the ocean, where ships arrive and set sail from hour to hour."
    },
    "wage": "$6.25+tips",
    "hours": "35-40"
  },
  {
    "slug": "srdjan-mirkovic-block-island-rhode-island",
    "name": "Srdjan Mirković",
    "place": "Block Island, Rhode Island",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Block-Island-RI-2-3.jpg",
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Block Island je malo ostrvo, mogućnost nalaska posla je veća na početku sezone, kasnije je tako nešto moguće samo za snalažljive.",
      "EN": "Block Island is a small island, the possibility of finding a job is higher at the beginning of the season, later something like that is only possible for the resourceful."
    },
    "job": {
      "SR": "Breakfast Server,1661 Inn",
      "EN": "Breakfast Server, 1661 Inn"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Služenje kafe i čajeva, prijem gostiju, rasklanjanje stolova.",
      "EN": "Serving coffee and tea, receiving guests, setting tables."
    },
    "wage": "$7",
    "hours": "35",
    "tips": "$150-200"
  },
  {
    "slug": "tamara-pudar-cape-may-new-jersey",
    "name": "Tamara Pudar",
    "place": "Cape May, New Jersey",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Cape-May-NJ-2.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Korektni su i profesionalni.",
      "EN": "They are correct and professional."
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Mesto je prelepo, ali jako mirno i malo. Nema baš mesta za neki provod i izlazak. Nisam tražila drugi posao.",
      "EN": "The place is beautiful, but very quiet and small. There is no place for some fun and going out. I wasn’t looking for another job."
    },
    "job": {
      "SR": "prodavac,American West",
      "EN": "salesman, American West"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Radila sam u suvenirnici kao prodavac za kasom i sve što je od mene taj posao zahtevao.",
      "EN": "I worked in a souvenir shop as a cashier and everything that the job required of me."
    },
    "wage": "$9",
    "hours": "40"
  },
  {
    "slug": "tijana-petrov-boston-massachusetts",
    "name": "Tijana Petrov",
    "place": "Boston, Massachusetts",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Boston-MA-1.jpg",
    "extraJob": {
      "SR": "Teško je pronaći drugi posao jer svi hoće za stalno da vas zaposle zato što je u pitanju veliki grad. Mi smo imale sreće što smo se upoznale sa bosancem pa nas je on ubacio u Intercontinental.",
      "EN": "It’s hard to find another job because everyone wants to hire you permanently because it’s a big city. We were lucky to meet a Bosnian, so he put us in the Intercontinental."
    },
    "job": {
      "SR": "Hostesa,Boston Harbor Hotel",
      "EN": "Hostess, Boston Harbor Hotel"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Radila sam 5 dana po 6 sati, što je baš malo.",
      "EN": "I worked 5 days for 6 hours, which is very little."
    },
    "wage": "14$",
    "hours": "30h",
    "tips": "Hostese nisu imale napojnice."
  },
  {
    "slug": "tijana-todorovic-bretton-woods-new-hampshire",
    "name": "Tijana Todorović",
    "place": "Bretton Woods, New Hampshire",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Bretton-Woods-NH-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Odlično je saradjivala, uputila nas u sve, i uvek bila spremna da nam dodatno objasni neke stvari i odgovori na pitanja.",
      "EN": "She cooperated very well, instructed us in everything, and was always ready to further explain some things to us and answer questions."
    },
    "extraJobRating": "Negativno",
    "extraJob": {
      "SR": "Nemogućnost nalaženja drugog posla, priroda, jezera, planine…",
      "EN": "Impossibility of finding another job, nature, lakes, mountains…"
    },
    "job": {
      "SR": "u kuhinji, server, housekeeping, AMC Highland Center",
      "EN": "in the kitchen, server, housekeeping, AMC Highland Center"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Pranje sudova, pomaganje kuvarima, služenje hrane gostima, pospremanje soba.",
      "EN": "Washing dishes, helping cooks, serving food to guests, cleaning rooms."
    },
    "wage": "$8.65",
    "hours": "40-50"
  },
  {
    "slug": "uros-cvetkovic-ocean-city-maryland",
    "name": "Uroš Cvetković",
    "place": "Ocean City, Maryland",
    "program": "Work and Travel USA",
    "year": "2015",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Ocean-City-MD-6.jpg",
    "quote": {
      "SR": "Uvek su mi izlazili u susret i davali najbolje savete.",
      "EN": "I am satisfied with the work of..."
    },
    "extraJob": {
      "SR": "Ovo je pravo sezonsko mesto, početkom juna se ceo grad puni. Brzo se nadje drugi posao."
    },
    "job": {
      "SR": "Pool Attendant,Hilton Hotel",
      "EN": "Pool Attendant, Hilton Hotel"
    },
    "employerRating": "Pozitivno",
    "wage": "8.50$",
    "hours": "48"
  },
  {
    "slug": "andjela-petrovic-newport-rhode-island",
    "name": "ANDJELA PETROVIC",
    "place": "NEWPORT, RHODE ISLAND",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Newport-Rhode-Island-3.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Jako sam zadovoljna radom zaposlenih."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Grad je veći, ima oko 150 hiljada stanovnika pa je mogućnost nalaženja drugog posla sezonskog karaktera, izuzetno laka. Nalazi se na obali Atlantskog okeana, jako prijatna klima i ima dosta klubova, barova i mesta za izlaske."
    },
    "job": {
      "SR": "hausekeeping, Vanderbilt Grace Hotel"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Čišćenje soba i zamena posteljine."
    },
    "wage": "9.50$",
    "hours": "40"
  },
  {
    "slug": "aleksandar-madjaric-williston-north-dakota",
    "name": "Aleksandar Madjarić",
    "place": "Williston, North Dakota",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Wiliston-North-Dakota-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Agencija je ok, korektna, sve ispoštovala. Zadovoljan sam.",
      "EN": "The agency was ok, correct, respect everything. I am pleased."
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Noćni život ne postoji, ima 2 striptiz kluba i to je to. Ljudi bukvalno nema na ulici, svi su na poslu ili u kolima, ali bukvalno ne možeš da vidiš čoveka na ulici. To me je malo iznenadilo. Grad je miran, tipičan američki gradić. Ujutru i noću je hladnije, a preko dana je oko 30 stepeni.",
      "EN": "Nightlife doesn’t exist, there are 2 strip clubs and that’s it. There are literally no people on the street, everyone is at work or in the car, but you literally can’t see a man on the street. That surprised me a little. The city is a quiet, typical American town. It is colder in the morning and at night, and it is around 30 degrees during the day."
    },
    "job": {
      "SR": "Pomoc u kuhinji, Hardees fast food",
      "EN": "Kitchen Help, Hardees fast food"
    },
    "employerRating": "Negativno",
    "employerNote": {
      "SR": "Poslodavac je tu samo da te nadgleda da li radiš, ukoliko ne radiš minut dva, odmah ti skrene pažnju da moraš. Izuzetno su teški za saradnju. Ne bih nikome preporučio ovaj fast food restoran. Primer: Nisu imali nijednog studenta povratnika, tako da verujem da dosta ljudi deli moje mišljenje."
    },
    "wage": "11$",
    "hours": "40+overtime"
  },
  {
    "slug": "andrea-ralevic-stanley-north-dakota",
    "name": "Andrea Ralević",
    "place": "Stanley, North Dakota",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Stanley-ND-2.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Agencija je ispunila do kraja programa sve što je na početku biło obećano.",
      "EN": "By the end of the program, the agency had fulfilled everything that was promised at the beginning."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Mesto je malo i nema mesta za zabavu, ali zato je mogućnost pronalaženja posla dobra. Posao smo lako našli i bili smo zadovoljni poslodavcima, i na prvom i na drugom poslu. Vreme je uglavnom bilo hladno.",
      "EN": "The place is small and there is no place for fun, but that is why the possibility of finding a job is good. We found a job easily and we were satisfied with the employers, both at the first and the second job. The weather was mostly cold."
    },
    "job": {
      "SR": "cashier, Cenex, gas station",
      "EN": "cashier, Cenex, gas station"
    },
    "employerRating": "Pozitivno",
    "wage": "$15",
    "hours": "40"
  },
  {
    "slug": "bojan-mitov-bolton-landing-new-york",
    "name": "Bojan Mitov",
    "place": "Bolton Landing, New York",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Bolton-Landing-NY-3.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Profesionalnost, skoro uvek dostupni za razgovor, brzi odgovori.",
      "EN": "Professionalism, almost always available for conversation, quick answers."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Ovo je mali turistički grad na obali jezera. Drugi posao je veoma lako naći, a pošto je mali grad sve je jako blizu. Klima je skoro kao u Srbiji.",
      "EN": "This is a small tourist town on the shores of the lake. Another job is very easy to find, and since it is a small town, everything is very close. The climate is almost like in Serbia."
    },
    "job": {
      "SR": "housekeeping, twin bay village",
      "EN": "housekeeping, twin Bay Village"
    },
    "employerRating": "Negativno",
    "employerNote": {
      "SR": "Posao kao posao nije naporan i dobro je što može da se dobije dobar bakšiš, dakle sama pozicija posla dobija pozitivnu ocenu. Negativna ocena ide poslodavcu i savetujem agenciji da ne šalju studente tamo."
    },
    "wage": "$8.5",
    "hours": "30-35",
    "tips": "$100/nedeljno"
  },
  {
    "slug": "filip-gnjatovic-park-city-utah",
    "name": "Filip Gnjatović",
    "place": "Park City, Utah",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Park-City-Utah-3.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Profesionalna i brza usluga, kada god sam im se obratio vrlo ljubazno su mi pomogli u rešavanju svih nedoumica.. Preporučio bih svima koji žele lako i brzo da završe celu programsku proceduru, da idu preko ove agencije !",
      "EN": "Professional and fast service, whenever I turned to them, they kindly helped me in resolving all doubts.. I would recommend to everyone who wants to easily and quickly complete the entire program procedure, to go through this agency!"
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Jako lepo mesto, prijatni i gostoprimljivi ljudi.",
      "EN": "Very nice place, nice and hospitable people."
    },
    "job": {
      "SR": "konobar,Hilton",
      "EN": "waiter, Hilton"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Uluživanje gostiju u restoranu.",
      "EN": "Serving guests in the restaurant."
    },
    "wage": "7$+tips",
    "hours": "40",
    "tips": "$70"
  },
  {
    "slug": "goran-gajic-block-island-rhode-island",
    "name": "Goran Gajić",
    "place": "Block Island, Rhode Island",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/block-Island-RI.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Sjajni su.",
      "EN": "They are great."
    },
    "extraJobRating": "Pozitivno",
    "job": {
      "SR": "Busser, food runner, dishwasher, prep cook, Surf Hotel",
      "EN": "Busser, food runner, dishwasher, prep cook, Surf Hotel"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Sve sam radio.",
      "EN": "I did everything."
    },
    "wage": "$6-10",
    "hours": "60",
    "tips": "$20"
  },
  {
    "slug": "ivana-vukasinovic-wells-maine",
    "name": "Ivana Vukašinović",
    "place": "Wells, Maine",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Wells-ME-3.jpg",
    "agencyRating": "Neutralno",
    "quote": {
      "SR": "Agencija je ok,samo sam očekivala da poseduju više informacija o samom mestu u koje su nas poslali. Meni je rečeno da ima dosta restorana, mesta gde se lako može naci drugi posao. To stvarno nije bilo tačno. Problem sa nalaženjem drugog posla nisam imala samo ja. Devojke koje su živele sa mnom su takodje imale ovaj problem. Ne znam da li možda pre nas niko nije bio baš u ovom mestu, pa nisu imali sve informacije.",
      "EN": "The agency is ok, I just expected them to have more information about the place they sent us to. I was told that there are a lot of restaurants, places where you can easily find another job. That really wasn’t true. It wasn’t just me who had a problem finding another job. The girls who lived with me also had this problem. I don’t know if maybe no one was in this place before us, so they didn’t have all the information."
    },
    "extraJobRating": "Negativno",
    "extraJob": {
      "SR": "Wells je mesto u kojem se pretežno nalaze hoteli i moteli. Ima jedna glavna ulica i nekoliko manjih koje vode do plaže. Sve je locirano do puta. Nema neke mogućnosti za šetnju. Meni se iskreno nije nešto dopalo. Jako je mali broj restorana,barova,suvenirnica. Prema tome, ako vam je prvi posao housekeeping (kao što je bio u mom slučaju) stvarno ne preporučujem da idete u Wells. Tačnije, uopšte ne preporučujem. Ja sam morala da radim u mestu pored, Ogunquit se zove. Svaki dan sam vozila bajs po 45 minuta u jednom smeru. To nije problem ako je lepo vreme, ali ako padne kiša, verujte mi da nije baš prijatno. Posle prvog posla, voziti na kiši i ići direktno na drugi posao je poprilično teško. Moja preporuka je da odete u Ogunquit. Mnogo je lepše mesto, ima više studenata, veće su mogućnosti da se nadje bolji posao. U Wellsu ima jedan bar, mislim da se zove Feile. Tu je ok otići uveče, imaju fine koktele, ali nije ništa specijalno. Većinom su stariji gosti, pa malo bude smor. U Ogunqitu ipak postoji nekoliko barova,klub (To je gej klub, muškarci koji fino izgledaju mogu tamo i da se zaposle; fina je lova, koliko sam čula). Moja drugarica je uspela da se zaposli na dva dana nedeljno kao basser u Wellsu, u restoranu Billy’s chowder i stvarno je dobro zaradjiavala tamo. Tako da,ako se ipak odlučite za Wells, prvo idite u Billy’s da tražite posao. Pored tog Billy’s se nalazi Varano’s restoran,ali je tamo jako teško upasti. Ima još nekoliko restorančića, ali je to jako malo u poredjenju sa Ogunquitom.",
      "EN": "Wells is a place where hotels and motels are mostly located. There is one main street and several smaller ones leading to the beach. Everything is located next to the road. There is no opportunity for a walk. I honestly didn’t like something. There are very few restaurants, bars, souvenir shops. So if your first job is housekeeping (as it was in my case) I really don’t recommend going to Wells. More precisely, I do not recommend it at all. I had to work in a place next door, it’s called Ogunquit. Every day I drove a bike for 45 minutes in one direction. It’s not a problem if the weather is nice, but if it rains, believe me, it’s not very pleasant. After the first job, driving in the rain and going directly to the second job is quite difficult. My recommendation is to go to Ogunquit. It is a much nicer place, there are more students, there are more opportunities to find a better job. There’s one bar in Wells, I think it’s called Feile. It’s ok to go there in the evening, they have fine cocktails, but it’s nothing special. They are mostly older guests, so there is a bit of fatigue. There are a few bars in Ogunqit after all, a club (It’s a gay club, men who look good can get a job there; it’s nice money, as far as I’ve heard). My friend managed to get a job for two days a week as a busser in Wells, at Billy’s chowder restaurant and made really good money there. So, if you do opt for Wells, go to Billy’s first to look for a job. Next to that Billy’s is Varano’s restaurant, but it’s very hard to get in there. There are a few more restaurants, but that’s very little compared to Ogunquit."
    },
    "job": {
      "SR": "housekeeper,Village by the sea",
      "EN": "housekeeper, Village by the sea"
    },
    "employerRating": "Neutralno",
    "employerNote": {
      "SR": "Dobra stvar ovog posla je što smo imale odličan smeštaj koji je bio u samom hotelu. Tačnije, to je jedan od apartmana za izdavanje. Sve smo imale, čak i mašinu za pranje sudova. Loša stvar je što je posao stvarno jako težak,nismo imale kolica koja guramo, nego se sva oprema( ogromne zelene torbe natrpane peškirima, krpama za brisanje, šamponima, sapunima i dr.) nosi na ledjima. Druga stvar, ne postoji lift, nego se ide peske uz i niz stepenice. Treća stvar, nismo imale dovoljno sati. 35-38 u jeku sezone što je jako malo. Radno vreme je bilo od 9-3, nekad do pola 4,4. Retko se kad desilo da smo završili u pola 5. Kada smo rekli da trazimo drugi posao, rekli su nam da ne smemo pre 5 da počinjemo na drugom poslu da radimo. Objašnjenje je bilo da ćemo im možda nekad trebati do pola 5.To se desilo svega nekoliko puta za 4 i po meseca koliko smo radile tamo. Bakšiš je deljen skroz nepravedno. Da ne dužim, Wells ne preporučujem! Ni Village by the sea! Ipak program Work & Travel svakako preporučujem. Planiram opet da idem. Upoznaćete ljude, poboljšati jezik, steći iskustvo, proputovati i pamtiti kao jednu od najlepših stvari u životu!",
      "EN": "The good thing about this job is that we had great accommodation that was in the hotel itself. More precisely, it is one of the apartments for rent. We had everything, even the dishwasher. The bad thing is that the work is really very hard, we didn’t have a wheelchair to push, but all the equipment (huge green bags full of towels, wipes, shampoos, soaps, etc.) is carried on the back. Another thing, there is no elevator, you go on sand along and through the stairs. Third thing, we didn’t have enough hours. 35-38 in the height of the season which is very little. Working hours were from 9-3, sometimes to half 4.4. It rarely happened that we finished at half past five. When we said we were looking for another job, they told us not to start working on another job before 5. The explanation was that we might need them until half past five. That happened only a few times in the 4 and a half months we worked there. The tip is divided completely unfairly. Not to lengthen, Wells I do not recommend! Ni Village by the sea! However, I definitely recommend the Work & Travel program. I plan to go again. You will meet people, improve your language, gain experience, travel and remember as one of the most beautiful things in life!"
    },
    "wage": "9 $",
    "hours": "35",
    "tips": "Prosek neki je oko 15 $."
  },
  {
    "slug": "jelena-jakovljevic-ocean-city-maryland",
    "name": "Jelena Jakovljević",
    "place": "Ocean City, Maryland",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Ocean-City-MARYLAND-3-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "S obzirom da sam se prijavila za program kasnije nego većina ljudi (u maju), devojke iz agencije su mi zaista izašle u susret, našle posao u jako kratkom vremenskom periodu i bile su mi na usluzi za sva pitanja koja sam imala.",
      "EN": "Since I applied for the program later than most people (in May), the girls from the agency really came out to meet me, found a job in a very short period of time and were at my service for any questions I had."
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Ocean City je relativno malo, porodično, turističko mesto, gde dolaze porodice na odmor. Ima dosta restorana, hotela, barova i diskoteka. Takodje, ima dosta i studenata koji dolaze iz Evrope da rade preko leta. Plaža je peščana, okean odličan za kupanje.",
      "EN": "Ocean City is a relatively small, family-run, tourist destination, where families come on vacation. There are plenty of restaurants, hotels, bars and discos. Also, there are plenty of students coming from Europe to work over the summer. The beach is sandy, the ocean is great for swimming."
    },
    "job": {
      "SR": "Uobičajene pozicije u restoranu manjeg obima – hostesa, baser, server, kasirka… (sve sem kuhinje),On Bay Seafood",
      "EN": "Usual positions in a small restaurant – hostess, baser, server, cashier sve (all except kitchen), On Bay Seafood"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Posao sam našla sama, i to mi je na kraju bio jedini posao koji sam radila. Restoran je manjeg obima, tj. ima 30 stolova. Radila sam kao baser (čistila stolove) i hostesa (nalazila ljudima stolove i smeštala ih za iste) na početku. Kako je sezona odmicala, radila sam i na kasi (gosti poručuju svoje obroke na kasi, zatim odlaze do stola koji im je dodeljen, a serveri im iznose hranu). Pred sam kraj sezone, kada je ostalo manje zaposlenih radila sam i kao server. Samo me u kuhinju nisu puštali, a ni ne zameram im. Satnica je svuda u OC-u minimalna.",
      "EN": "I found a job on my own, and it was ultimately the only job I did. The restaurant is smaller, has 30 tables. I worked as a baser (cleaning tables) and a hostess (finding people tables and setting them up for them) in the beginning. As the season progressed, I also worked at the cash register (guests order their meals at the cash register, then go to the table assigned to them, and the servers bring them food). Just before the end of the season, when there were fewer employees left, I also worked as a server. They just didn’t let me into the kitchen, and I don’t blame them either. The hourly rate is minimal everywhere in OC."
    },
    "wage": "$7.25",
    "hours": "40",
    "tips": "$80"
  },
  {
    "slug": "jovan-mirkovic-stanley-north-dakota",
    "name": "Jovan Mirković",
    "place": "Stanley, North Dakota",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Stranley-ND-1.jpg",
    "extraJobRating": "Pozitivno",
    "job": {
      "SR": "kitchen, Pinnacle oil company",
      "EN": "kitchen, Pinnacle Oil Company"
    },
    "employerRating": "Pozitivno",
    "wage": "$15",
    "hours": "40"
  },
  {
    "slug": "milena-niciforovic-rattlesnake-island-ohio",
    "name": "Milena Nićiforović",
    "place": "Rattlesnake Island, Ohio",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/RI-Ohio-3.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Veoma sam zadovoljna saradnjom sa agencijom, sve potrebne informacije sam uvek dobijala na vreme od naravno ljubaznih i uslužnih dama. Svaka pohvala i naravno ostaću im verna za narednu godinu.",
      "EN": "I am very satisfied with the cooperation with the agency, I always received all the necessary information on time from of course kind and helpful ladies. All praise and of course I will stay true to them for the next year."
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Na ostrvu se može raditi nekoliko poslova ali i sa jednim satnica je u sezoni nekada i po više od 14 sati dnevno.",
      "EN": "Several jobs can be done on the island, but even with one hourly schedule, there are sometimes more than 14 hours a day in the season."
    },
    "job": {
      "SR": "server i barmen i prodavac u butiku,Rattlesnake island club",
      "EN": "server and bartender and boutique salesman, Rattlesnake island club"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Posao je bio zanimljiv, menjali smo pozicije i uvek smo bili u mogućnosti da nešto novo naučimo. U julu i avgustu smo svi imali dosta sati zbog gužve i velike posećenosti.",
      "EN": "The job was interesting, we changed positions and we were always able to learn something new. In July and August, we all had a lot of hours due to the crowds and high attendance."
    },
    "wage": "neodredjeno",
    "hours": "do 80",
    "tips": "do $250 nedeljno"
  },
  {
    "slug": "natasa-cirkovic-block-island-rhode-island",
    "name": "NATASA CIRKOVIC",
    "place": "BLOCK ISLAND, RHODE ISLAND",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Block-Island-RI-4.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Sve je proteklo kako treba. I organizacija kao i bezbroj saveta koje smo brzo usvojili. Ceo program je protekao besprekorno. Hvala puno na divnom iskustvu. Ostanite najbolji."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Naravno da postoji mogućnost za nalaženje drugog posla pa čak i trećeg. Treba biti uporan i isplati se."
    },
    "job": {
      "SR": "The Surf Hotel"
    },
    "employerRating": "Pozitivno"
  },
  {
    "slug": "radenko-sobic-middletown-new-york",
    "name": "Radenko Šobić",
    "place": "Middletown, New York",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Middletown-NY-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Zaposleni se trude da pomognu, korektni su.",
      "EN": "Employees try to help, they are correct."
    },
    "extraJobRating": "Negativno",
    "extraJob": {
      "SR": "Dodatni posao je nemoguće naći, nepovoljno je za strane studente.",
      "EN": "It is impossible to find additional work, it is unfavorable for foreign students."
    },
    "job": {
      "SR": "Prep cook, West Hills Country Club",
      "EN": "Prep cook, West Hills Country Club"
    },
    "employerRating": "Neutralno",
    "employerNote": {
      "SR": "Priprema namirnica za kuvare, seckanje povrća, kolača i slično. Menadžeri su bili korektni, posao povremeno naporan.",
      "EN": "Preparation of food for cooks, chopping vegetables, cakes and the like. The managers were correct, the work at times tiring."
    },
    "wage": "$8",
    "hours": "35-65"
  },
  {
    "slug": "stevan-kizic-glenview-illinois",
    "name": "Stevan Kizić",
    "place": "Glenview, Illinois",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Glenview-IL-1.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Sve pohvale za agenciju, sve je u najboljem redu, svima bih je preporučio!!!",
      "EN": "All praise for the agency, everything is in the best order, I would recommend it to everyone!!!"
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Postoji mogućnost drugog posla, medjutim u tako velikom gradu niko ne obraća pažnju na studente iz inostranstva. Meštani su kulturni, pomoći će ukoliko su u mogućnosti dok za Srbe u Čikagu nemam reči hvale. Svim studentima bih preporučio da kontakte sa Srbima smanje, posto su ipak otisli da upoznaju drugu kulturu a ne svoju…za sve studente koji borave u Čikagu preko leta, preporučio bih da nabave bicikl, pošto imaju mogućnost da ih ubace u metroe, buseve ukoliko je loše vreme, a samim tim izbeći će nepotrebne troškove za kola, moguće kazne (parking u Čikagu je strašan) a i poboljšaće kondiciju.",
      "EN": "There is the possibility of another job, however in such a big city no one pays attention to students from abroad. The locals are cultured, they will help if they are able, while I have no words of praise for the Serbs in Chicago. I would recommend to all students to reduce contacts with Serbs, since they still went to get to know a different culture than their own… for all students who stay in Chicago during the summer, I would recommend to buy a bicycle, as they have the opportunity to put them in subways, buses if bad weather, and thus will avoid unnecessary car costs, possible fines (parking in Chicago is terrible) and will improve fitness."
    },
    "job": {
      "SR": "Banquet server,The Glen Club",
      "EN": "Banquet server, The Glen Club"
    },
    "employerRating": "Neutralno",
    "employerNote": {
      "SR": "Dobre strane su to što će vam pomoći ukoliko imate nekih pitanja ili dilema, izaći će vam u susret ukoliko ih zamolite, ali za sve to će vas izrabljivati maksimalno.",
      "EN": "The good sides are that they will help you if you have any questions or dilemmas, they will meet you if you ask them, but for all this they will make the most of you."
    },
    "wage": "$8.25",
    "hours": "30",
    "tips": "5$/h"
  },
  {
    "slug": "una-basic-ocean-city-maryland",
    "name": "UNA BASIC",
    "place": "OCEAN CITY, MARYLAND",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Ocean-City-MARYLAND-1-2.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Sve pohvale agenciji. Stvarno su uvijek tu i otvoreni za bilo kakva pitanja. Stvarno sve najbolje."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Kažu svi da je ženama lakše za drugi posao da nadju, ja sam ga iskreno već treći dan našla. Noćni život je baš super i buran. Svako veče je drugi klub tako da od odjeće vam trebaju samo neke krpice za izlazak. Radno odijelo tamo već kupite."
    },
    "job": {
      "SR": "server,piezanos"
    },
    "employerRating": "Pozitivno",
    "wage": "$12",
    "hours": "60",
    "tips": "$200"
  },
  {
    "slug": "vladimir-veselinovic-locust-valley-new-york",
    "name": "Vladimir Veselinović",
    "place": "Locust Valley, New York",
    "program": "Work and Travel USA",
    "year": "2014",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Locust-Valley-NY-3.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Svi su se angažovali i trudili oko pomoći oko bilo kakvih problema. Sve najbolje zaposlenima.",
      "EN": "Everyone was engaged and tried to help with any problems. All the best to the employees."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Mesto je udaljeno oko 30 minuta od New Yorka. Mirno i elitno naselje. Blago rečeno, Raj Na Zemlji…",
      "EN": "The place is about 30 minutes away from New York. Quiet and elite settlement. To put it mildly, Paradise on Earth… Jobs: Bellboy, Server and Housekeeper, Piping Rock Club"
    },
    "job": {
      "SR": "Bellboy, Server i Housekeeper,Piping Rock Club"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Room servis i pomoć oko prtljaga tokom dana, u večernjim satima posao kao konobar u restoranu istog kluba.",
      "EN": "Room service and assistance with luggage during the day, in the evening work as a waiter in a restaurant of the same club."
    },
    "wage": "8.5$",
    "hours": "60+"
  },
  {
    "slug": "aleksa-ostojic-stowe-vermont",
    "name": "Aleksa Ostojić",
    "place": "Stowe, Vermont",
    "program": "Work and Travel USA",
    "year": "2013",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Stowe-Vermont.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Zadovoljan sam radom agencije,sve pohvale !",
      "EN": "I am satisfied with the work of the agency, all praise!"
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Lako sam pronašao dodatni posao. Već u drugoj nedelji su me pozvali da dodjem da radim,dobro sam se pokazao,radio sam u restoranu kao sushi chef.",
      "EN": "I easily found an extra job. Already in the second week I was invited to come to work, I showed myself well, I worked in a restaurant as a sushi chef."
    },
    "job": {
      "SR": "Cook, Northern Lights Lodge",
      "EN": "Cook, Northern Lights Lodge"
    },
    "employerRating": "Pozitivno",
    "hours": "40"
  },
  {
    "slug": "igor-petrovic-los-angeles-california",
    "name": "Igor Petrović",
    "place": "Los Angeles, California",
    "program": "Work and Travel USA",
    "year": "2013",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Los-Angeles-CA-5.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Svi u agenciji su super,planiram i sledeće godine da putujem naravno preko iste agencije.",
      "EN": "Everyone in the agency is great, I plan to travel through the same agency next year, of course."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Veliki grad, velke mogućnosti. Lako se može naći drugi posao,problem broj 1 je smeštaj. Treba ga tražiti na craig listi u opciji: rooms / shared,sublets / temporary a ne na aprt/housing gde svi pokušavaju zato sto vam tu traže prvi, poslednji mesec i sigurnosni depozit. Znači da vam treba u startu 5000 $",
      "EN": "Big city, great opportunities. Another job can be easily found, problem number 1 is accommodation. You should look for it on the Craig list in the option: rooms / shared, sublets / temporary and not on apartman/ housing where everyone is trying because they are asking for your first, last month and security deposit. So you need $ 5,000 to start with"
    },
    "job": {
      "SR": "Parking Atendent,Safty Park",
      "EN": "Parking Attendant, Safety Park"
    },
    "employerRating": "Pozitivno",
    "wage": "10$",
    "hours": "55",
    "tips": "20$ dnevno"
  },
  {
    "slug": "jelena-vidic-fenwick-island-delaware",
    "name": "Jelena Vidić",
    "place": "Fenwick Island, Delaware",
    "program": "Work and Travel USA",
    "year": "2013",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Bethany-Beach-Delaware-2.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Izuzetno pozitivno iskustvo. Prijavila sam se za program krajem marta i sve je na vreme odradjeno tako da sam prvog juna već počela da radim. 🙂 Sad već prikupljam papire za sledeću godinu, pa ponovo sa istom agencijom.",
      "EN": "Extremely positive experience. I applied for the program at the end of March and everything was done on time, so I already started working on the first of June. 🙂 I am already collecting papers for next year, and again with the same agency."
    },
    "extraJobRating": "Neutralno",
    "extraJob": {
      "SR": "Ja lično nisam imala potrebe da tražim drugi posao, ali se dodatni posao jako lako može naći i u Fenwick Island i u Ocean City, susedni grad. Mesto je izuzetno bezbedno a meštani prijatni, sve sto je potrebno može se naći peške, a plaze se nalaze na 10 do 15 min od većine smeštaja. Nema previše mesta za izlazak, ali tih par što ima su izuzetno zanimljivi, i organizuju svake nedelje žurke za W&T studente. Takodje, prva ili druga nedelje septembra je Bike Week u Ocean City-u, što je jedan od najvećih skupova bajkera u SAD.",
      "EN": "I personally had no need to look for another job, but an additional job can very easily be found in both Fenwick Island and Ocean City, a neighboring city. The place is extremely safe and the locals are pleasant, everything you need can be found on foot, and the beaches are located 10 to 15 minutes from most accommodation. There aren’t too many places to go out, but the few that are there are extremely interesting, and they organize weekly parties for W&T students. Also, the first or second week of September is Bike Week in Ocean City, which is one of the largest biker gatherings in the US."
    },
    "job": {
      "SR": "customer service and relationships,Sunsations",
      "EN": "customer service and relationships, Sunsations"
    },
    "employerRating": "Neutralno",
    "employerNote": {
      "SR": "Zašto neutralno? Pa jednostavno čovek nije prijatan, ali dokle god se prilagodiš i shvatiš da jedino treba da progovoriš koju sa mušterijama, radiš na kasi ili slažeš majice, što zaista nije teško, sve će biti OK. Nosi se žuta majica koja se tamo dobija. Moguće je dogovoriti se sa njim pa imati veliki broj sati nedeljno i onda raditi samo jedan posao. Redovno daje plate, na dve nedelje. Ne plaća ‘over-time’ više, 1.5, već redovnu cenu, što je opet dovoljno.",
      "EN": "Why neutral? Well, a person is simply not pleasant, but as long as you adjust and realize that you only need to talk to customers, work at the cash register or put on T-shirts, which is really not difficult, everything will be OK. A yellow T-shirt was worn there. It is possible to agree with him and have a large number of hours a week and then do only one job. He pays regularly, for two weeks. He doesn’t pay „over-time“ anymore, 1.5, but a regular price, which is enough again."
    }
  },
  {
    "slug": "milan-lukic-block-island-rhode-island",
    "name": "Milan Lukić",
    "place": "Block Island, Rhode Island",
    "program": "Work and Travel USA",
    "year": "2013",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Block-Island-RI-2.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Odličan tim ljudi,drugarski pristup,uvek dostupni što se tiče pomoći studentima.",
      "EN": "Great team of people, friendly approach, always available when it comes to helping students."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Malo mesto tako da ne očekujte mnoštvo klubova, ali zato ima veliki broj studenata iz različitih zemalja tako da nije dosadno. Što se tiče drugog posla može da se nadje, skoro svi su radili dva posla. Ko ne voli velike gradove, jako dobra destinacija.",
      "EN": "A small place so don’t expect a lot of clubs, but that’s why there are a large number of students from different countries so it’s not boring. As for another job to be found, almost everyone did two jobs. Who does not like big cities, a very good destination."
    },
    "job": {
      "SR": "kitchen assistent,Harborside Inn",
      "EN": "kitchen assistant, Harborside Inn"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Radio sam u kuhinji. Korektno je što se tiče zarade, uvek na vreme. Ne raditi u kuhinji ukoliko nemate iskustva bar malo. Sve u svemu, prijatno mesto za rad.",
      "EN": "I worked in the kitchen. It is correct when it comes to earnings, always on time. Don’t work in the kitchen unless you have at least a little experience. All in all, a pleasant place to work."
    },
    "wage": "$9",
    "hours": "45"
  },
  {
    "slug": "sara-jokic-new-jersey-new-jersey",
    "name": "Sara Jokić",
    "place": "New Jersey, New Jersey",
    "program": "Work and Travel USA",
    "year": "2013",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Virginia-Beach-Virginia-3.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Maksimalno su profesionalni. Sve što su rekli, ispoštovali su. Definitivno najveća prolaznost u ambasadi na intervjuu.",
      "EN": "They are maximally professional. Everything they said, they respected. Definitely the biggest pass in the embassy in the interview."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Pa slobodno mogu reći najbolji uslovi za jednog studenta. Tu podrazumevam isplate, smeštaj, poslodavce, troškove prema firmi. Prezadovoljna sam bila i nisam imala potrebu za dodatnim poslom. Smeštaj mi je bio 15 minuta autobusom od New Yorka, tako da smo svaki slobodan dan išli u NY. Leto je bilo jako toplo, ali ne i sparno, tako da mi je i klima odgovarala. Igrom slučaja su nas sponzori prebacili u Boston u High Sierra Pools kompaniju (sa time nije imala veze American Adventure agencija niti je mogla da utiče na tu odluku) , moj najiskreniji savet za sve NE IĆI TAMO I NE RADITI U TOJ FIRMI!! SREĆNO !",
      "EN": "Well, I can freely say the best conditions for one student. This includes payments, accommodation, employers, costs to companies. I was very satisfied and had no need for extra work. My accommodation was a 15 minute bus ride from New York, so we went to NY every day off. The summer was very hot, but not steamy, so the climate suited me. Coincidentally, the sponsors transferred us to Boston to the High Sierra Pools Company (the American Adventure agency had nothing to do with it and could not influence that decision), my most sincere advice to everyone is NOT TO GO THERE AND NOT TO WORK IN THAT COMPANY!! GOOD LUCK!"
    },
    "job": {
      "SR": "Lifeguard ,Perfect Pool",
      "EN": "Lifeguard, Perfect Pool"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Radila sam na bazenima kao spasilac . U pitanju je zgrada sa 31 spratom i oko 3000 stanovnika, smeštena u New Jersey-u. Na bazenu nas je uvek bilo dvoje ili troje zbog velikog broja kupača , samim tim je bilo i zanimljivo i vreme je brže proticalo. Imala sam tu čast da vodim i grupu žena aquarobik , tri puta nedeljno i poslodavci su me za to plaćali ekstra prekovremeni rad. Ako se odlučite za Perfect Pool nema potrebe za dodatnim poslom, bićete zadovoljni.",
      "EN": "I worked in swimming pools as a lifeguard. It is a 31-story building with about 3,000 residents, located in New Jersey. There were always two or three of us in the pool due to the large number of swimmers, so it was interesting and time passed faster. I also had the opportunity to lead a group of women in aqua aerobics, three times a week, and my employers paid me extra overtime for that. If you decide for Perfect Pool, there is no need for additional work, you will be satisfied."
    },
    "wage": "$8.25 – 12.25",
    "hours": "50-55",
    "tips": "800 dolara"
  },
  {
    "slug": "marko-bogic-park-city-utah",
    "name": "Marko Bogić",
    "place": "Park City, Utah",
    "program": "Work and Travel USA",
    "year": "2009",
    "image": "https://workandtravel.rs/wp-content/uploads/2016/11/Park-City-UT-6.jpg",
    "agencyRating": "Pozitivno",
    "quote": {
      "SR": "Agencija je super ,veoma ažurna . Moram pohvaliti Ljilju jer sam prošle sezone dobio posao u aprilu mesecu. Iako sam slabo znao engleski, pronadjen mi je posao u Park City-u od 11 dolara po satu .",
      "EN": "The agency is great, very up to date. I have to praise Ljilja because I got a job in April last season. Although I knew little English, I was found a job in Park City at $ 11 an hour."
    },
    "extraJobRating": "Pozitivno",
    "extraJob": {
      "SR": "Jedna velika avantura koja je dala veliki impuls životu meni i celoj mojoj ekipi. Već drugu godinu za redom idem u Park City u državi Utah. Park City je mali turistički gradić 20 minuta od Salt Lake City-a, sjajno mesto ,veoma visoke satnice, malo je teže pronaci smestaj ali kada se nadje cene su pristojne. Poslodavci na prvom poslu u Hilton hotelu su bili ležerni sve je stvar dogovora, naravno vode računa o tome da li se kasni, da imate čistu uniformu ( na to posebno obraćaju pažnju ). Veoma je lako naći drugi posao, sa jako dobrim satnicama preko 11$. Nakon završene sezone, Utah kao država ja na dobrom mestu jer gde god da putujete avio karte su vam jeftine. Ja sam išao u Majami za 100$ , do Njujorka 150$ , a do Las Vegasa kolima vam treba 7 sati vožnje, rent-a car će vam izaći oko 30 ak dolara po danu. Smeštaj u Vegasu je jako jeftin, videćete sve i sami .",
      "EN": "One great adventure that gave a great impetus to the life of me and my entire team. For the second year in a row, I’m going to Park City, Utah. Park City is a small tourist town 20 minutes from Salt Lake City, a great place, very high hours, it’s a little harder to find accommodation but when found the prices are decent. Employers at their first job at the Hilton hotel were casual, it’s all a matter of agreement, of course they take care of whether it’s late, that you have a clean uniform (they pay special attention to that). It is very easy to find another job, with very good hourly rates over $ 11. After the end of the season, Utah as a state is in a good place because wherever you travel, airline tickets are cheap. I went to Miami for $ 100, to New York for $ 150, and to Las Vegas by car you need a 7-hour drive, a car rental will cost you about $ 30 a day. Accommodation in Vegas is very cheap, you will see everything for yourself."
    },
    "job": {
      "SR": "Prepcook,Waldorf Astoria",
      "EN": "Prepcook, Waldorf Astoria"
    },
    "employerRating": "Pozitivno",
    "employerNote": {
      "SR": "Sve je bilo sjajno.",
      "EN": "Everything was great."
    },
    "wage": "$12",
    "hours": "60",
    "tips": "$100"
  }
];

export default experiencesPage;
