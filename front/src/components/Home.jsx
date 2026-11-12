// Home.jsx — sekcije početne strane ispod heroja.
// Redosled prati pitanja studenta: šta nudite → kako ide → koliko košta → šta kažu drugi → šta ako… → prijava.
import homeVoices, { VOICES_TOTAL } from "../data/homeVoices";
import { SWT_FAQS } from "../data/faq";
import { useTranslation } from "../i18n/LanguageContext";
import { ArrowRightIcon, Button, CheckIcon, ChevronDownIcon, Container, SectionHeading, cx } from "./ui";

const APPLY = "/prijava-online?program=work-and-travel";

const linkCls =
  "inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:decoration-ink";

/* ---------- Programi ---------- */
const PROGRAMS = [
  { id: "internship", title: "Internship & Training", who: "Studenti završnih godina i diplomci", text: "Plaćena stručna praksa do 12, odnosno 18 meseci." },
  { id: "high-school", title: "High School USA", who: "Učenici od 14,5 do 18,5 godina", text: "Polugodište ili godina u američkoj školi i porodici domaćinu." },
  { id: "au-pair", title: "Au Pair USA", who: "Od 18 do 26 godina", text: "Godina u američkoj porodici uz čuvanje dece i kurs na koledžu." },
];

export function HomePrograms({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading title="Izaberi svoj program" lead="Najviše studenata bira Work and Travel. Ako nisi student, imamo program i za tebe." />

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {/* Glavni program */}
          <a
            href="/programi?p=work-and-travel"
            onClick={go("/programi?p=work-and-travel")}
            className="group flex flex-col justify-between rounded-3xl bg-ink p-8 text-white transition-colors hover:bg-neutral-950 sm:p-10 lg:col-span-6"
          >
            <div>
              <p className="text-sm text-white/70">Redovni studenti, 19–26 godina</p>
              <h3 className="font-display mt-2 text-3xl font-bold leading-[1.1] sm:text-4xl">Work and Travel USA 2027</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
                Do četiri meseca rada u turističkom mestu, pa još 30 dana putovanja po Americi.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
              <dl className="flex gap-8">
                <div>
                  <dt className="text-[13px] text-white/60">Cena programa</dt>
                  <dd className="font-display text-2xl font-bold">od $1.875</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-white/60">Satnica</dt>
                  <dd className="font-display text-2xl font-bold">$10–20</dd>
                </div>
              </dl>
              <span className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-semibold text-ink transition-colors group-hover:bg-brand-strong">
                Pogledaj program <ArrowRightIcon className="h-4 w-4" />
              </span>
            </div>
          </a>

          {/* Ostali programi */}
          <div className="grid gap-5 lg:col-span-6">
            {PROGRAMS.map((p) => (
              <a
                key={p.id}
                href={`/programi?p=${p.id}`}
                onClick={go(`/programi?p=${p.id}`)}
                className="group flex items-center justify-between gap-6 rounded-3xl border border-line p-6 transition-colors hover:border-ink/40 sm:p-7"
              >
                <div>
                  <p className="text-[13px] text-ink-3">{p.who}</p>
                  <h3 className="mt-1 text-xl font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{p.text}</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-1 group-hover:text-ink" />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-8">
          <a href="/programi" onClick={go("/programi")} className={linkCls}>
            Svi programi i usluge <ArrowRightIcon className="h-4 w-4" />
          </a>
        </p>
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
  { name: "Self", price: "$1.875", text: "Posao nalaziš sam, mi vodimo papire i vizu.", href: APPLY },
  { name: "Full", price: "$2.275", text: "Posao i smeštaj obezbeđujemo mi.", featured: true, href: APPLY },
  { name: "Lifeguard", price: "$2.075", text: "Spasilac na bazenu kod Vašingtona ili Bostona. Trenutno $300 popusta.", href: APPLY },
];
const INCLUDED = ["DS-2019 obrazac i SEVIS taksa", "Zdravstveno osiguranje", "Priprema za intervju i ambasadu", "Besplatan prevod dokumenata"];
const TERMS = [
  { title: "Plaćanje na rate", text: "Poslednja rata najkasnije do 1. maja." },
  { title: "Novac nazad", text: "Ako ispunjavaš uslove programa, a viza ne bude odobrena." },
  { title: "Plati kad zaradiš", text: "Veći deo programa po povratku. Broj mesta je ograničen." },
];

export function HomePricing({ onNavigate }) {
  const go = (href) => (e) => onNavigate(e, href);
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading
          title="Koliko košta Work and Travel"
          lead="Cene su početne i važe za sezonu 2027. Viza ($185), avio karta i smeštaj plaćaju se posebno."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className={cx("flex flex-col rounded-3xl p-7 sm:p-8", p.featured ? "bg-surface ring-2 ring-ink" : "border border-line")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">{p.name} paket</h3>
                {p.featured && <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">Najčešći izbor</span>}
              </div>
              <p className="font-display mt-5 text-4xl font-bold text-ink">
                <span className="align-middle text-base font-medium text-ink-3">od </span>
                {p.price}
              </p>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-2">{p.text}</p>
              <Button className="mt-7" block variant={p.featured ? "primary" : "outline"} href={p.href} onClick={go(p.href)}>
                Prijavi se
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 border-t border-line pt-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h3 className="text-base font-semibold text-ink">U svakom paketu</h3>
            <ul className="mt-4 space-y-2.5">
              {INCLUDED.map((x) => (
                <li key={x} className="flex items-start gap-3 text-[15px] text-ink-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
                    <CheckIcon className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <dl className="grid gap-6 sm:grid-cols-3 lg:col-span-7">
            {TERMS.map((x) => (
              <div key={x.title}>
                <dt className="text-base font-semibold text-ink">{x.title}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{x.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-8">
          <a href="/akcije" onClick={go("/akcije")} className={linkCls}>
            Svi popusti i modeli plaćanja <ArrowRightIcon className="h-4 w-4" />
          </a>
        </p>
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
            <a href="/foto-story" onClick={(e) => onNavigate(e, "/foto-story")} className={linkCls}>
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
