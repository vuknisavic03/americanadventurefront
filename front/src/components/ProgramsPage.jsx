// ProgramsPage.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import jobItems from "../data/jobItems";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

const ALL_PROGRAMS = [
  {
    id: "work-and-travel",
    title: "Work and Travel USA 2026/2027",
    tagline: "Najpopularniji program kulturne razmene studenata u SAD",
    category: "Studenti (Redovni)",
    duration: "4 meseca rada + 30 dana putovanja (grace period)",
    destination: "Širom SAD (Kalifornija, Florida, Aljaska, Mejn, Kolorado, itd.)",
    earnings: "$14.00 – $22.00 / sat (+ bakšiš i prekovremeni rad)",
    badge: "Najpopularnije",
    description:
      "Work and Travel USA je zvanični program Vlade SAD (State Department) koji redovnim studentima omogućava legalan boravak i rad tokom letnjeg raspusta, kao i do 30 dana putovanja po završetku radnog dela.",
    highlights: [
      "J-1 viza i zvanični obrazac DS-2019 obezbeđeni preko ovlašćenog sponzora",
      "Doživotni Social Security Number (SSN)",
      "Provereni poslodavci i obezbeđen ili asistiran smeštaj",
      "Zdravstveno osiguranje tokom celog trajanja programa",
      "Mogućnost povraćaja plaćenog poreza po povratku u Srbiju",
    ],
    hasJobs: true,
    hasFaq: true,
  },
  {
    id: "internship",
    title: "Internship & Training USA",
    tagline: "Stručna praksa za studente završnih godina i diplomce",
    category: "Diplomci & Apsolventi",
    duration: "6 do 12 meseci (Internship) / do 18 meseci (Training)",
    destination: "Vodeći gradovi i hotelsko-poslovni lanci u SAD",
    earnings: "$2.500 – $4.000 / mesečno",
    badge: "Karijera",
    description:
      "Program profesionalnog usavršavanja u vodećim američkim kompanijama iz oblasti hotelijerstva, IT-ja, marketinga, finansija, arhitekture i inženjeringa.",
    highlights: [
      "Zvanični Training Plan (DS-7002) usklađen sa vašom strukom",
      "Mentorstvo od strane iskusnih američkih menadžera",
      "Prestižna stavka u biografiji priznata širom sveta",
      "Mogućnost produžetka ili prelaska na radne vize u saradnji sa poslodavcem",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "high-school",
    title: "High School USA",
    tagline: "Školska godina u američkoj srednjoj školi",
    category: "Srednjoškolci (15–18 god.)",
    duration: "Jedan semestar ili puna školska godina",
    destination: "Pažljivo selektovane američke porodice domaćini",
    earnings: "Edukativno iskustvo",
    badge: "Mladi",
    description:
      "Jedinstvena prilika za učenike srednjih škola da provedu polugodište ili celu školsku godinu u SAD, pohađaju američku srednju školu i žive kod proverene porodice domaćina.",
    highlights: [
      "Potpuno usavršavanje engleskog jezika na nivou maternjeg",
      "Priznavanje položenih predmeta i ocena u Srbiji po povratku",
      "Porodica domaćin obezbeđuje hranu, smeštaj i sigurnost",
      "Sticanje samostalnosti i prijatelja za ceo život",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "au-pair",
    title: "Au Pair USA",
    tagline: "Boravak u američkoj porodici uz brigu o deci i stipendiju",
    category: "Devojke (18–26 god.)",
    duration: "12 meseci (uz opciju produžetka na još 6, 9 ili 12 meseci)",
    destination: "Porodice širom SAD",
    earnings: "Min. $195.75 nedeljni džeparac + $500 fond za koledž",
    badge: "Kultura",
    description:
      "Tradicionalni program kulturne razmene koji devojkama omogućava život u američkoj porodici, gde brinu o deci, pohađaju kurseve na lokalnom koledžu i primaju nedeljni džeparac.",
    highlights: [
      "Besplatan smeštaj (zasebna soba) i ishrana u porodici",
      "Plaćena povratna avionska karta do SAD",
      "Dve nedelje plaćenog godišnjeg odmora za putovanja",
      "Podrška lokalnog koordinatora tokom celog boravka",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "h2b",
    title: "H-2B Program u Americi",
    tagline: "Sezonski poslovi za kandidate bez studentskog statusa",
    category: "Svi kandidati (18–50 god.)",
    duration: "Od 3 do 10 meseci (prema sezoni)",
    destination: "Resorti, ugostiteljstvo, zabavni parkovi i pejzažna arhitektura",
    earnings: "$15.00 – $24.00 / sat",
    badge: "Sezonski rad",
    description:
      "Radni program za privremeni nekvalifikovani i polukvalifikovani rad u SAD za kandidate koji nisu studenti, po odobrenoj H-2B peticiji američkog poslodavca.",
    highlights: [
      "Legalna privremena radna viza H-2B",
      "Poslodavac pokriva troškove radne dozvole i sponzorstva",
      "Obezbeđen smeštaj po pristupačnim cenama",
      "Mogućnost povratka više uzastopnih sezona kod istog poslodavca",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "australia",
    title: "Australia Work Program",
    tagline: "Stručna praksa i rad na drugom kraju sveta",
    category: "Studenti i diplomci",
    duration: "6 do 12 meseci",
    destination: "Sidnej, Melburn, Brizbejn, Gold Koust",
    earnings: "AUD $25.00 – $35.00 / sat",
    badge: "Australija",
    description:
      "Iskusite fascinantni kontinent Australiju kroz programe plaćene stručne prakse i usavršavanja u ugostiteljstvu, turizmu i poslovanju.",
    highlights: [
      "Visok životni standard i jedne od najviših minimalnih zarada na svetu",
      "Rad u vrhunskim australijskim hotelima i turističkim rizortima",
      "Mogućnost istraživanja Velikog koralnog grebena i okeana",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "avio-karte",
    title: "Avio Karte za SAD i svet",
    tagline: "Specijalne cene avio karata za J-1 studente i mlade",
    category: "Svi putnici",
    duration: "Fleksibilni datumi promene",
    destination: "Sve destinacije u SAD, Kanadi i svetu",
    earnings: "Ušteda do 30% na fleksibilnim tarifama",
    badge: "Putovanja",
    description:
      "Kao ovlašćena agencija sarađujemo direktno sa najvećim avio-kompanijama (Lufthansa, Air France, KLM, United, Delta, Air Serbia) i obezbeđujemo posebne omladinske i J-1 tarife sa uključenim prtljagom i povoljnim uslovima promene datuma.",
    highlights: [
      "Uključena 2 komada predatih kofera (2x 23kg) na odabranim tarifama",
      "Besplatna ili povoljna promena povratnog leta tokom sezone",
      "Pomoć i asistencija 24/7 u slučaju otkazivanja ili kašnjenja letova",
      "Kombinovanje različitih gradova dolaska i odlaska (open-jaw)",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "povracaj-poreza",
    title: "Povraćaj Poreza iz USA (Tax Refund)",
    tagline: "Vratite sav porez koji ste platili tokom rada u SAD",
    category: "Bivši učesnici J-1 / H-2B programa",
    duration: "Obrada 6–12 nedelja",
    destination: "Isplata direktno na vaš devizni račun",
    earnings: "Prosečan povraćaj: $800 – $1.500",
    badge: "Porez",
    description:
      "Kao student na J-1 vizi ne podležete porezima za Social Security i Medicare (FICA), a imate pravo i na povraćaj Federalnog i Državnog poreza (Federal & State income tax) u zavisnosti od zarađenog iznosa.",
    highlights: [
      "Stručna priprema poreskih prijava za IRS i državne poreske uprave",
      "Besplatna procena iznosa povraćaja pre podnošenja zahteva",
      "Mogućnost prijave i sa poslednjeg platnog isečka (Paystub)",
      "Praćenje statusa predmeta do konačne uplate",
    ],
    hasJobs: false,
    hasFaq: false,
  },
  {
    id: "viza-servis",
    title: "Viza Servis – SAD",
    tagline: "Stručna priprema i asistencija za vize za SAD",
    category: "Turisti, poslovni ljudi, porodice",
    duration: "Zakazivanje u najbržem slobodnom terminu",
    destination: "Konzulat SAD u Beogradu",
    earnings: "Stručna asistencija",
    badge: "Vize",
    description:
      "Kompletna asistencija za izradu DS-160 obrasca, uplatu MRV takse, zakazivanje termina u Ambasadi SAD i detaljna priprema dokumentacije i intervjua za B1/B2 turističke, F-1 studentske i J-1 vize.",
    highlights: [
      "Besprekorno popunjen DS-160 formular bez grešaka",
      "Pomoć oko kreiranja profila i zakazivanja termina",
      "Simulacija konzularnog intervjua i saveti za pripremu",
      "Višegodišnje iskustvo i preko 15.000 uspešno izdatih viza",
    ],
    hasJobs: false,
    hasFaq: false,
  },
];

const SWT_FAQS = [
  {
    q: "Ko može da se prijavi za Work and Travel USA?",
    a: "Pravo učešća imaju redovni studenti osnovnih ili master studija akreditovanih univerziteta i visokih škola u Srbiji i regionu, starosti do 26-28 godina, koji imaju aktivan studentski status i položen dovoljan broj ispita.",
  },
  {
    q: "Koliki nivo engleskog jezika je potreban?",
    a: "Potrebno je konverzacijsko znanje engleskog jezika (srednji nivo, B1/B2). Nije potreban formalni TOEFL ili IELTS sertifikat; nivo se proverava tokom kratkog intervjua u našoj agenciji.",
  },
  {
    q: "Kada program počinje i do kada traje?",
    a: "Radni deo programa počinje najranije 21. maja, a završava se 1. oktobra. Nakon toga, studenti imaju pravo na još do 30 dana putovanja (grace period) po SAD.",
  },
  {
    q: "Da li mogu sam da nađem posao (Self opcija)?",
    a: "Da, agencija American Adventure nudi i Full opciju (gde vam mi obezbeđujemo proverenog poslodavca i posao) i Self opciju (gde sami obezbeđujete posao, a agencija i sponzor proveravaju poslodavca i izdaju DS-2019 dokument).",
  },
  {
    q: "Mogu li raditi drugi posao u SAD?",
    a: "Da! Mnogi studenti nakon što ispune satnicu na primarnom poslu pronalaze drugi posao (npr. u restoranima ili kafićima). Drugi posao mora biti prijavljen i odobren od strane američkog sponzora.",
  },
];

export default function ProgramsPage({ onNavigate = () => {}, initialProgramId = "work-and-travel" }) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState(initialProgramId);
  const [jobCategory, setJobCategory] = useState("all");
  const [jobSearch, setJobSearch] = useState("");
  const translateOrDefault = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const currentProgram = ALL_PROGRAMS.find((p) => p.id === selectedId) || ALL_PROGRAMS[0];

  const goApply = (programId) => (e) => {
    e.preventDefault();
    onNavigate(e, `/prijava-online?program=${programId}`);
  };

  const filteredJobs = jobItems.filter((j) => {
    const matchCat = jobCategory === "all" || j.category.toLowerCase().includes(jobCategory.toLowerCase());
    const matchSearch =
      !jobSearch ||
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.city.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.employer.toLowerCase().includes(jobSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="bg-white">
      {/* Glavno zaglavlje */}
      <section className="border-b border-black/10 bg-black/[0.02] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
            {translateOrDefault("prog.kicker", "American Adventure Ponuda")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-6xl">
            {translateOrDefault("prog.title", "Programi i usluge")}
          </h1>
          <span className="mx-auto mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--brand-ink)]/70 sm:text-lg">
            {translateOrDefault(
              "prog.subtitle",
              "Izaberite program koji odgovara vašim akademskim ciljevima i željama za putovanjem. Svi programi su u celosti podržani od strane našeg tima."
            )}
          </p>
        </div>
      </section>

      {/* Traka za selekciju programa (Tabovi) */}
      <section className="sticky top-[4.5rem] z-20 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {ALL_PROGRAMS.map((prog) => {
              const active = prog.id === selectedId;
              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => setSelectedId(prog.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold tracking-tight transition-all duration-150 ${
                    active
                      ? "bg-[var(--brand-ink)] text-white shadow-xs"
                      : "text-[var(--brand-ink)]/70 hover:bg-black/5 hover:text-[var(--brand-ink)]"
                  }`}
                >
                  {prog.title.split(" ")[0]} {prog.title.split(" ")[1] || ""}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Glavni detalj izabranog programa */}
      <main className="mx-auto max-w-6xl px-6 py-14 sm:px-10 sm:py-20">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                >
                  {currentProgram.badge}
                </span>
                <span className="text-xs font-semibold text-[var(--brand-ink)]/50">
                  {currentProgram.category}
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl">
                {currentProgram.title}
              </h2>
              <p className="mt-3 text-lg font-medium text-[var(--brand-ink)]/75">
                {currentProgram.tagline}
              </p>
            </div>

            {/* VELIKO CTA DUGME ZA PRIJAVU (Prilog 1B, tačka 5) */}
            <div className="w-full shrink-0 lg:w-auto">
              <a
                href={`/prijava-online?program=${currentProgram.id}`}
                onClick={goApply(currentProgram.id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-extrabold uppercase tracking-[0.08em] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:w-auto"
                style={{ backgroundColor: BRAND_YELLOW, color: INK }}
              >
                <span>PRIJAVI SE ZA OVAJ PROGRAM</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Kartice sa ključnim parametrima */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/45">Trajanje</p>
              <p className="mt-2 text-sm font-extrabold text-[var(--brand-ink)]">{currentProgram.duration}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/45">Lokacija</p>
              <p className="mt-2 text-sm font-extrabold text-[var(--brand-ink)]">{currentProgram.destination}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/45">Zarada / Benefiti</p>
              <p className="mt-2 text-sm font-extrabold text-emerald-700">{currentProgram.earnings}</p>
            </div>
          </div>

          <div className="mt-10 max-w-3xl">
            <h3 className="text-xl font-extrabold text-[var(--brand-ink)]">O programu</h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--brand-ink)]/75">
              {currentProgram.description}
            </p>

            <h4 className="mt-8 text-base font-bold text-[var(--brand-ink)]">Ključne prednosti i uslovi:</h4>
            <ul className="mt-4 space-y-3">
              {currentProgram.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--brand-ink)]/80">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-yellow)] font-bold text-[var(--brand-ink)] text-xs">
                    ✓
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* WORK AND TRAVEL POSEBNE CELINE: BAZA POSLOVA I FAQ (Prilog 1B, tačka 2) */}
        {currentProgram.hasJobs && (
          <div id="baza-poslova" className="mt-20 scroll-mt-24 border-t border-black/10 pt-16">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--brand-ink)]/50">
                  Work and Travel ponuda
                </p>
                <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                  Baza poslova u SAD
                </h3>
                <p className="mt-2 max-w-xl text-sm text-[var(--brand-ink)]/65">
                  Pogledajte ponudu proverenih poslodavaca sa obezbeđenim smeštajem i odličnim satnicama.
                </p>
              </div>

              {/* Pretraga poslova */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Pretraži poslove, gradove..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs text-[var(--brand-ink)] placeholder:text-black/35 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-ink)]/15"
                />
                <select
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  className="rounded-xl border border-black/15 bg-white px-3 py-2.5 text-xs text-[var(--brand-ink)]"
                >
                  <option value="all">Sve kategorije</option>
                  <option value="bazen">Spasioci (Lifeguards)</option>
                  <option value="hotel">Hotelijerstvo / Domaćinstvo</option>
                  <option value="kuhinja">Kuhinja / Restoran</option>
                  <option value="zabavni">Zabavni parkovi</option>
                </select>
              </div>
            </div>

            {/* Mreža poslova */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.slice(0, 6).map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-black/25 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-700">{job.wage}</span>
                      <span className="text-[var(--brand-ink)]/50">{job.hoursPerWeek}</span>
                    </div>
                    <h4 className="mt-3 text-lg font-extrabold text-[var(--brand-ink)]">{job.title}</h4>
                    <p className="text-xs font-semibold text-[var(--brand-ink)]/60">{job.employer} · {job.city}</p>
                    <p className="mt-3 text-xs leading-relaxed text-[var(--brand-ink)]/70">{job.summary}</p>
                    <div className="mt-3 rounded-xl bg-black/[0.03] p-2.5 text-[0.72rem] text-[var(--brand-ink)]/65">
                      <strong>Smeštaj:</strong> {job.housing}
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-black/5">
                    <a
                      href={`/prijava-online?program=work-and-travel&job=${job.id}`}
                      onClick={goApply("work-and-travel")}
                      className="inline-flex w-full items-center justify-center rounded-full py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] transition-colors hover:bg-black/5"
                    >
                      Prijavi se za ovaj posao →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORK AND TRAVEL FAQ SEKCIJA (Prilog 1B, tačka 2) */}
        {currentProgram.hasFaq && (
          <div id="faq" className="mt-20 scroll-mt-24 border-t border-black/10 pt-16">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--brand-ink)]/50">
              Česta pitanja
            </p>
            <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
              FAQ – Work and Travel USA
            </h3>
            <div className="mt-8 space-y-4">
              {SWT_FAQS.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs">
                  <h4 className="text-base font-extrabold text-[var(--brand-ink)]">{faq.q}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--brand-ink)]/70">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
