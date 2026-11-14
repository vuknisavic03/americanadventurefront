// UsaHighlights.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { Container, SectionHeading, cx } from "./ui";

const USA_FACTS = [
  {
    id: "tipping",
    title: "Napojnice su deo plate",
    summary: "U restoranima se ostavlja 15 do 20% računa, i to je veliki deo zarade konobara i barmena.",
    text: "Zato je osnovna satnica na pozicijama sa gostima često niža, a ukupna zarada veća nego na kasi ili u kuhinji.",
    tag: "Novac i posao",
  },
  {
    id: "national-parks",
    title: "63 nacionalna parka",
    summary: "Od Jeloustona do Velikog kanjona, a posle posla imaš 30 dana za putovanje.",
    text: "Godišnja karta America the Beautiful važi za ulaz u sve nacionalne parkove, pa se isplati ako planiraš više od dva.",
    tag: "Putovanja",
  },
  {
    id: "ssn",
    title: "SSN ostaje tvoj",
    summary: "Broj socijalnog osiguranja dobijaš u prvim nedeljama programa.",
    text: "Ako se jednom vratiš u Ameriku na praksu ili studije, koristiš isti broj. Treba ti i za povraćaj poreza.",
    tag: "Dokumenta",
  },
  {
    id: "shopping",
    title: "Outleti i rasprodaje",
    summary: "Garderoba, patike i tehnika su u Americi često jeftiniji nego kod nas.",
    text: "Najveće rasprodaje su oko 4. jula i Praznika rada (Labor Day), prvog ponedeljka u septembru.",
    tag: "Kupovina",
  },
  {
    id: "roadtrip",
    title: "Put kolima",
    summary: "Auto sa kolegama je najčešći način da se vidi više za manje para.",
    text: "Route 66 i Pacific Coast Highway su klasici. Proveri uslove agencija za iznajmljivanje: mnoge traže 21 ili 25 godina i naplaćuju doplatu mlađim vozačima.",
    tag: "Putovanja",
  },
  {
    id: "connectivity",
    title: "Telefon i internet",
    summary: "Ponesi telefon otključan za sve mreže, a američki broj uzmi na licu mesta.",
    text: "Po dolasku se kupuje SIM ili eSIM kartica, sa paketom koji uključuje internet i pozive unutar SAD.",
    tag: "Telefon",
  },
];

const US_STATES = [
  {
    id: "california",
    name: "Kalifornija (California)",
    abbr: "CA",
    cities: "Lake Tahoe, San Francisco, San Diego, Santa Cruz",
    type: "Zapadna obala",
    wageRange: "$16,50–21 na sat",
    highlights: "Jezero Tahoe, surfovanje, nacionalni parkovi i više satnice od proseka.",
    imageSeed: "california-tahoe",
  },
  {
    id: "florida",
    name: "Florida (Sunshine State)",
    abbr: "FL",
    cities: "Destin, Panama City Beach, Orlando, Key West",
    type: "Jugoistok, Atlantik i Zaliv",
    wageRange: "$14–18 na sat i napojnice",
    highlights: "Plaže sa belim peskom, veliki hoteli i zabavni parkovi.",
    imageSeed: "florida-beach",
  },
  {
    id: "alaska",
    name: "Aljaska (Alaska)",
    abbr: "AK",
    cities: "Anchorage, Denali, Seward, Skagway",
    type: "Krajnji sever",
    wageRange: "$17–22 na sat i prekovremeni",
    highlights: "Glečeri, divljina i dugi dani, uz mnogo prekovremenog rada.",
    imageSeed: "alaska-glacier",
  },
  {
    id: "colorado",
    name: "Kolorado (Colorado)",
    abbr: "CO",
    cities: "Vail, Aspen, Estes Park, Breckenridge",
    type: "Stenovite planine",
    wageRange: "$16–20 na sat",
    highlights: "Planinska skijališta koja leti postaju centri za planinarenje i rafting.",
    imageSeed: "colorado-mountains",
  },
  {
    id: "maine",
    name: "Mejn i Nova Engleska (Maine)",
    abbr: "ME",
    cities: "Ogunquit, Bar Harbor, Kennebunkport",
    type: "Nova Engleska",
    wageRange: "$15–18,50 na sat i napojnice",
    highlights: "Stari primorski gradići, jastozi i nacionalni park Akadija.",
    imageSeed: "maine-coast",
  },
  {
    id: "wisconsin",
    name: "Viskonsin (Wisconsin)",
    abbr: "WI",
    cities: "Wisconsin Dells, Lake Geneva",
    type: "Srednji zapad",
    wageRange: "$14,50–17,50 na sat",
    highlights: "Svetska prestonica vodenih parkova i mnogo studenata iz celog sveta.",
    imageSeed: "wisconsin-dells",
  },
  {
    id: "maryland",
    name: "Merilend (Maryland)",
    abbr: "MD",
    cities: "Ocean City",
    type: "Istočna obala",
    wageRange: "$15–17 na sat",
    highlights: "16 kilometara plaže, čuveni boardwalk i više od 200 restorana, pa se drugi posao lako nalazi.",
    imageSeed: "ocean-city-beach",
  },
  {
    id: "texas",
    name: "Teksas (Texas)",
    abbr: "TX",
    cities: "Galveston, San Antonio, Austin",
    type: "Meksički zaliv",
    wageRange: "$14–18 na sat",
    highlights: "Niži troškovi života, toplo more i pravi američki jug.",
    imageSeed: "texas-coast",
  },
];

const TABS = [
  { id: "facts", key: "usa.tabFacts", fallback: "Zanimljivosti" },
  { id: "states", key: "usa.tabStates", fallback: "Države" },
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
          title={facts ? tr("usa.factsTitle", "Dobro je da znaš") : tr("usa.statesTitle", "Države u kojima studenti rade")}
          lead={
            facts
              ? tr("usa.factsSubtitle", "Šest stvari o američkoj svakodnevici koje ti olakšavaju prve nedelje.")
              : tr("usa.statesSubtitle", "Gde su poslovi, okvirne satnice i šta te tamo čeka.")
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
                    <dt className="shrink-0 text-ink-3">Okvirno</dt>
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
