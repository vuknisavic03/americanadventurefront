// Hero.jsx
import { useTranslation } from "../i18n/LanguageContext";
import { Button, CheckIcon } from "./ui";
import { EligibilityCheck } from "./Home";

const STATS = [
  { value: "8.123", label: "učesnika do sada" },
  { value: "83", label: "grada u SAD" },
  { value: "45", label: "saveznih država" },
];

const PROMISES = ["Prijava je besplatna", "Novac nazad ako viza ne bude odobrena", "Plaćanje na rate"];

/**
 * Hero — video Amerike preko celog ekrana, naslov, dve akcije i tri obećanja
 * koja skidaju rizik sa prijave. Na desktopu desno stoji brza provera uslova
 * (na telefonu je ista provera odmah ispod heroja, vidi HomeEligibility).
 *
 * Fajlovi u public/videos/: hero.mp4 (1600×900), hero-mobile.mp4 (960×540), hero-poster.jpg
 */
export default function Hero({
  poster = "/videos/hero-poster.jpg",
  applyHref = "/prijava-online?program=work-and-travel",
  programsHref = "#zarada",
  onNavigate = () => {},
}) {
  const { t } = useTranslation();
  const go = (href) => (e) => {
    if (href.startsWith("#")) return; // sidro na istoj strani — pusti browser
    onNavigate(e, href);
  };

  return (
    <section className="relative isolate flex min-h-[calc(100svh-9.5rem)] flex-col justify-end overflow-hidden bg-ink lg:min-h-[calc(100svh-72px)]">
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
      <img
        src={poster}
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full object-cover motion-reduce:block"
      />

      {/* Preliv za čitljivost: odozdo i sleva, nebo gore desno ostaje čisto */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/55 via-45% to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-linear-to-r from-ink/60 to-transparent lg:block" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-10 pt-32 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:pt-40">
        <div className="lg:col-span-7">
          <p className="inline-flex animate-rise items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            Prijave za leto 2027. su otvorene
          </p>
          <h1 className="font-display mt-5 max-w-4xl animate-rise text-[2.6rem] font-bold leading-[1.02] text-white [animation-delay:60ms] sm:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-white/85 [animation-delay:120ms] sm:text-xl">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex animate-rise flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <Button size="lg" href={applyHref} onClick={go(applyHref)}>
              {t("hero.ctaApply")}
            </Button>
            <Button size="lg" variant="inverse" href={programsHref} onClick={go(programsHref)}>
              Izračunaj zaradu
            </Button>
          </div>
          <ul className="mt-6 flex animate-rise flex-wrap gap-x-5 gap-y-2 [animation-delay:320ms]">
            {PROMISES.map((x) => (
              <li key={x} className="flex items-center gap-2 text-sm text-white/85">
                <CheckIcon className="h-4 w-4 text-brand" strokeWidth={3} />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden animate-rise [animation-delay:400ms] lg:col-span-5 lg:block lg:pl-6">
          <EligibilityCheck onNavigate={onNavigate} />
        </div>
      </div>

      {/* Brojke — dokaz odmah ispod poziva na akciju */}
      <div className="border-t border-white/15 bg-ink/40 backdrop-blur-md">
        <dl className="mx-auto grid w-full max-w-7xl grid-cols-3 divide-x divide-white/15 px-5 sm:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="py-4 pl-4 first:pl-0 sm:py-5 sm:pl-8">
              <dd className="font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">{s.value}</dd>
              <dt className="mt-0.5 text-[13px] leading-snug text-white/70">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
