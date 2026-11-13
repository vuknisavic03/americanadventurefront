// Home.jsx — sekcije početne strane ispod heroja.
// Redosled prati put studenta do odluke: mogu li ja → šta je aktuelno → koliko zarađujem → gde → šta me koči →
// kako ide → koliko košta → šta kažu drugi → drugi programi → pitanja → prijava.
import { useEffect, useMemo, useState } from "react";
import homeVoices, { VOICES_TOTAL } from "../data/homeVoices";
import { SWT_FAQS } from "../data/faq";
import { useTranslation } from "../i18n/LanguageContext";
import { ArrowRightIcon, Button, CheckIcon, ChevronDownIcon, Container, SectionHeading, cx } from "./ui";

const APPLY = "/prijava-online?program=work-and-travel";

const linkCls =
  "inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:decoration-ink";

/* ---------- Drugi programi ---------- */
export function HomePrograms({ onNavigate }) {
  return (
    <section className="border-t border-line bg-white py-14 sm:py-16">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">Nisi student? Imamo program i za tebe</h2>
        <Button size="lg" variant="dark" href="/programi" onClick={(e) => onNavigate(e, "/programi")}>
          Svi programi i usluge <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </Container>
    </section>
  );
}

/* ---------- Koraci ---------- */
const STEPS = [
  { title: "Prijavi se", text: "Popuni kratku prijavu. Javljamo se sa procenom i objašnjavamo pakete." },
  { title: "Predaj dokumenta", text: "Biografija, uverenje sa fakulteta i pasoš. Prevod dokumenata je besplatan." },
  { title: "Izaberi posao", text: "Biraš ponudu i prolaziš intervju sa poslodavcem, online ili na sajmu poslova." },
  { title: "Dobij vizu", text: "Sponzor izdaje DS-2019, a mi te pripremamo za razgovor u ambasadi." },
  { title: "Poleti", text: "Orijentacija pred put, avio karta i podrška dok si u Americi." },
];

export function HomeSteps() {
  return (
    <section className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading title="Od prijave do aviona u pet koraka" lead="Kroz svaki korak te vodi tim u kome su i bivši učesnici programa." />
        <ol className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-4">
              <p className="font-display text-sm font-bold tabular-nums text-ink-3">0{i + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Cena ---------- */
const PACKAGES = [
  { name: "Self", price: "$1.875", text: "Posao nalaziš sam" },
  { name: "Full", price: "$2.275", text: "Posao i smeštaj nalazimo mi", featured: true },
  { name: "Lifeguard", price: "$2.075", text: "Spasilac na bazenu", note: "−$300 do popune kvote" },
];
const INCLUDED = ["DS-2019 i SEVIS", "Osiguranje", "Priprema za ambasadu", "Prevod dokumenata"];

export function HomePricing({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading title="Koliko košta" lead="Viza ($185) i avio karta plaćaju se posebno. Program se plaća na rate." />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div key={p.name} className={cx("flex flex-col rounded-3xl p-7 sm:p-8", p.featured ? "bg-ink text-white" : "bg-surface text-ink")}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {p.featured && <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">Najčešći izbor</span>}
                {p.note && <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">{p.note}</span>}
              </div>
              <p className="font-display mt-6 text-5xl font-bold tabular-nums">
                <span className={cx("align-middle text-base font-medium", p.featured ? "text-white/60" : "text-ink-3")}>od </span>
                {p.price}
              </p>
              <p className={cx("mt-2 flex-1 text-[15px]", p.featured ? "text-white/70" : "text-ink-2")}>{p.text}</p>
              <Button className="mt-8" block variant={p.featured ? "primary" : "dark"} href={APPLY} onClick={go(APPLY)}>
                Prijavi se
              </Button>
            </div>
          ))}
        </div>

        <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-ink-2">
          <li className="font-semibold text-ink">U svakom paketu:</li>
          {INCLUDED.map((x) => (
            <li key={x} className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-ink" strokeWidth={3} />
              {x}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Iskustva ---------- */
export function HomeVoices({ onNavigate }) {
  const { lang } = useTranslation();
  const tr = (f) => (typeof f === "string" ? f : f?.[lang] || f?.SR || "");
  const picks = homeVoices;
  if (picks.length === 0) return null;
  return (
    <section className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading
          title="Šta kažu oni koji su bili"
          lead={`${VOICES_TOTAL} učesnika je opisalo agenciju, mesto i poslodavca. Objavljujemo sve ocene, ne samo dobre.`}
          action={
            <a href="/iskustva" onClick={(e) => onNavigate(e, "/iskustva")} className={linkCls}>
              Sva iskustva <ArrowRightIcon className="h-4 w-4" />
            </a>
          }
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {picks.map((e) => (
            <figure key={e.slug} className="flex flex-col rounded-3xl bg-white p-7 sm:p-8">
              <blockquote className="flex-1 text-[17px] leading-relaxed text-ink">„{tr(e.quote)}“</blockquote>
              <figcaption className="mt-6 border-t border-line pt-5">
                <p className="text-[15px] font-semibold text-ink">{e.name}</p>
                <p className="mt-0.5 text-sm text-ink-3">{[e.place, e.year].filter(Boolean).join(" · ")}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Pitanja ---------- */
export function HomeFaq({ onNavigate }) {
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="font-display text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">Najčešća pitanja</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2">Nisi našao odgovor? Piši nam ili pozovi, radnim danima od 9 do 17.</p>
            <p className="mt-6">
              <a href="/kontakt" onClick={(e) => onNavigate(e, "/kontakt")} className={linkCls}>
                Kontakt <ArrowRightIcon className="h-4 w-4" />
              </a>
            </p>
          </div>
          <div className="divide-y divide-line border-y border-line lg:col-span-8">
            {SWT_FAQS.slice(0, 5).map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-ink-3 transition-transform duration-150 group-open:rotate-180" />
                </summary>
                <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-ink-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* =====================================================================
   Prodajni delovi početne
   ===================================================================== */

const usd = (n) => "$" + Math.round(n).toLocaleString("de-DE");

/* ---------- Provera uslova (hero na desktopu, posebna sekcija na telefonu) ---------- */
const ELIG_Q = [
  { id: "student", q: "Redovan si student?", hint: "Državni ili privatni fakultet, viša škola, master ili doktorske studije." },
  { id: "age", q: "Imaš između 19 i 26 godina?", hint: "Uslov sponzora za Work and Travel." },
  { id: "first", q: "Tekuću godinu upisuješ prvi put?", hint: "Ko ponavlja godinu, ne može na program te sezone." },
];

export function EligibilityCheck({ onNavigate, tone = "glass" }) {
  const [a, setA] = useState({});
  const answered = ELIG_Q.filter((x) => a[x.id] !== undefined).length;
  const failed = ELIG_Q.find((x) => a[x.id] === false);
  const ok = answered === ELIG_Q.length && !failed;
  const glass = tone === "glass";
  const go = (href) => (e) => onNavigate(e, href);

  return (
    <div className={cx("rounded-3xl p-6 sm:p-7", glass ? "bg-white/95 backdrop-blur-md" : "border border-line bg-white")}>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">Provera za 10 sekundi</p>
      <h2 className="font-display mt-1.5 text-2xl font-bold leading-tight text-ink">Možeš li na Work and Travel?</h2>

      <ul className="mt-5 space-y-3">
        {ELIG_Q.map((x) => (
          <li key={x.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-ink">{x.q}</p>
              <p className="text-[13px] leading-snug text-ink-3">{x.hint}</p>
            </div>
            <div className="flex shrink-0 rounded-full bg-surface-2 p-1" role="group" aria-label={x.q}>
              {[
                [true, "Da"],
                [false, "Ne"],
              ].map(([v, l]) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={a[x.id] === v}
                  onClick={() => setA((s) => ({ ...s, [x.id]: v }))}
                  className={cx(
                    "h-8 min-w-11 rounded-full px-3 text-[13px] font-semibold transition-colors",
                    a[x.id] === v ? (v ? "bg-ink text-white" : "bg-white text-ink shadow-sm ring-1 ring-line-strong") : "text-ink-2 hover:text-ink"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-line pt-5" aria-live="polite">
        {ok ? (
          <>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-emerald-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                <CheckIcon className="h-3 w-3" strokeWidth={3} />
              </span>
              Ispunjavaš osnovne uslove
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
              Brucoši treba da polože bar polovinu ispita. Ostalo proveravamo posle prijave, besplatno.
            </p>
            <Button className="mt-4" block href="/prijava-online?program=work-and-travel" onClick={go("/prijava-online?program=work-and-travel")}>
              Prijavi se besplatno
            </Button>
          </>
        ) : failed ? (
          <>
            <p className="text-[15px] font-semibold text-ink">
              {failed.id === "first" ? "Ove sezone ne možeš na Work and Travel." : "Work and Travel nije za tebe, ali drugi programi jesu."}
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
              Za diplomce i studente završnih godina je Internship i Training, a od 18 do 26 godina, uz vozačku i iskustvo sa decom, Au Pair.
            </p>
            <Button className="mt-4" block variant="outline" href="/programi" onClick={go("/programi")}>
              Pogledaj druge programe
            </Button>
          </>
        ) : (
          <p className="text-[13px] leading-snug text-ink-3">
            Odgovori na tri pitanja. {answered > 0 && `Još ${ELIG_Q.length - answered}.`}
          </p>
        )}
      </div>
    </div>
  );
}

export function HomeEligibility({ onNavigate }) {
  return (
    <section className="bg-surface py-10 lg:hidden">
      <Container>
        <EligibilityCheck onNavigate={onNavigate} tone="card" />
      </Container>
    </section>
  );
}

/* ---------- Aktuelne pogodnosti ---------- */
const OFFERS = [
  { tag: "Ograničen broj mesta", title: "Platiš kad zaradiš", text: "Pre polaska plaćaš manji deo programa, a veći deo po povratku, od onoga što zaradiš.", href: "/novosti/platis-kad-zaradis-kako-funkcionise" },
  { tag: "Do popune kvote", title: "Lifeguard −$300", text: "Spasilački paket za $1.775 umesto $2.075, uz bonus do $500 za ceo ugovor.", href: "/novosti/lifeguard-2027-satnice-lokacije-smestaj" },
  { tag: "Uvek važi", title: "Novac nazad", text: "Ako ispunjavaš uslove iz ugovora, a ambasada odbije vizu, vraćamo sav uplaćeni novac za program.", href: "/novosti/novac-nazad-ako-viza-ne-bude-odobrena" },
];

export function HomeOffers({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <SectionHeading
          title="Aktuelno za sezonu 2027"
          lead="Koristi se jedna pogodnost po prijavi. Izbor možeš da promeniš do konačnog obračuna."
          action={
            <a href="/akcije" onClick={go("/akcije")} className={linkCls}>
              Svi popusti <ArrowRightIcon className="h-4 w-4" />
            </a>
          }
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {OFFERS.map((o, i) => (
            <a
              key={o.title}
              href={o.href}
              onClick={go(o.href)}
              className={cx(
                "group flex flex-col rounded-3xl p-7 transition-colors sm:p-8",
                i === 0 ? "bg-brand hover:bg-brand-strong" : "bg-surface hover:bg-surface-2"
              )}
            >
              <span className={cx("self-start rounded-full px-3 py-1 text-xs font-semibold", i === 0 ? "bg-ink text-white" : "bg-white text-ink")}>{o.tag}</span>
              <h3 className="font-display mt-6 text-3xl font-bold leading-tight text-ink">{o.title}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink/80">{o.text}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                Kako funkcioniše <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Kalkulator zarade ---------- */
const CALC_PACKAGES = {
  full: { label: "Full", price: 2275, rate: 14, hours: 40, living: 200 },
  lifeguard: { label: "Lifeguard", price: 2075, extra: 150, rate: 17.5, hours: 50, living: 290 },
  self: { label: "Self", price: 1875, rate: 14, hours: 40, living: 200 },
};
const VISA = 185;
const FLIGHT = 950; // procena: 600–1.000 € zavisno od destinacije

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[15px] font-medium text-white/80">{label}</span>
        <span className="font-display text-xl font-bold tabular-nums text-white">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-brand [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
        style={{ background: `linear-gradient(to right, var(--color-brand) ${((value - min) / (max - min)) * 100}%, rgb(255 255 255 / 0.15) 0)` }}
      />
    </label>
  );
}

export function HomeEarnings({ onNavigate }) {
  const [pkg, setPkg] = useState("full");
  const [rate, setRate] = useState(CALC_PACKAGES.full.rate);
  const [hours, setHours] = useState(CALC_PACKAGES.full.hours);
  const [weeks, setWeeks] = useState(14);
  const [living, setLiving] = useState(200);

  const pick = (k) => {
    setPkg(k);
    setRate(CALC_PACKAGES[k].rate);
    setHours(CALC_PACKAGES[k].hours);
    setLiving(CALC_PACKAGES[k].living);
  };

  const r = useMemo(() => {
    const weekly = rate * Math.min(hours, 40) + rate * 1.5 * Math.max(0, hours - 40);
    const gross = weekly * weeks;
    const costs = CALC_PACKAGES[pkg].price + (CALC_PACKAGES[pkg].extra || 0) + VISA + FLIGHT;
    const life = living * weeks;
    const left = gross - costs - life;
    const payback = Math.ceil(costs / Math.max(1, weekly - living));
    return { weekly, gross, costs, life, left, payback };
  }, [pkg, rate, hours, weeks, living]);

  const go = (href) => (e) => onNavigate(e, href);
  const apply = "/prijava-online?program=work-and-travel";

  return (
    <section id="zarada" className="scroll-mt-20 bg-ink py-16 text-white sm:py-24">
      <Container>
        <SectionHeading
          tone="dark"
          title="Koliko možeš da zaradiš"
          lead="Pomeri klizače i vidi računicu za celo leto. Brojke su iz stvarnih ponuda: satnica od 10 do 20 dolara, a svaki sat preko 40 nedeljno plaća se 50% više."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8 lg:col-span-7">
            <p className="text-[15px] font-medium text-white/80">Paket</p>
            <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Paket">
              {Object.entries(CALC_PACKAGES).map(([k, p]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={pkg === k}
                  onClick={() => pick(k)}
                  className={cx(
                    "rounded-2xl px-3 py-3 text-left transition-colors",
                    pkg === k ? "bg-brand text-ink" : "bg-white/5 text-white hover:bg-white/10"
                  )}
                >
                  <span className="block text-[15px] font-semibold">{p.label}</span>
                  <span className={cx("block text-[13px] tabular-nums", pkg === k ? "text-ink/70" : "text-white/60")}>{usd(p.price)}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 space-y-7">
              <Slider label="Satnica" value={rate} min={10} max={20} step={0.5} onChange={setRate} format={(v) => `$${v.toFixed(2).replace(".", ",")}`} />
              <Slider label="Sati nedeljno" value={hours} min={30} max={56} step={1} onChange={setHours} format={(v) => `${v} h`} />
              <Slider label="Nedelja rada" value={weeks} min={8} max={17} step={1} onChange={setWeeks} format={(v) => `${v}`} />
              <Slider label="Smeštaj i hrana nedeljno" value={living} min={100} max={350} step={10} onChange={setLiving} format={usd} />
            </div>
          </div>

          <div className="flex flex-col rounded-3xl bg-white p-6 text-ink sm:p-8 lg:col-span-5">
            <p className="text-[15px] text-ink-2">Ostaje ti posle svih troškova</p>
            <p className={cx("font-display mt-1 text-5xl font-bold tabular-nums sm:text-6xl", r.left < 0 && "text-red-600")}>{usd(r.left)}</p>
            <p className="mt-2 text-[15px] text-ink-2">
              Program, vizu i kartu vraćaš za oko <strong className="font-semibold text-ink">{r.payback} {r.payback === 1 ? "nedelju" : r.payback < 5 ? "nedelje" : "nedelja"}</strong> rada.
            </p>

            <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-[15px]">
              {[
                ["Zarada nedeljno", usd(r.weekly)],
                [`Zarada za ${weeks} nedelja`, usd(r.gross)],
                [`${CALC_PACKAGES[pkg].label} paket${pkg === "lifeguard" ? ", obuka" : ""}, viza i karta`, "−" + usd(r.costs)],
                ["Smeštaj i hrana", "−" + usd(r.life)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 flex-1 text-[13px] leading-snug text-ink-3">
              Procena pre poreza, bez napojnica i drugog posla. Karta je računata kao {usd(FLIGHT)}, a stvarna cena zavisi od destinacije. Broj sati nije garantovan, poslodavac navodi prosek.
            </p>
            <Button className="mt-6" block size="lg" href={apply} onClick={go(apply)}>
              Hoću ovakvo leto
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Destinacije ---------- */
const PLACES = [
  { name: "Ocean City", state: "Merilend", img: "/news/ocean-city.jpg", href: "/novosti/ocean-city-maryland" },
  { name: "Honolulu", state: "Havaji", img: "/news/hawaii-luau.jpg", href: "/novosti/hawaii-luau" },
  { name: "Cape Cod", state: "Masačusets", img: "/news/cape-cod.jpg", href: "/novosti/cape-cod-massachusetts" },
  { name: "Wisconsin Dells", state: "Viskonsin", img: "/news/wisconsin-dells.jpg", href: "/novosti/wisconsin-dells" },
  { name: "Block Island", state: "Roud Ajlend", img: "/news/block-island.jpg", href: "/novosti/block-island-rhode-island" },
];

export function HomeDestinations({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading
          title="Radiš tamo gde drugi letuju"
          lead="Poslovi su u letovalištima, na ostrvima i u zabavnim parkovima, jer tamo leti fali ljudi. Naši studenti su do sada radili u 83 grada i 45 država."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {PLACES.map((p, i) => (
            <a
              key={p.name}
              href={p.href}
              onClick={go(p.href)}
              className={cx(
                "group relative isolate overflow-hidden rounded-3xl bg-surface-2",
                i === 0 ? "col-span-2 aspect-[4/3] lg:row-span-2 lg:aspect-auto" : "aspect-[4/5] sm:aspect-[4/3]"
              )}
            >
              <img src={p.img} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink/75 via-ink/10 to-transparent" aria-hidden="true" />
              <div className="flex h-full flex-col justify-end p-4 sm:p-5">
                <p className={cx("font-display font-bold leading-tight text-white", i === 0 ? "text-3xl" : "text-lg sm:text-xl")}>{p.name}</p>
                <p className="text-[13px] text-white/80">{p.state}</p>
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Šta te koči ---------- */
const OBJECTIONS = [
  { q: "Nemam novca unapred", a: "Program se plaća na rate. Uz „Platiš kad zaradiš“ veći deo plaćaš po povratku, a uz opciju „20% do vize“ ostatak tek kad dobiješ vizu." },
  { q: "Plašim se da neću dobiti vizu", a: "Pripremamo te za razgovor u ambasadi. Ako ispunjavaš uslove, a viza bude odbijena, vraćamo sav novac za program." },
  { q: "Nikad nisam radio", a: "Poslovi su sezonski i ne traže iskustvo: kasa, sala, recepcija, kuhinja, zabavni parkovi, bazeni. Uči se na poslu." },
  { q: "Engleski mi nije savršen", a: "Ne mora da bude. Pre intervjua sa poslodavcem i ambasade prolaziš pripremu, a svaki radni dan tamo je nova vežba." },
  { q: "Ne znam gde ću da živim", a: "U Full i Lifeguard paketu biramo poslove uz koje poslodavac nudi smeštaj. Cena je najčešće od 50 do 200 dolara nedeljno." },
  { q: "Šta ako tamo nešto krene po zlu", a: "Zdravstveno osiguranje je u ceni. Sponzor i mi smo dostupni celo leto, i pomažemo ako treba promeniti posao ili smeštaj." },
];

export function HomeObjections() {
  return (
    <section className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading title="Šta te koči?" lead="Šest razloga zbog kojih studenti odlažu prijavu, i šta za svaki od njih postoji." />
        <dl className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIONS.map((o) => (
            <div key={o.q} className="rounded-3xl bg-white p-7">
              <dt className="font-display text-xl font-bold leading-snug text-ink">„{o.q}“</dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-ink-2">{o.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

/* ---------- Lepljivo dugme na telefonu ---------- */
export function StickyApply({ onNavigate }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const end = document.getElementById("zavrsni-poziv");
      const nearEnd = end ? end.getBoundingClientRect().top < window.innerHeight : false;
      setShow(window.scrollY > 640 && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const href = "/prijava-online?program=work-and-travel";
  return (
    <div
      className={cx(
        "fixed bottom-5 left-4 right-[5.25rem] z-50 transition-all duration-300 sm:hidden",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <Button block size="lg" variant="dark" href={href} onClick={(e) => onNavigate(e, href)} className="h-14 shadow-lg">
        Prijavi se besplatno
      </Button>
    </div>
  );
}
