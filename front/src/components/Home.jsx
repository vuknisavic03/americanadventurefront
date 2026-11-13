// Home.jsx — sekcije početne strane.
// Likovni pravac „Polazak": žuta kao putokaz (velike površine, ne akcent), karta za ukrcavanje
// za odluke i cene, platni listić za zaradu, razglednice za mesta, ruta za korake.
// Redosled prati put studenta do odluke: mogu li ja → šta je aktuelno → koliko zarađujem → gde →
// šta me koči → kako ide → koliko košta → šta kažu drugi → drugi programi → pitanja → prijava.
import { useEffect, useMemo, useState } from "react";
import homeVoices, { VOICES_TOTAL } from "../data/homeVoices";
import { SWT_FAQS } from "../data/faq";
import { useTranslation } from "../i18n/LanguageContext";
import { Button, CheckIcon, Container, PlaneIcon, cx } from "./ui";

const APPLY = "/prijava-online?program=work-and-travel";
const usd = (n) => (n < 0 ? "−" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("de-DE");

const textLink =
  "font-semibold text-ink underline decoration-2 underline-offset-[5px] decoration-ink/30 transition-colors hover:decoration-ink";

/** Naslov sekcije: veliki, levo, bez nadnaslova. */
function Heading({ title, lead, dark = false, className = "", children }) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-x-12 gap-y-6", className)}>
      <div className="max-w-3xl">
        <h2 className={cx("font-display text-[clamp(2.1rem,4.6vw,3.6rem)] font-extrabold leading-[0.98]", dark ? "text-white" : "text-ink")}>
          {title}
        </h2>
        {lead && <p className={cx("mt-5 max-w-2xl text-lg leading-relaxed", dark ? "text-white/70" : "text-ink-2")}>{lead}</p>}
      </div>
      {children}
    </div>
  );
}

/* =====================================================================
   Karta za ukrcavanje = provera uslova
   ===================================================================== */
const ELIG_Q = [
  { id: "student", q: "Redovan si student?", hint: "Fakultet, viša škola, master ili doktorske studije" },
  { id: "age", q: "Imaš od 19 do 26 godina?", hint: "Uslov sponzora za Work and Travel" },
  { id: "first", q: "Tekuću godinu upisuješ prvi put?", hint: "Ko ponavlja godinu, ne može te sezone" },
];

function Field({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs text-ink-3">{label}</p>
      <p className="font-sign mt-0.5 text-lg font-bold leading-tight text-ink">{value}</p>
    </div>
  );
}

export function BoardingPass({ onNavigate }) {
  const [a, setA] = useState({});
  const answered = ELIG_Q.filter((x) => a[x.id] !== undefined).length;
  const failed = ELIG_Q.find((x) => a[x.id] === false);
  const ok = answered === ELIG_Q.length && !failed;
  const go = (href) => (e) => onNavigate(e, href);

  return (
    <div className="ticket-notch mx-auto max-w-[30rem] rounded-[1.75rem] bg-white" style={{ "--cut": "196px" }}>
      {/* Zaglavlje karte */}
      <div className="h-[196px] px-6 pt-5 sm:px-7">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink">Karta za ukrcavanje</p>
          <p className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-brand">Leto 2027</p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-sign text-5xl font-extrabold leading-none text-ink">BEG</p>
            <p className="mt-1 text-xs text-ink-3">Beograd</p>
          </div>
          <div className="mb-5 flex flex-1 items-center gap-2 text-ink/35" aria-hidden="true">
            <span className="perforation flex-1" />
            <PlaneIcon className="h-5 w-5 text-ink" />
            <span className="perforation flex-1" />
          </div>
          <div className="text-right">
            <p className="font-sign text-5xl font-extrabold leading-none text-ink">USA</p>
            <p className="mt-1 text-xs text-ink-3">Leto u Americi</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Field label="Putnik" value="Ti" />
          <Field label="Program" value="Work & Travel" />
          <Field label="Rad" value="do 4 meseca" />
        </div>
      </div>

      <div className="perforation mx-6 text-line-strong" aria-hidden="true" />

      {/* Provera */}
      <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
        <p className="font-display text-xl font-extrabold leading-tight text-ink">Možeš li na ukrcavanje?</p>
        <ul className="mt-4 divide-y divide-line">
          {ELIG_Q.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-snug text-ink">{x.q}</p>
                <p className="text-[13px] leading-snug text-ink-3">{x.hint}</p>
              </div>
              <div className="flex shrink-0 gap-1" role="group" aria-label={x.q}>
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
                      "h-9 w-11 rounded-full border-2 text-[13px] font-bold transition-colors",
                      a[x.id] === v ? "border-ink bg-ink text-white" : "border-line-strong text-ink hover:border-ink"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4" aria-live="polite">
          {ok ? (
            <div>
              <p className="flex items-center gap-2.5">
                <span className="inline-flex -rotate-3 items-center gap-1.5 rounded-md border-2 border-emerald-700 px-2.5 py-1 text-sm font-extrabold text-emerald-800">
                  <CheckIcon className="h-4 w-4" strokeWidth={3} /> Ukrcavanje odobreno
                </span>
              </p>
              <p className="mt-2.5 text-[13px] leading-snug text-ink-2">Brucoši treba da polože bar polovinu ispita. Ostalo proveravamo posle prijave, besplatno.</p>
              <Button className="mt-4" block href={APPLY} onClick={go(APPLY)}>
                Prijavi se besplatno
              </Button>
            </div>
          ) : failed ? (
            <div>
              <p className="text-[15px] font-semibold text-ink">
                {failed.id === "first" ? "Ove sezone Work and Travel ne ide." : "Za tebe je bolji drugi program."}
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
                Diplomci i studenti završnih godina idu na Internship i Training, a od 18 do 26 godina, uz vozačku i iskustvo sa decom, na Au Pair.
              </p>
              <Button className="mt-4" block variant="outline" href="/programi" onClick={go("/programi")}>
                Pogledaj druge programe
              </Button>
            </div>
          ) : (
            <p className="pt-2 text-[13px] leading-snug text-ink-3">
              Tri pitanja, deset sekundi.{answered > 0 && ` Ostalo još ${ELIG_Q.length - answered}.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   Aktuelno
   ===================================================================== */
const OFFERS = [
  { tag: "Ograničen broj mesta", title: "Platiš kad zaradiš", text: "Pre polaska plaćaš manji deo programa, a veći deo po povratku, od onoga što zaradiš.", href: "/novosti/platis-kad-zaradis-kako-funkcionise" },
  { tag: "Do popune kvote", title: "Lifeguard za $300 manje", text: "Spasilački paket za $1.775 umesto $2.075, uz bonus do $500 ako ostaneš do kraja ugovora.", href: "/novosti/lifeguard-2027-satnice-lokacije-smestaj" },
  { tag: "Garancija", title: "Novac nazad", text: "Ako ispunjavaš uslove iz ugovora, a ambasada odbije vizu, vraćamo sav uplaćeni novac za program.", href: "/novosti/novac-nazad-ako-viza-ne-bude-odobrena" },
];

export function HomeOffers({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container className="max-w-7xl">
        <Heading title="Aktuelno za sezonu 2027" lead="Koristiš jednu pogodnost po prijavi, a izbor možeš da promeniš do konačnog obračuna.">
          <a href="/akcije" onClick={go("/akcije")} className={textLink}>
            Svi popusti
          </a>
        </Heading>
        <div className="mt-14 grid border-t-2 border-ink md:grid-cols-3">
          {OFFERS.map((o, i) => (
            <a
              key={o.title}
              href={o.href}
              onClick={go(o.href)}
              className={cx(
                "group flex flex-col border-b border-line py-8 md:border-b-0 md:py-10",
                i > 0 && "md:border-l md:pl-8",
                i < 2 && "md:pr-8"
              )}
            >
              <p className={cx("self-start rounded-full px-3 py-1 text-xs font-semibold", i === 0 ? "bg-brand text-ink" : "bg-surface-2 text-ink")}>{o.tag}</p>
              <h3 className="font-display mt-6 text-[1.9rem] font-extrabold leading-[1.02] text-ink">{o.title}</h3>
              <p className="mt-4 flex-1 text-[16px] leading-relaxed text-ink-2">{o.text}</p>
              <span className="mt-6 text-[15px] font-semibold text-ink underline decoration-2 decoration-ink/25 underline-offset-[5px] group-hover:decoration-ink">
                Kako funkcioniše
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* =====================================================================
   Kalkulator: kontrole + platni listić
   ===================================================================== */
const CALC_PACKAGES = {
  full: { label: "Full", price: 2275, rate: 14, hours: 40, living: 200 },
  lifeguard: { label: "Lifeguard", price: 2075, extra: 150, rate: 17.5, hours: 50, living: 290 },
  self: { label: "Self", price: 1875, rate: 14, hours: 40, living: 200 },
};
const VISA = 185;
const FLIGHT = 950; // procena: 600–1.000 € zavisno od destinacije

function Slider({ label, value, min, max, step, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[15px] font-medium text-ink-2">{label}</span>
        <span className="font-sign text-3xl font-extrabold leading-none text-ink">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-brand [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-brand"
        style={{ background: `linear-gradient(to right, var(--color-ink) ${pct}%, var(--color-line-strong) 0)` }}
      />
    </label>
  );
}

function StubRow({ label, value, strong = false }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <dt className={cx("shrink-0 text-[15px]", strong ? "font-semibold text-ink" : "text-ink-2")}>{label}</dt>
      <span className="mb-1 flex-1 border-b border-dotted border-ink/30" aria-hidden="true" />
      <dd className={cx("font-sign shrink-0 text-lg font-bold", strong ? "text-ink" : "text-ink")}>{value}</dd>
    </div>
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
    const regular = rate * Math.min(hours, 40);
    const overtime = rate * 1.5 * Math.max(0, hours - 40);
    const weekly = regular + overtime;
    const gross = weekly * weeks;
    const costs = CALC_PACKAGES[pkg].price + (CALC_PACKAGES[pkg].extra || 0) + VISA + FLIGHT;
    const life = living * weeks;
    const left = gross - costs - life;
    const payback = Math.ceil(costs / Math.max(1, weekly - living));
    return { regular, overtime, weekly, gross, costs, life, left, payback };
  }, [pkg, rate, hours, weeks, living]);

  const go = (href) => (e) => onNavigate(e, href);
  const weeksWord = (n) => (n % 10 === 1 && n !== 11 ? "nedelju" : n % 10 >= 2 && n % 10 <= 4 && (n < 12 || n > 14) ? "nedelje" : "nedelja");

  return (
    <section id="zarada" className="scroll-mt-20 bg-surface py-20 sm:py-28">
      <Container className="max-w-7xl">
        <Heading
          title="Koliko ti ostaje posle leta"
          lead="Pomeri klizače i vidi računicu za celu sezonu. Satnice su od 10 do 20 dolara, a svaki sat preko četrdesetog u nedelji plaća se 50% više."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <p className="text-[15px] font-medium text-ink-2">Paket</p>
            <div className="mt-3 inline-flex rounded-full bg-white p-1 ring-1 ring-line" role="group" aria-label="Paket">
              {Object.entries(CALC_PACKAGES).map(([k, p]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={pkg === k}
                  onClick={() => pick(k)}
                  className={cx("h-10 rounded-full px-5 text-[15px] font-semibold transition-colors", pkg === k ? "bg-ink text-white" : "text-ink hover:bg-surface")}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-10 space-y-9">
              <Slider label="Satnica" value={rate} min={10} max={20} step={0.5} onChange={setRate} format={(v) => `$${v.toFixed(2).replace(".", ",")}`} />
              <Slider label="Sati nedeljno" value={hours} min={30} max={56} step={1} onChange={setHours} format={(v) => `${v} h`} />
              <Slider label="Nedelja rada" value={weeks} min={8} max={17} step={1} onChange={setWeeks} format={(v) => `${v}`} />
              <Slider label="Smeštaj i hrana, nedeljno" value={living} min={100} max={350} step={10} onChange={setLiving} format={usd} />
            </div>
          </div>

          {/* Platni listić */}
          <div className="lg:col-span-6">
            <div className="ticket-notch rounded-[1.5rem] bg-white" style={{ "--cut": "118px" }}>
              <div className="flex h-[118px] items-start justify-between gap-4 px-7 pt-6 sm:px-9">
                <div>
                  <p className="text-[13px] text-ink-3">Obračun za sezonu</p>
                  <p className="font-display mt-1 text-2xl font-extrabold text-ink">Platni listić</p>
                </div>
                <p className="font-sign rounded-md border-2 border-ink px-2 py-0.5 text-sm font-bold text-ink">{CALC_PACKAGES[pkg].label}</p>
              </div>
              <div className="perforation mx-7 text-line-strong sm:mx-9" aria-hidden="true" />

              <div className="px-7 pb-8 pt-5 sm:px-9">
                <dl>
                  <StubRow label={`Redovno, ${Math.min(hours, 40)} h × ${weeks}`} value={usd(r.regular * weeks)} />
                  {r.overtime > 0 && <StubRow label={`Prekovremeno, ${hours - 40} h × ${weeks}`} value={usd(r.overtime * weeks)} />}
                  <StubRow label="Program, viza i karta" value={usd(-r.costs)} />
                  <StubRow label="Smeštaj i hrana" value={usd(-r.life)} />
                </dl>

                <div className="mt-6 rounded-2xl bg-brand px-5 py-5">
                  <p className="text-[15px] font-medium text-ink">Ostaje ti</p>
                  <p className={cx("font-sign mt-1 text-6xl font-extrabold leading-none sm:text-7xl", r.left < 0 ? "text-red-700" : "text-ink")}>{usd(r.left)}</p>
                  <p className="mt-3 text-[15px] text-ink">
                    Troškove programa vraćaš za oko <strong>{r.payback} {weeksWord(r.payback)}</strong> rada.
                  </p>
                </div>

                <p className="mt-5 text-[13px] leading-snug text-ink-3">
                  Procena pre poreza, bez napojnica i drugog posla. Karta je računata kao {usd(FLIGHT)}{pkg === "lifeguard" ? ", a uključena je i obuka od $150" : ""}. Broj sati nije garantovan, poslodavac navodi prosek.
                </p>
                <Button className="mt-6" block size="lg" variant="dark" href={APPLY} onClick={go(APPLY)}>
                  Hoću ovakvo leto
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* =====================================================================
   Razglednice
   ===================================================================== */
const PLACES = [
  { name: "Ocean City", state: "Merilend", img: "/news/ocean-city.jpg", href: "/novosti/ocean-city-maryland", tilt: "-rotate-2" },
  { name: "Honolulu", state: "Havaji", img: "/news/hawaii-luau.jpg", href: "/novosti/hawaii-luau", tilt: "rotate-1" },
  { name: "Cape Cod", state: "Masačusets", img: "/news/cape-cod.jpg", href: "/novosti/cape-cod-massachusetts", tilt: "-rotate-1" },
  { name: "Wisconsin Dells", state: "Viskonsin", img: "/news/wisconsin-dells.jpg", href: "/novosti/wisconsin-dells", tilt: "rotate-2" },
  { name: "Block Island", state: "Roud Ajlend", img: "/news/block-island.jpg", href: "/novosti/block-island-rhode-island", tilt: "-rotate-1" },
  { name: "Old Orchard Beach", state: "Mejn", img: "/news/old-orchard-beach.jpg", href: "/novosti/old-orchard-beach-maine", tilt: "rotate-1" },
];

export function HomeDestinations({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="overflow-hidden bg-brand py-20 sm:py-28">
      <Container className="max-w-7xl">
        <Heading
          title="Radiš tamo gde drugi letuju"
          lead="Letovališta, ostrva i zabavni parkovi: tamo leti fali ljudi. Šest mesta na koja studenti najčešće idu."
        >
          <a href="/novosti" onClick={go("/novosti")} className={textLink}>
            Svi tekstovi o Americi
          </a>
        </Heading>

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
          {PLACES.map((p) => (
            <li key={p.name} className={cx("transition-transform duration-300 hover:rotate-0", p.tilt)}>
              <a href={p.href} onClick={go(p.href)} className="block bg-white p-2 pb-3 sm:p-3 sm:pb-4">
                <span className="block aspect-[4/3] overflow-hidden bg-surface-2">
                  <img src={p.img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </span>
                <span className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 px-1">
                  <span className="font-display text-base font-extrabold text-ink sm:text-xl">{p.name}</span>
                  <span className="text-[13px] text-ink-3">{p.state}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* =====================================================================
   Šta te koči
   ===================================================================== */
const OBJECTIONS = [
  { q: "Nemam novca unapred", a: "Program se plaća na rate. Uz „Platiš kad zaradiš“ veći deo plaćaš po povratku, a uz opciju „20% do vize“ ostatak tek kad dobiješ vizu." },
  { q: "Plašim se da neću dobiti vizu", a: "Pripremamo te za razgovor u ambasadi. Ako ispunjavaš uslove, a viza bude odbijena, vraćamo sav novac za program." },
  { q: "Nikad nisam radio", a: "Poslovi su sezonski i ne traže iskustvo: kasa, sala, recepcija, kuhinja, zabavni parkovi, bazeni. Uči se na poslu." },
  { q: "Engleski mi nije savršen", a: "Ne mora da bude. Pre intervjua sa poslodavcem i ambasade prolaziš pripremu, a svaki radni dan tamo je nova vežba." },
  { q: "Ne znam gde ću da živim", a: "U Full i Lifeguard paketu biramo poslove uz koje poslodavac nudi smeštaj. Cena je najčešće od 50 do 200 dolara nedeljno." },
  { q: "Šta ako tamo nešto krene po zlu", a: "Zdravstveno osiguranje je u ceni. Sponzor i mi smo dostupni celo leto i pomažemo ako treba promeniti posao ili smeštaj." },
];

export function HomeObjections() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container className="max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h2 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-[0.95] text-ink">Šta te koči?</h2>
              <p className="mt-5 max-w-xs text-lg leading-relaxed text-ink-2">Šest razloga zbog kojih studenti odlažu prijavu, i šta za svaki postoji.</p>
            </div>
          </div>
          <dl className="border-t-2 border-ink lg:col-span-8">
            {OBJECTIONS.map((o) => (
              <div key={o.q} className="grid gap-3 border-b border-line py-7 sm:grid-cols-12 sm:gap-8">
                <dt className="font-display text-xl font-extrabold leading-snug text-ink sm:col-span-5">„{o.q}“</dt>
                <dd className="text-[16px] leading-relaxed text-ink-2 sm:col-span-7">{o.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

/* =====================================================================
   Koraci kao ruta
   ===================================================================== */
const STEPS = [
  { title: "Prijava", text: "Kratka prijava. Javljamo se sa procenom i objašnjavamo pakete." },
  { title: "Dokumenta", text: "Biografija, uverenje sa fakulteta i pasoš. Prevod je besplatan." },
  { title: "Posao", text: "Biraš ponudu i radiš intervju sa poslodavcem, online ili na sajmu." },
  { title: "Viza", text: "Sponzor izdaje DS-2019, a mi te pripremamo za ambasadu." },
  { title: "Let", text: "Orijentacija, avio karta i podrška dok si u Americi." },
];

export function HomeSteps() {
  return (
    <section className="bg-ink py-20 text-white sm:py-28">
      <Container className="max-w-7xl">
        <Heading dark title="Od prijave do aviona" lead="Pet stanica. Kroz svaku te vodi isti tim, a dok si u Americi, tu je i sponzor." />

        <ol className="relative mt-16 grid gap-10 lg:grid-cols-5 lg:gap-6">
          {/* linija rute (desktop) */}
          <span className="perforation absolute left-0 right-10 top-[22px] hidden text-white/30 lg:block" aria-hidden="true" />
          <PlaneIcon className="absolute right-0 top-[10px] hidden h-6 w-6 text-brand lg:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-5 lg:block">
              <span className="font-sign relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-ink ring-[6px] ring-ink">
                {i + 1}
              </span>
              <div className="lg:mt-6">
                <h3 className="font-display text-2xl font-extrabold">{s.title}</h3>
                <p className="mt-2 max-w-[17rem] text-[15px] leading-relaxed text-white/70">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* =====================================================================
   Cene kao karte
   ===================================================================== */
const PACKAGES = [
  { name: "Self", price: "$1.875", text: "Posao nalaziš sam, mi vodimo papire i vizu." },
  { name: "Full", price: "$2.275", text: "Posao i smeštaj nalazimo mi.", featured: true },
  { name: "Lifeguard", price: "$2.075", text: "Spasilac na bazenu kod Vašingtona ili Bostona.", note: "Sada −$300" },
];
const INCLUDED = ["DS-2019 i SEVIS", "Osiguranje", "Priprema za ambasadu", "Prevod dokumenata"];

export function HomePricing({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container className="max-w-7xl">
        <Heading title="Koliko košta" lead="Viza ($185) i avio karta plaćaju se posebno. Program se plaća na rate." />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className={cx("ticket-notch flex flex-col rounded-[1.5rem]", p.featured ? "bg-ink text-white" : "bg-white text-ink")}
              style={{ "--cut": "calc(100% - 92px)" }}
            >
              <div className="flex-1 px-7 pb-7 pt-7">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-extrabold">{p.name}</h3>
                  {p.featured && <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">Najčešći izbor</span>}
                  {p.note && <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">{p.note}</span>}
                </div>
                <p className="mt-8 flex items-baseline gap-2">
                  <span className={cx("text-[15px]", p.featured ? "text-white/60" : "text-ink-3")}>od</span>
                  <span className={cx("font-sign text-7xl font-extrabold leading-none", p.featured && "text-brand")}>{p.price}</span>
                </p>
                <p className={cx("mt-4 text-[15px] leading-relaxed", p.featured ? "text-white/75" : "text-ink-2")}>{p.text}</p>
              </div>
              <div className={cx("perforation mx-7", p.featured ? "text-white/25" : "text-line-strong")} aria-hidden="true" />
              <div className="flex h-[90px] items-center px-7">
                <Button block variant={p.featured ? "primary" : "dark"} href={APPLY} onClick={go(APPLY)}>
                  Prijavi se
                </Button>
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] text-ink-2">
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

/* =====================================================================
   Iskustva
   ===================================================================== */
export function HomeVoices({ onNavigate }) {
  const { lang } = useTranslation();
  const tr = (f) => (typeof f === "string" ? f : f?.[lang] || f?.SR || "");
  if (homeVoices.length === 0) return null;
  const [lead, ...rest] = homeVoices;
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container className="max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-12">
          <figure className="lg:col-span-7">
            <span className="font-display block h-16 text-[8rem] font-extrabold leading-[0.95] text-brand" aria-hidden="true">
              “
            </span>
            <blockquote className="mt-4 text-[clamp(1.5rem,2.6vw,2.15rem)] font-medium leading-[1.3] text-ink">{tr(lead.quote)}</blockquote>
            <figcaption className="mt-8 text-[15px]">
              <span className="font-semibold text-ink">{lead.name}</span>
              <span className="block text-ink-3">
                {lead.place}, leto {lead.year}.
              </span>
            </figcaption>
          </figure>

          <div className="flex flex-col justify-between gap-10 lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
            {rest.map((e) => (
              <figure key={e.slug}>
                <blockquote className="text-[17px] leading-relaxed text-ink">„{tr(e.quote)}“</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-ink">{e.name}</span>
                  <span className="text-ink-3">, {e.place}, {e.year}.</span>
                </figcaption>
              </figure>
            ))}
            <p className="text-[15px] text-ink-2">
              {VOICES_TOTAL} učesnika je ocenilo agenciju, mesto i poslodavca. Objavljujemo sve ocene.{" "}
              <a href="/iskustva" onClick={(e) => onNavigate(e, "/iskustva")} className={textLink}>
                Pročitaj sva iskustva
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* =====================================================================
   Drugi programi
   ===================================================================== */
export function HomePrograms({ onNavigate }) {
  return (
    <section className="bg-white">
      <Container className="max-w-7xl">
        <div className="flex flex-col gap-6 border-y-2 border-ink py-10 sm:flex-row sm:items-center sm:justify-between sm:py-12">
          <h2 className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-extrabold leading-[1.02] text-ink">Nisi student? Imamo program i za tebe.</h2>
          <Button size="lg" variant="dark" href="/programi" onClick={(e) => onNavigate(e, "/programi")}>
            Svi programi i usluge
          </Button>
        </div>
      </Container>
    </section>
  );
}

/* =====================================================================
   Pitanja
   ===================================================================== */
export function HomeFaq({ onNavigate }) {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container className="max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="font-display text-[clamp(2.1rem,4.6vw,3.6rem)] font-extrabold leading-[0.98] text-ink">Pitanja pre polaska</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">
              Nisi našao odgovor? Pozovi{" "}
              <a href="tel:+381641072004" className={textLink}>
                064 107 2004
              </a>{" "}
              radnim danima od 9 do 17, ili{" "}
              <a href="/kontakt" onClick={(e) => onNavigate(e, "/kontakt")} className={textLink}>
                piši nam
              </a>
              .
            </p>
          </div>
          <div className="border-t-2 border-ink lg:col-span-8">
            {SWT_FAQS.slice(0, 6).map((faq) => (
              <details key={faq.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="relative h-6 w-6 shrink-0 rounded-full bg-brand" aria-hidden="true">
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-ink" />
                    <span className="absolute left-1/2 top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-ink transition-transform group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 text-[16px] leading-relaxed text-ink-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* =====================================================================
   Lepljivo dugme na telefonu
   ===================================================================== */
export function StickyApply({ onNavigate }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const end = document.getElementById("zavrsni-poziv");
      const nearEnd = end ? end.getBoundingClientRect().top < window.innerHeight : false;
      setShow(window.scrollY > 900 && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={cx(
        "fixed bottom-5 left-4 right-[5.25rem] z-50 transition-all duration-300 sm:hidden",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <Button block size="lg" variant="dark" href={APPLY} onClick={(e) => onNavigate(e, APPLY)} className="h-14 shadow-lg">
        Prijavi se besplatno
      </Button>
    </div>
  );
}
