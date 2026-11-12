// UsaHighlights.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

const USA_FACTS = [
  {
    id: "tipping",
    title: "Kultura napojnica (Tipping)",
    icon: "01",
    summary: "Napojnica u SAD iznosi 15–20% i predstavlja ključan deo zarade u ugostiteljstvu.",
    text: "U američkoj kulturi bakšiš nije samo nagrada za izvanrednu uslugu, već osnovni izvor prihoda za konobare, food runnere i barmene. Studenti na server pozicijama često ostvaruju više stotina dolara nedeljno samo od napojnica.",
    tag: "Finansije & Posao",
  },
  {
    id: "national-parks",
    title: "Nacionalni parkovi i prostranstva",
    icon: "02",
    summary: "SAD ima 63 spektakularna nacionalna parka — od Yellowstone-a do Grand Canyon-a.",
    text: "Septembar je mesec putovanja (grace period). Studenti koriste zaradu da obiđu čuvene nacionalne parkove: Yosemite, Zion, Grand Canyon, Yellowstone i Rocky Mountains. Godišnja karta 'America the Beautiful' omogućava neograničen ulaz u sve parkove.",
    tag: "Putovanja",
  },
  {
    id: "ssn",
    title: "Social Security Number (SSN)",
    icon: "03",
    summary: "Vaš doživotni američki matični broj koji ostaje važeći zauvek.",
    text: "Svaki učesnik Work and Travel programa u prvim nedeljama dobija svoj SSN. Ovaj broj je trajan — ako se ikada vratite u SAD na praksu, master ili turistički, vaš SSN ostaje isti i služi za legalan rad i povraćaj poreza.",
    tag: "Dokumenta",
  },
  {
    id: "shopping",
    title: "Outleti i praznični popusti",
    icon: "04",
    summary: "Premium Outlets nude popuste do 70%, naročito za 4th of July i Labor Day.",
    text: "Kupovina tehnike, brendirane garderobe i sportske opreme u SAD je znatno povoljnija nego u Evropi. Tokom velikih praznika poput 4. jula i Labor Day-a (prvi vikend septembra), popusti dostižu vrhunac.",
    tag: "Šoping",
  },
  {
    id: "roadtrip",
    title: "Američki Road Trip & Route 66",
    icon: "05",
    summary: "Vožnja kroz beskrajne autoputeve je suština američkog načina života.",
    text: "Iznajmljivanje automobila sa kolegama studentima najpopularniji je način istraživanja. Od kultne rute Route 66 do Pacific Coast Highway-a u Kaliforniji, putevi su široki, gorivo povoljno, a pejzaži filmski.",
    tag: "Avantura",
  },
  {
    id: "connectivity",
    title: "Otključane mreže i SIM kartice",
    icon: "06",
    summary: "Za boravak u SAD potreban je telefon sa otključanom mrežom i eSIM/nano-SIM podrškom.",
    text: "Pre polaska proverite da li je vaš telefon SIM-free. Po dolasku se aktiviraju J-1 studentski paketi kod provajdera poput T-Mobile, Mint Mobile ili AT&T sa neograničenim internetom i pozivima unutar SAD.",
    tag: "Komunikacija",
  },
];

const US_STATES = [
  {
    id: "california",
    name: "Kalifornija (California)",
    abbr: "CA",
    cities: "Lake Tahoe, San Francisco, San Diego, Santa Cruz",
    type: "Zapadna obala / Pacifik",
    wageRange: "$16.50 – $21.00 / sat",
    highlights: "Jezero Tahoe, surfovanje, nacionalni parkovi, sunčano vreme i visoke satnice.",
    imageSeed: "california-tahoe",
  },
  {
    id: "florida",
    name: "Florida (Sunshine State)",
    abbr: "FL",
    cities: "Destin, Panama City Beach, Orlando, Key West",
    type: "Jugoistok / Atlantik & Zaliv",
    wageRange: "$14.00 – $18.00 / sat + bakšiš",
    highlights: "Plaže sa belim peskom, luksuzni rizorti, golf tereni, topla klima bez zime.",
    imageSeed: "florida-beach",
  },
  {
    id: "alaska",
    name: "Aljaska (Alaska)",
    abbr: "AK",
    cities: "Anchorage, Denali, Seward, Skagway",
    type: "Sever / Divljina",
    wageRange: "$17.00 – $22.00 / sat + prekovremeni",
    highlights: "Netaknuta priroda, glečeri, polarni dani, ogroman potencijal za prekovremeni rad (overtime).",
    imageSeed: "alaska-glacier",
  },
  {
    id: "colorado",
    name: "Kolorado (Colorado)",
    abbr: "CO",
    cities: "Vail, Aspen, Estes Park, Breckenridge",
    type: "Planinska regija / Rocky Mountains",
    wageRange: "$16.00 – $20.00 / sat",
    highlights: "Elitni planinski turizam, svež vazduh, planinarenje, rafting i visoki standard života.",
    imageSeed: "colorado-mountains",
  },
  {
    id: "maine",
    name: "Mejn & Nova Engleska (Maine)",
    abbr: "ME",
    cities: "Ogunquit, Bar Harbor, Kennebunkport",
    type: "Severoistok / Nova Engleska",
    wageRange: "$15.00 – $18.50 / sat + visoki bakšiši",
    highlights: "Istorijski primorski gradići, jastozi, Acadia National Park, ekskluzivni turisti sa istočne obale.",
    imageSeed: "maine-coast",
  },
  {
    id: "wisconsin",
    name: "Viskonsin (Wisconsin)",
    abbr: "WI",
    cities: "Wisconsin Dells, Lake Geneva",
    type: "Srednji zapad",
    wageRange: "$14.50 – $17.50 / sat",
    highlights: "Svetska prestonica vodenih parkova, povoljan smeštaj, izuzetno druželjubiva J-1 zajednica.",
    imageSeed: "wisconsin-dells",
  },
  {
    id: "maryland",
    name: "Merilend (Maryland)",
    abbr: "MD",
    cities: "Ocean City",
    type: "Istočna obala",
    wageRange: "$15.00 – $17.00 / sat",
    highlights: "15 km peščanih plaža, čuveni Boardwalk, stotine restorana i hotela za drugi posao.",
    imageSeed: "ocean-city-beach",
  },
  {
    id: "texas",
    name: "Teksas (Texas)",
    abbr: "TX",
    cities: "Galveston, San Antonio, Austin",
    type: "Jug / Meksički zaliv",
    wageRange: "$14.00 – $18.00 / sat",
    highlights: "Niski troškovi života, autentična američka kultura, toplo more i gostoprimstvo.",
    imageSeed: "texas-coast",
  },
];

export default function UsaHighlights({ onNavigate = () => {} }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("facts"); // "facts" | "states"
  const translateOrDefault = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <section className="bg-[var(--brand-ink)]/[0.02] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        {/* Zaglavlje sekcije */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
              {translateOrDefault("usa.kicker", "Istražite Ameriku")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl">
              {activeTab === "facts"
                ? translateOrDefault("usa.factsTitle", "Zanimljivosti o USA")
                : translateOrDefault("usa.statesTitle", "Popularne države u SAD")}
            </h2>
            <p className="mt-4 text-base text-[var(--brand-ink)]/70 sm:text-lg">
              {activeTab === "facts"
                ? translateOrDefault("usa.factsSubtitle", "Praktični saveti, specifičnosti američke svakodnevice i kultura koje treba da znate pre polaska.")
                : translateOrDefault("usa.statesSubtitle", "Gde naši studenti najradije rade i borave? Upoznajte najpopularnije savezne države i njihove prilike.")}
            </p>
          </div>

          {/* Tab prekidač */}
          <div className="inline-flex rounded-full border border-black/10 bg-white p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("facts")}
              className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 ${
                activeTab === "facts"
                  ? "bg-[var(--brand-ink)] text-white shadow-xs"
                  : "text-[var(--brand-ink)]/65 hover:text-[var(--brand-ink)]"
              }`}
            >
              {translateOrDefault("usa.tabFacts", "Zanimljivosti")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("states")}
              className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 ${
                activeTab === "states"
                  ? "bg-[var(--brand-ink)] text-white shadow-xs"
                  : "text-[var(--brand-ink)]/65 hover:text-[var(--brand-ink)]"
              }`}
            >
              {translateOrDefault("usa.tabStates", "Države SAD")}
            </button>
          </div>
        </div>

        {/* TAB 1: ZANIMLJIVOSTI O USA */}
        {activeTab === "facts" && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {USA_FACTS.map((fact) => (
              <div
                key={fact.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-7 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-black/25 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-sm font-black text-[var(--brand-ink)]">
                      {fact.icon}
                    </span>
                    <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[0.7rem] font-bold text-[var(--brand-ink)]/60">
                      {fact.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold text-[var(--brand-ink)]">
                    {fact.title}
                  </h3>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--brand-ink)]/75">
                    {fact.summary}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--brand-ink)]/60">
                    {fact.text}
                  </p>
                </div>
                <div className="mt-6 border-t border-black/5 pt-3">
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--brand-ink)]/40">
                    American Adventure Guide
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: DRŽAVE SAD */}
        {activeTab === "states" && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {US_STATES.map((state) => (
              <div
                key={state.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-black/25 hover:shadow-md"
              >
                {/* Zaglavlje kartice */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-black"
                      style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                    >
                      {state.abbr}
                    </span>
                    <span className="text-[0.7rem] font-semibold text-[var(--brand-ink)]/50">
                      {state.type}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-extrabold text-[var(--brand-ink)]">
                    {state.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[var(--brand-ink)]/70">Gradovi: </span>
                      <span className="text-[var(--brand-ink)]/60">{state.cities}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[var(--brand-ink)]/70">Satnica: </span>
                      <span className="font-semibold text-emerald-700">{state.wageRange}</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-[var(--brand-ink)]/65">
                    {state.highlights}
                  </p>
                </div>

                {/* Dugme za prijavu */}
                <div className="border-t border-black/5 bg-black/[0.015] p-4 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(e, "/prijava-online?program=work-and-travel");
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors duration-150 hover:bg-black/10 text-[var(--brand-ink)]"
                  >
                    Prijavi se za ovu regiju →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
