// ProgramsPage.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import jobItems from "../data/jobItems";
import { Badge, Button, CheckIcon, ChevronDownIcon, Container, PageHeader, cx, inputSmCls } from "./ui";

// Podaci su usklađeni sa workandtravel.rs (stanje: novembar 2026). Cene su u USD osim gde piše drugačije.
const ALL_PROGRAMS = [
  {
    id: "work-and-travel",
    title: "Work and Travel USA 2027",
    tagline: "Leto rada i putovanja po Americi za redovne studente",
    category: "Redovni studenti, 19–26 godina",
    duration: "Do 4 meseca rada (21. maj – 10. oktobar) + 30 dana putovanja",
    destination: "Turistička mesta širom SAD: Cape Cod, Ocean City, Myrtle Beach, Park City, Aljaska, Havaji",
    earnings: "$10–20 po satu; prekovremeni rad se plaća 150%",
    price: "Self od $1.875 · Full od $2.275 · Lifeguard od $2.075",
    badge: "Najpopularnije",
    description:
      "Program kulturne razmene na J-1 vizi. Preko leta radiš sezonski posao u turističkom mestu, a posle toga imaš još 30 dana za putovanje. U Full paketu posao i smeštaj obezbeđujemo mi, u Self paketu posao nalaziš sam, a Lifeguard paket vodi na bazene u okolini Vašingtona i Bostona.",
    highlights: [
      "DS-2019 obrazac, SEVIS taksa i zdravstveno osiguranje su u ceni",
      "Priprema za intervju sa poslodavcem i za razgovor u ambasadi",
      "Besplatan prevod dokumentacije i obavezna orijentacija pred put",
      "Plaćanje na rate; poslednja rata najkasnije do 1. maja",
      "Viza ($185), avio karta i smeštaj plaćaju se posebno",
    ],
    hasJobs: true,
    hasFaq: true,
  },
  {
    id: "internship",
    title: "Internship & Training USA",
    tagline: "Plaćena stručna praksa i usavršavanje u struci",
    category: "Studenti završnih godina i diplomci",
    duration: "Internship do 12 meseci · Training do 18 meseci",
    destination: "San Francisko, Majami, Vašington, Čikago i drugi gradovi",
    earnings: "Plaćena praksa; otvorene pozicije od $10 do $16 po satu",
    price: "Na upit · viza $185 i SEVIS $220 plaćaju se posebno",
    badge: "Karijera",
    description:
      "Internship je za studente pri kraju studija i one koji su diplomirali pre manje od godinu dana. Training je za diplomce sa najmanje godinu dana iskustva u struci. Prijave su otvorene cele godine, a praksu nalazi sponzor (Full Placement) ili ti sam (Self Placement).",
    highlights: [
      "Oblasti: hotelijerstvo, gastronomija, IT, marketing, računovodstvo, grafički dizajn",
      "Zdravstveno osiguranje i podrška 24/7 tokom programa",
      "Intervjui sa poslodavcima uz pripremu našeg tima",
      "30 dana za putovanje po završetku programa",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "high-school",
    title: "High School USA 2027/28",
    tagline: "Polugodište ili školska godina u američkoj srednjoj školi",
    category: "Učenici od 14,5 do 18,5 godina",
    duration: "Polugodište ili cela školska godina; polazak u avgustu ili januaru",
    destination: "Državne škole i porodice domaćini širom SAD",
    earnings: "Nastava, smeštaj i ishrana u porodici domaćinu",
    price: "Godina $9.400 · polugodište $8.400 · prijava $95",
    badge: "Srednjoškolci",
    description:
      "Učenik pohađa američku državnu srednju školu i živi u proverenoj porodici domaćinu. Program vodi sponzorska organizacija CETUSA, koja od 1995. godine organizuje razmenu učenika. Rok za prijavu za školsku 2027/28. je 31. mart 2027.",
    highlights: [
      "Lokalni koordinator je najdalje 60 milja od učenika i javlja se svakog meseca",
      "Uslovi: tri godine učenja engleskog, ELTIS test i prosek iznad 3",
      "Plaćanje u tri rate: pri potpisivanju, po izboru porodice i pre vize",
      "Osiguranje, viza i avio karta plaćaju se posebno",
      "Škola i ministarstvo odlučuju o diplomi i priznavanju godine; to ne možemo da garantujemo",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "dual-diploma",
    title: "Dual Diploma — online",
    tagline: "Američka srednjoškolska diploma uz školu u Srbiji",
    category: "Srednjoškolci mlađi od 20 godina",
    duration: "Od 1 do 4 godine, najčešće 2–3",
    destination: "Online: Thornton Academy, Wayland Academy, Washington Academy",
    earnings: "Dve diplome: srpska i američka",
    price: "Školarina na upit · upis $300 · obnova upisa $200 godišnje",
    badge: "Online",
    description:
      "Učenik uz redovnu školu u Srbiji polaže šest predmeta u američkoj srednjoj školi, potpuno online i sopstvenim tempom. Program vodi Educatius Academy. Po jednom predmetu treba izdvojiti oko dva i po sata nedeljno.",
    highlights: [
      "Obavezni predmeti su engleski i istorija SAD, četiri su izborna",
      "Tutor dostupan 24/7 i povremeni časovi uživo",
      "Savetovanje za upis na više od 300 američkih fakulteta",
      "Roditelji imaju pristup platformi i prate napredak",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "au-pair",
    title: "Au Pair USA",
    tagline: "Godina u američkoj porodici uz čuvanje dece",
    category: "Kandidati od 18 do 26 godina",
    duration: "12 meseci, uz produženje od 6, 9 ili 12 meseci",
    destination: "Porodice domaćini širom SAD",
    earnings: "Oko $195 nedeljno i $500 za kurs na koledžu",
    price: "$735 u dve rate",
    badge: "Porodica",
    description:
      "Živiš u američkoj porodici, brineš o deci dok su roditelji na poslu i pohađaš kurs na lokalnom koledžu. Porodica obezbeđuje smeštaj, ishranu i avio kartu u oba pravca. Potrebni su vozačka dozvola B kategorije i iskustvo u čuvanju dece.",
    highlights: [
      "Avio karta u oba pravca na račun porodice",
      "Dve nedelje odmora i slobodan vikend najmanje jednom mesečno",
      "Zdravstveno osiguranje tokom programa",
      "Mesec dana za putovanje po završetku",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "h2b",
    title: "H-2B program u Americi",
    tagline: "Sezonski rad za kandidate koji nisu studenti",
    category: "Kandidati od 20 do 45 godina",
    duration: "Do 6 meseci",
    destination: "Njujork i Majami",
    earnings: "Zavisi od poslodavca i sezone",
    price: "Poslodavac refundira avio kartu i trošak intervjua",
    badge: "Prijave zatvorene",
    description:
      "Privremeni sezonski posao na H-2B vizi kod američkog poslodavca. Prijave trenutno nisu otvorene. Ostavi kontakt i javićemo ti kada poslodavac objavi novu sezonu.",
    highlights: [
      "Viza H-2B za privremeni ili sezonski rad",
      "Potreban je konverzacijski engleski",
      "Prednost imaju kandidati koji su već radili na H-2B vizi",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "australia",
    title: "Australia Training Program",
    tagline: "Stručno usavršavanje za kuvare u Australiji",
    category: "Kuvari sa školom ili godinom iskustva",
    duration: "12 do 18 meseci",
    destination: "Sidnej, Melburn, Brizbejn, Pert, Adelejd",
    earnings: "42.000–50.000 AUD godišnje",
    price: "$4.090 u tri rate",
    badge: "Australija",
    description:
      "Program za kuvare na Training vizi (podklasa 407). Potrebni su kulinarska škola ili najmanje 12 meseci plaćenog iskustva u poslednje dve godine i engleski na nivou IELTS 4.5. Obrada vize traje tri do četiri meseca.",
    highlights: [
      "Nema starosne granice",
      "Najveći deo cene plaća se tek po potpisivanju radne ponude",
      "Sponzor plaća prve tri noći smeštaja",
      "Avio karta, osiguranje i lekarski pregled plaćaju se posebno",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "online-internship",
    title: "Online Internship",
    tagline: "Praksa u američkoj kompaniji, od kuće",
    category: "Punoletni kandidati sa engleskim B2",
    duration: "3 do 6 meseci, 20 ili 40 sati nedeljno",
    destination: "Rad na daljinu za kompanije u SAD",
    earnings: "Bonus $100–200 mesečno, isplata na kraju programa",
    price: "Depozit $500 + $1.100 kada se nađe pozicija",
    badge: "Na daljinu",
    description:
      "Stručna praksa na daljinu u malim i srednjim američkim kompanijama, bez vize i troškova puta. Na kraju dobijaš sertifikat i preporuku za biografiju.",
    highlights: [
      "Intervju sa kompanijom preko video poziva",
      "Orijentacija, mesečni vebinari i izveštaji o napretku",
      "Potreban je računar sa kamerom i stabilan internet",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "avio-karte",
    title: "Avio karte",
    tagline: "Karte za učesnike programa i sve ostale putnike",
    category: "Svi putnici",
    duration: "Kupovina moguća i pre viziranja",
    destination: "SAD i ostale destinacije",
    earnings: "Pun povraćaj novca ako viza ne bude odobrena",
    price: "Na upit: aviokarte@workandtravel.rs",
    badge: "Putovanja",
    description:
      "Posredujemo pri kupovini avio karte za sve naše programe. Učesnici mogu da kupe kartu pre razgovora u ambasadi, a ako viza ne bude odobrena, iznos se vraća u celosti.",
    highlights: [
      "Ranija kupovina obično znači nižu cenu",
      "Promenu datuma povratka najavi najmanje tri nedelje ranije",
      "Pre puta proveri dozvoljenu težinu prtljaga za svoju tarifu",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "povracaj-poreza",
    title: "Povraćaj poreza iz SAD",
    tagline: "Za sve koji su radili u Americi na J-1 vizi",
    category: "Bivši učesnici programa",
    duration: "Obrazac W-2 stiže od poslodavca do 31. januara",
    destination: "Prijava se podnosi po povratku u Srbiju",
    earnings: "Iznos zavisi od zarade i savezne države",
    price: "Na upit",
    badge: "Porez",
    description:
      "Deo poreza plaćenog tokom rada u SAD može da se vrati. Pomažemo ti da pripremiš i podneseš prijavu po povratku.",
    highlights: [
      "Potrebni su kopija SSN kartice i kopija pasoša",
      "Obrazac W-2 ili poslednji platni listić",
      "Na obrascu W-4 upiši adresu u Srbiji, da W-2 stigne na pravu adresu",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "viza-servis",
    title: "Viza servis — SAD",
    tagline: "Priprema dokumentacije i zakazivanje termina u ambasadi",
    category: "Turisti, poslovni ljudi, porodice",
    duration: "Od konsultacija do termina u ambasadi",
    destination: "Ambasada SAD u Beogradu",
    earnings: "Vize B1/B2, F1, J1/J2, H-2B, C1-D",
    price: "12.000 RSD po osobi · Green Card lutrija 6.000 RSD",
    badge: "Vize",
    description:
      "Pomažemo oko obrasca DS-160, uplate takse, otvaranja naloga i zakazivanja razgovora. Odluku o vizi donosi isključivo ambasada, a uplaćena usluga se ne vraća.",
    highlights: [
      "Uputstva i spisak dokumenata dobijaš e-poštom",
      "Potrebni su fotografija 5×5 cm i pasoš koji važi još šest meseci",
      "Deca mlađa od 14 godina ne idu na razgovor",
    ],
    hasJobs: false,
    hasFaq: false,
  },
];

const SWT_FAQS = [
  {
    q: "Ko može da se prijavi?",
    a: "Redovni studenti od 19 do 26 godina koji su tekuću godinu upisali prvi put. Brucoši mogu ako nisu pravili pauzu posle srednje škole i ako su položili bar polovinu ispita predviđenih za taj deo godine. Minimalnog proseka nema.",
  },
  {
    q: "Koliko mogu da zaradim?",
    a: "Satnice su najčešće od 10 do 20 dolara, a svaki sat preko 40 nedeljno plaća se 50% više. Radi se obično 32 do 40 sati nedeljno. Broj sati i zaradu niko ne može da garantuje unapred.",
  },
  {
    q: "Šta je radna ponuda (Job Offer)?",
    a: "Dokument koji dobijaš pre puta. U njemu su poslodavac, posao, satnica, radno vreme i uslovi smeštaja. Potpisom prihvataš ta prava i obaveze.",
  },
  {
    q: "Mogu li da radim drugi posao?",
    a: "Možeš, ali tek kada ga sponzor odobri. Prvi posao ostaje prioritet. Rad kod poslodavca koga sponzor nije odobrio može da dovede do prekida programa.",
  },
  {
    q: "Da li je smeštaj obezbeđen i koliko košta?",
    a: "U Full paketu smeštaj je deo radne ponude. Plaća se posebno, obično od 50 do 200 dolara nedeljno, a u velikim gradovima više. U Self paketu smeštaj nalaziš sam i sponzor mora da ga odobri.",
  },
  {
    q: "Koju vizu dobijam i može li da se produži?",
    a: "J-1 vizu. Dozvoljava do četiri meseca rada i još mesec dana putovanja. Ne može da se produži.",
  },
  {
    q: "Šta ako viza ne bude odobrena?",
    a: "Ako ispunjavaš uslove programa, vraćamo ti uplaćeni novac. I avio karta kupljena preko nas vraća se u celosti.",
  },
  {
    q: "Mogu li ponovo na program?",
    a: "Možeš, ako si se prošli put vratio pre isteka vize i ako redovno polažeš ispite.",
  },
];

const JOB_CATEGORIES = [
  { value: "all", label: "Sve kategorije" },
  { value: "bazen", label: "Spasioci (Lifeguards)" },
  { value: "hotel", label: "Hotelijerstvo / Domaćinstvo" },
  { value: "kuhinja", label: "Kuhinja / Restoran" },
  { value: "zabavni", label: "Zabavni parkovi" },
];

const JOBS_PREVIEW = 6;

// Kratak naziv za tab: pun naziv programa bez godine.
const tabLabel = (title) => title.replace(/\s*20\d\d(\/(20)?\d\d)?/, "");

/**
 * ProgramsPage — svi programi i usluge (Prilog 1B, tačka 2).
 * Tabovi biraju program; Work and Travel ima i bazu poslova i česta pitanja.
 *
 * Props: initialProgramId (iz ?program=), initialSearch (iz ?search= — pretraga iz zaglavlja), onNavigate
 */
export default function ProgramsPage({ onNavigate = () => {}, initialProgramId = "work-and-travel", initialSearch = "" }) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState(() => {
    if (ALL_PROGRAMS.some((p) => p.id === initialProgramId)) return initialProgramId;
    // Pretraga iz zaglavlja: ako upit pogađa naziv programa, otvori taj program.
    const q = initialSearch.trim().toLowerCase();
    const hit = q && ALL_PROGRAMS.find((p) => `${p.title} ${p.tagline}`.toLowerCase().includes(q));
    return hit ? hit.id : "work-and-travel";
  });
  const [jobCategory, setJobCategory] = useState("all");
  const [jobSearch, setJobSearch] = useState(initialSearch);
  const [showAllJobs, setShowAllJobs] = useState(false);

  const tr = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const program = ALL_PROGRAMS.find((p) => p.id === selectedId) || ALL_PROGRAMS[0];
  const applyHref = `/prijava-online?program=${program.id}`;

  // Pretraga iz zaglavlja vodi pravo na rezultate u bazi poslova.
  useEffect(() => {
    if (!initialSearch || !program.hasJobs) return;
    const timer = setTimeout(() => document.getElementById("baza-poslova")?.scrollIntoView({ behavior: "smooth" }), 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const query = jobSearch.trim().toLowerCase();
  const filteredJobs = jobItems.filter((j) => {
    const matchCat = jobCategory === "all" || j.category.toLowerCase().includes(jobCategory);
    const matchSearch = !query || [j.title, j.city, j.employer, j.summary].some((v) => (v || "").toLowerCase().includes(query));
    return matchCat && matchSearch;
  });
  const visibleJobs = showAllJobs ? filteredJobs : filteredJobs.slice(0, JOBS_PREVIEW);

  const facts = [
    { label: "Trajanje", value: program.duration },
    { label: "Lokacija", value: program.destination },
    { label: "Šta dobijaš", value: program.earnings },
    ...(program.price ? [{ label: "Cena", value: program.price }] : []),
  ];

  return (
    <div className="bg-white">
      <PageHeader
        title={tr("prog.title", "Programi i usluge")}
        lead={tr(
          "prog.subtitle",
          "Izaberite program koji odgovara vašim akademskim ciljevima i željama za putovanjem. Svi programi su u celosti podržani od strane našeg tima."
        )}
      />

      {/* Izbor programa */}
      <nav aria-label="Programi" className="sticky top-16 z-20 border-b border-line bg-white lg:top-[72px]">
        <Container>
          <div className="no-scrollbar -mx-2 flex gap-1 overflow-x-auto py-3">
            {ALL_PROGRAMS.map((prog) => {
              const active = prog.id === selectedId;
              return (
                <button
                  key={prog.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(prog.id)}
                  className={cx(
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150",
                    active ? "bg-ink text-white" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
                  )}
                >
                  {tabLabel(prog.title)}
                </button>
              );
            })}
          </div>
        </Container>
      </nav>

      <Container className="py-14 sm:py-20">
        {/* Izabrani program */}
        <article className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              {program.badge && <Badge tone="brand">{program.badge}</Badge>}
              <span className="text-sm text-ink-3">{program.category}</span>
            </div>
            <h2 className="font-display mt-4 text-3xl font-bold leading-[1.08] text-ink sm:text-4xl">{program.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-2 sm:text-xl">{program.tagline}</p>

            <p className="mt-8 text-base leading-relaxed text-ink">{program.description}</p>

            <h3 className="mt-10 text-base font-semibold text-ink">Ključne prednosti i uslovi</h3>
            <ul className="mt-4 space-y-3">
              {program.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
                    <CheckIcon className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-3xl bg-surface p-7 sm:p-8 lg:sticky lg:top-40">
              <dl className="divide-y divide-line">
                {facts.map((fact) => (
                  <div key={fact.label} className="py-4 first:pt-0">
                    <dt className="text-sm text-ink-3">{fact.label}</dt>
                    <dd className="mt-1 text-base font-medium leading-snug text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {/* Glavna akcija strane (Prilog 1B, tačka 5) */}
              <Button size="lg" block className="mt-4" href={applyHref} onClick={(e) => onNavigate(e, applyHref)}>
                Prijavi se za ovaj program
              </Button>
              <p className="mt-3 text-center text-[13px] text-ink-3">Prijava je besplatna i ne obavezuje.</p>
            </div>
          </aside>
        </article>

        {/* Baza poslova (Prilog 1B, tačka 2) */}
        {program.hasJobs && (
          <section id="baza-poslova" className="mt-20 scroll-mt-36 border-t border-line pt-16">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl font-bold text-ink">Baza poslova u SAD</h2>
                <p className="mt-3 text-base leading-relaxed text-ink-2">
                  Ponuda proverenih poslodavaca sa obezbeđenim smeštajem i odličnim satnicama.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <input
                  type="search"
                  placeholder="Pretraži poslove, gradove…"
                  aria-label="Pretraga poslova"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className={cx(inputSmCls, "sm:w-64")}
                />
                <select
                  value={jobCategory}
                  aria-label="Kategorija posla"
                  onChange={(e) => setJobCategory(e.target.value)}
                  className={cx(inputSmCls, "sm:w-56")}
                >
                  {JOB_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-surface px-6 py-12 text-center">
                <p className="text-base text-ink">Nijedan posao ne odgovara pretrazi.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setJobSearch("");
                    setJobCategory("all");
                  }}
                >
                  Prikaži sve poslove
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleJobs.map((job) => {
                    const jobHref = `/prijava-online?program=work-and-travel&job=${job.id}`;
                    return (
                      <article key={job.id} className="flex flex-col rounded-2xl border border-line p-6">
                        <h3 className="text-lg font-semibold leading-snug text-ink">{job.title}</h3>
                        <p className="mt-1 text-sm text-ink-3">
                          {job.employer}, {job.city}
                        </p>
                        <p className="mt-4 flex items-baseline gap-3 tabular-nums">
                          <span className="text-base font-semibold text-ink">{job.wage}</span>
                          <span className="text-sm text-ink-3">{job.hoursPerWeek}</span>
                        </p>
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-2">{job.summary}</p>
                        <p className="mt-4 border-t border-line pt-4 text-sm text-ink-2">
                          <span className="text-ink-3">Smeštaj:</span> {job.housing}
                        </p>
                        <a
                          href={jobHref}
                          onClick={(e) => onNavigate(e, jobHref)}
                          className="mt-4 self-start text-sm font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:decoration-ink"
                        >
                          Prijavi se za ovaj posao
                        </a>
                      </article>
                    );
                  })}
                </div>
                {filteredJobs.length > JOBS_PREVIEW && (
                  <div className="mt-8 text-center">
                    <Button variant="outline" onClick={() => setShowAllJobs((v) => !v)}>
                      {showAllJobs ? "Prikaži manje" : `Prikaži sve poslove (${filteredJobs.length})`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Česta pitanja (Prilog 1B, tačka 2) */}
        {program.hasFaq && (
          <section id="faq" className="mt-20 scroll-mt-36 border-t border-line pt-16">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <h2 className="font-display text-3xl font-bold text-ink lg:col-span-4">Česta pitanja</h2>
              <div className="divide-y divide-line border-y border-line lg:col-span-8">
                {SWT_FAQS.map((faq) => (
                  <details key={faq.q} className="group">
                    <summary className="flex list-none items-center justify-between gap-6 py-5 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      {faq.q}
                      <ChevronDownIcon className="h-4 w-4 shrink-0 text-ink-3 transition-transform duration-150 group-open:rotate-180" />
                    </summary>
                    <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-ink-2">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}
