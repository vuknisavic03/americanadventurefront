// Iskustva učesnika — podaci za stranicu /foto-story.
// Izvor: stranice iskustava na workandtravel.rs. `summary` je naš sažetak onoga što je učesnik
// napisao (u trećem licu, NIJE citat). Pune izjave se prenose iz arhive starog sajta.
// Satnice su iz godine u kojoj je učesnik radio i danas su više.
const PROGRAM = "Work and Travel USA";

const experiencesPage = [
  { name: "Aleksandar Dujaković", employer: "Hanson Enterprises", place: "Ogunquit, Maine", summary: "Pohvalio je korektnost agencije i informacije na vreme. Smeštaj je bio odličan, a plata je stizala bez kašnjenja." },
  { name: "Nemanja", employer: "Village Tavern Restaurant & Inn", place: "Hammondsport, New York", summary: "Miran gradić na jezeru. Poslodavci vode posao više od 30 godina i prema studentima su fer, a smeštaj je dobar." },
  { name: "Boba Petronijević", employer: "Nantucket Yacht Club", place: "Nantucket, Massachusetts", summary: "Imao je podršku agencije pre i tokom programa. Ostrvo ga je osvojilo plažama i istorijom, a od menadžera je mnogo naučio." },
  { name: "Aleksandar Dimitrijević", employer: "BeauJo's", place: "Idaho Springs, Colorado", summary: "Kao ljubitelj planina dobio je mesto po meri. Poslodavci i kolege su ga lepo primili." },
  { name: "Stefan", employer: "Princess Royale", place: "Ocean City, Maryland", summary: "Ocean City opisuje kao pravo studentsko mesto: mnogo posla, pristupačne cene i dobar noćni život." },
  { name: "Jelena", employer: "Surf Hotel", place: "Block Island, Rhode Island", summary: "Poslodavci su se prema zaposlenima odnosili kao prema porodici. Smeštaj je na obali, preko puta posla." },
  { name: "Uroš R.", employer: "The Oar", place: "Block Island, Rhode Island", summary: "Radio je mnogo sati nedeljno i ističe da je agencija brzo odgovarala na svako pitanje." },
  { name: "Srđan", employer: "Southampton Car Wash & Detail Center", place: "Southampton, New York", summary: "Mnogo prekovremenog rada i dobre napojnice. Posao za one koji žele da iskoriste svaki sat." },
  { name: "Bojan Mitrov", employer: "Twin Bay Village", place: "Bolton Landing, New York", summary: "Na prvom poslu radio je tridesetak sati nedeljno, pa je lako našao i drugi posao." },
  { name: "Filip Milenković", employer: "Hardee's", place: "Minot, North Dakota", summary: "Miran grad sa malo zabave, ali dobar za rad. Drugi posao se lako nalazi." },
  { name: "Mirko", employer: "Flavors of Italy", place: "Ocean City, Maryland", summary: "Kada je poželeo promenu, novi posao je našao za tri dana. U sezoni posla ima na svakom koraku." },
  { name: "Suzana", employer: "India House", place: "Chicago, Illinois", summary: "Smeštaj je bio besplatan, pet minuta hoda od posla. Radila je duge smene i drugi posao joj nije trebao." },
  { name: "Juka", employer: "Safety Park", place: "Los Angeles, California", summary: "Radio je na parkiranju automobila, uz napojnice koje su znatno podizale zaradu." },
  { name: "Zoran", employer: "Piping Rock Club", place: "Locust Valley, New York", summary: "Posao u kuhinji golf kluba, oko 50 sati nedeljno. Dodatni posao se lako nalazi u okolnim klubovima." },
  { name: "Sandra Tasevski", employer: "Waldorf Astoria", place: "Park City, Utah", summary: "Ističe ljubaznost tima i to što je ceo proces objašnjen unapred, bez iznenađenja." },
  { name: "Tamara", employer: "Premier Pool Management", place: "Silver Spring, Maryland", summary: "Radila je kao spasilac. Zadovoljna je agencijom i poslodavcem, a jedina zamerka je udaljenost od grada." },
  { name: "Dušan", employer: "Joe's Crab Shack", place: "Destin, Florida", summary: "Mnogo studenata i dovoljno posla za sve. Menadžere opisuje kao korektne." },
  { name: "Katarina", employer: "Empire Burger", place: "Breckenridge, Colorado", summary: "Poslodavac je bio ljubazan i spreman da pomogne. Planira da se vrati i sledeće godine." },
  { name: "Luka Rosić", employer: "Timberline Lodge", place: "Government Camp, Oregon", summary: "Pohvalio je brze odgovore agencije. Za sam posao kaže da je satnica bila skromna i da je prekovremenog rada bilo malo." },
  { name: "Teodora", employer: "Glen Cove Inn", place: "Rockport, Maine", summary: "Papiri za vizu su kasnili zbog partnerske agencije, ali je tim sve vreme bio strpljiv i dostupan." },
  { name: "Uroš Lastić", employer: "Boardwalk Restaurant", place: "Lake George, New York", summary: "Mnogo prilika za dodatni posao, lepo vreme i ljubazni meštani." },
].map((item) => ({ program: PROGRAM, ...item }));

export default experiencesPage;
