// UsaHighlights.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { Container, SectionHeading, cx } from "./ui";

const USA_FACTS = [
  {
    id: "tipping",
    title: "Kultura napojnica (Tipping)",
    summary: "Napojnica u SAD iznosi 15–20% i predstavlja ključan deo zarade u ugostiteljstvu.",
    text: "U američkoj kulturi bakšiš nije samo nagrada za izvanrednu uslugu, već osnovni izvor prihoda za konobare, food runnere i barmene. Studenti na server pozicijama često ostvaruju više stotina dolara nedeljno samo od napojnica.",
    tag: "Finansije & Posao",
  },
  {
    id: "national-parks",
    title: "Nacionalni parkovi i prostranstva",
    summary: "SAD ima 63 spektakularna nacionalna parka — od Yellowstone-a do Grand Canyon-a.",
    text: "Septembar je mesec putovanja (grace period). Studenti koriste zaradu da obiđu čuvene nacionalne parkove: Yosemite, Zion, Grand Canyon, Yellowstone i Rocky Mountains. Godišnja karta 'America the Beautiful' omogućava neograničen ulaz u sve parkove.",
    tag: "Putovanja",
  },
  {
    id: "ssn",
    title: "Social Security Number (SSN)",
    summary: "Vaš doživotni američki matični broj koji ostaje važeći zauvek.",
    text: "Svaki učesnik Work and Travel programa u prvim nedeljama dobija svoj SSN. Ovaj broj je trajan — ako se ikada vratite u SAD na praksu, master ili turistički, vaš SSN ostaje isti i služi za legalan rad i povraćaj poreza.",
    tag: "Dokumenta",
  },
  {
    id: "shopping",
    title: "Outleti i praznični popusti",
    summary: "Premium Outlets nude popuste do 70%, naročito za 4th of July i Labor Day.",
    text: "Kupovina tehnike, brendirane garderobe i sportske opreme u SAD je znatno povoljnija nego u Evropi. Tokom velikih praznika poput 4. jula i Labor Day-a (prvi vikend septembra), popusti dostižu vrhunac.",
    tag: "Šoping",
  },
  {
    id: "roadtrip",
    title: "Američki Road Trip & Route 66",
    summary: "Vožnja kroz beskrajne autoputeve je suština američkog načina života.",
    text: "Iznajmljivanje automobila sa kolegama studentima najpopularniji je način istraživanja. Od kultne rute Route 66 do Pacific Coast Highway-a u Kaliforniji, putevi su široki, gorivo povoljno, a pejzaži filmski.",
    tag: "Avantura",
  },
  {
    id: "connectivity",
    title: "Otključane mreže i SIM kartice",
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

const TABS = [
  { id: "facts", key: "usa.tabFacts", fallback: "Zanimljivosti" },
  { id: "states", key: "usa.tabStates", fallback: "Države SAD" },
];

/**
 * UsaHighlights — praktične zanimljivosti o SAD i pregled država u kojima studenti rade
 * (Prilog 1B, tačka 7). Dva pogleda na istom mestu, prekidač u zaglavlju sekcije.
 */
export default function UsaHighlights({ onNavigate = () => {} }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("facts");

  const tr = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const applyHref = "/prijava-online?program=work-and-travel";
  const facts = activeTab === "facts";

  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeading
          title={facts ? tr("usa.factsTitle", "Zanimljivosti o USA") : tr("usa.statesTitle", "Popularne države u SAD")}
          lead={
            facts
              ? tr("usa.factsSubtitle", "Praktični saveti, specifičnosti američke svakodnevice i kultura koje treba da znate pre polaska.")
              : tr("usa.statesSubtitle", "Gde naši studenti najradije rade i borave? Upoznajte najpopularnije savezne države i njihove prilike.")
          }
          action={
            <div role="tablist" aria-label={tr("usa.kicker", "Istražite Ameriku")} className="inline-flex rounded-full bg-surface-2 p-1">
              {TABS.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={cx(
                      "rounded-full px-5 py-2 text-sm font-medium transition-colors duration-150",
                      selected ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
                    )}
                  >
                    {tr(tab.key, tab.fallback)}
                  </button>
                );
              })}
            </div>
          }
        />

        {facts ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {USA_FACTS.map((fact) => (
              <article key={fact.id} className="rounded-2xl bg-white p-7">
                <p className="text-[13px] font-semibold text-ink-2">{fact.tag}</p>
                <h3 className="font-display mt-2 text-xl font-extrabold leading-snug text-ink">{fact.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">{fact.summary}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{fact.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {US_STATES.map((state) => (
              <article key={state.id} className="flex flex-col rounded-2xl bg-white p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sign rounded-lg bg-brand px-2.5 py-1 text-3xl font-extrabold leading-none text-ink">{state.abbr}</span>
                  <span className="text-right text-[13px] text-ink-3">{state.type}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{state.name}</h3>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-ink-3">Gradovi</dt>
                    <dd className="text-ink">{state.cities}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-ink-3">Satnica</dt>
                    <dd className="font-semibold tabular-nums text-ink">{state.wageRange}</dd>
                  </div>
                </dl>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-2">{state.highlights}</p>
                <a
                  href={applyHref}
                  onClick={(e) => onNavigate(e, applyHref)}
                  className="mt-5 self-start text-sm font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:decoration-ink"
                >
                  Prijavi se za ovu regiju
                </a>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
