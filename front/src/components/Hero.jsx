// Hero.jsx
import { useTranslation } from "../i18n/LanguageContext";
import { Button, CheckIcon, PlaneIcon } from "./ui";
import { BoardingPass } from "./Home";

const PROMISES = ["Prijava je besplatna", "Novac nazad ako viza ne bude odobrena", "Plaćanje na rate"];

/**
 * Hero — video Amerike preko cele sekcije; preko njega ruta Beograd–Amerika, veliki naslov,
 * dve akcije, a desno karta za ukrcavanje koja je ujedno provera uslova (BoardingPass).
 * Na dnu tabla sa brojkama. Uz prefers-reduced-motion ostaje samo poster slika.
 */
export default function Hero({ applyHref = "/prijava-online?program=work-and-travel", poster = "/videos/hero-poster.jpg", onNavigate = () => {} }) {
  const { t } = useTranslation();
  const go = (href) => (e) => onNavigate(e, href);

  return (
    <section className="relative isolate overflow-hidden bg-ink">
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
      {/* Preliv za čitljivost: tamnije levo i dole, nebo desno ostaje živo */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-ink/85 via-ink/55 to-ink/20" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-ink via-transparent to-transparent" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pb-20 lg:pt-16">
        <div className="lg:col-span-7">
          {/* Ruta */}
          <p className="font-sign flex max-w-md items-center gap-3 text-lg font-bold text-white">
            <span>Beograd</span>
            <span className="perforation flex-1 text-white/45" aria-hidden="true" />
            <PlaneIcon className="h-5 w-5 text-brand" />
            <span className="perforation flex-1 text-white/45" aria-hidden="true" />
            <span>Amerika</span>
          </p>

          <h1 className="font-display mt-7 text-[clamp(2.9rem,7.4vw,6.6rem)] font-extrabold leading-[0.9] text-white">{t("hero.title")}</h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{t("hero.subtitle")}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" href={applyHref} onClick={go(applyHref)}>
              {t("hero.ctaApply")}
            </Button>
            <a
              href="#zarada"
              className="inline-flex h-13 items-center justify-center rounded-full border-2 border-white px-7 text-base font-semibold text-white transition-colors hover:bg-white hover:text-ink"
            >
              Izračunaj zaradu
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {PROMISES.map((x) => (
              <li key={x} className="flex items-center gap-2 text-[15px] font-medium text-white">
                <CheckIcon className="h-4 w-4 text-brand" strokeWidth={3} />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 lg:pl-4">
          <BoardingPass onNavigate={onNavigate} />
        </div>
      </div>

      {/* Tabla sa brojkama */}
      <div className="border-t border-white/15 bg-ink/50 backdrop-blur-md">
        <dl className="mx-auto grid w-full max-w-7xl grid-cols-3 px-5 sm:px-8">
          {BOARD.map((b) => (
            <div key={b.label} className="border-l border-white/15 py-5 pl-4 first:border-l-0 first:pl-0 sm:py-6 sm:pl-8">
              <dd className="font-sign text-4xl font-extrabold leading-none text-brand sm:text-6xl">{b.value}</dd>
              <dt className="mt-1.5 text-[13px] leading-snug text-white/80 sm:text-[15px]">{b.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const BOARD = [
  { value: "8.123", label: "učesnika do sada" },
  { value: "83", label: "grada u Americi" },
  { value: "45", label: "američkih država" },
];
