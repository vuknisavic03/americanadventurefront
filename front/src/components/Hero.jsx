// Hero.jsx
import { useTranslation } from "../i18n/LanguageContext";
import { Button, CheckIcon, PlaneIcon } from "./ui";
import { BoardingPass } from "./Home";

const PROMISES = ["Prijava je besplatna", "Novac nazad ako viza ne bude odobrena", "Plaćanje na rate"];

/**
 * Hero — žuto polje kao putokaz: ruta Beograd–Amerika, veliki naslov, dve akcije,
 * a desno karta za ukrcavanje koja je ujedno provera uslova (BoardingPass).
 * Odmah ispod: video kroz „prozor" sa tablom brojki (HeroBoard).
 */
export default function Hero({ applyHref = "/prijava-online?program=work-and-travel", onNavigate = () => {} }) {
  const { t } = useTranslation();
  const go = (href) => (e) => onNavigate(e, href);

  return (
    <>
      <section className="relative overflow-hidden bg-brand">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pb-24 lg:pt-16">
          <div className="lg:col-span-7">
            {/* Ruta */}
            <p className="font-sign flex max-w-md items-center gap-3 text-lg font-bold text-ink">
              <span>Beograd</span>
              <span className="perforation flex-1 text-ink/40" aria-hidden="true" />
              <PlaneIcon className="h-5 w-5" />
              <span className="perforation flex-1 text-ink/40" aria-hidden="true" />
              <span>Amerika</span>
            </p>

            <h1 className="font-display mt-7 text-[clamp(2.9rem,7.4vw,6.6rem)] font-extrabold leading-[0.9] text-ink">
              {t("hero.title")}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink/80 sm:text-xl">{t("hero.subtitle")}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="dark" href={applyHref} onClick={go(applyHref)}>
                {t("hero.ctaApply")}
              </Button>
              <a
                href="#zarada"
                className="inline-flex h-13 items-center justify-center rounded-full border-2 border-ink px-7 text-base font-semibold text-ink transition-colors hover:bg-ink hover:text-brand"
              >
                Izračunaj zaradu
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {PROMISES.map((x) => (
                <li key={x} className="flex items-center gap-2 text-[15px] font-medium text-ink">
                  <CheckIcon className="h-4 w-4" strokeWidth={3} />
                  {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 lg:pl-4">
            <BoardingPass onNavigate={onNavigate} />
          </div>
        </div>
      </section>
      <HeroBoard />
    </>
  );
}

const BOARD = [
  { value: "8.123", label: "učesnika do sada" },
  { value: "83", label: "grada u Americi" },
  { value: "45", label: "američkih država" },
];

/** Video Amerike kroz širok prozor, sa brojkama kao na aerodromskoj tabli. */
function HeroBoard({ poster = "/videos/hero-poster.jpg" }) {
  return (
    <section className="bg-ink">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden sm:px-8">
        <div className="relative isolate aspect-[4/5] overflow-hidden sm:aspect-[21/9] sm:rounded-b-[2rem]">
          <video
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover motion-reduce:hidden"
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="/videos/hero-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
          <img src={poster} alt="" className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full object-cover motion-reduce:block" />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/30 to-transparent" aria-hidden="true" />

          <dl className="absolute inset-x-0 bottom-0 grid grid-cols-1 gap-5 px-5 pb-7 sm:grid-cols-3 sm:gap-0 sm:px-10 sm:pb-9">
            {BOARD.map((b) => (
              <div key={b.label} className="sm:border-l sm:border-white/25 sm:pl-6 sm:first:border-l-0 sm:first:pl-0">
                <dd className="font-sign text-6xl font-extrabold leading-none text-brand sm:text-7xl lg:text-8xl">{b.value}</dd>
                <dt className="mt-2 text-[15px] text-white/85">{b.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
