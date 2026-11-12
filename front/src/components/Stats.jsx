// Stats.jsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

// Ručno crtane ikonice (bez biblioteka), nasleđuju boju preko currentColor.
function UsersIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 14c2.3.4 4 2.3 4 5" />
    </svg>
  );
}

function CityIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V8l5-3 5 3v13" />
      <path d="M15 21V11l4 2v8" />
      <path d="M8 11h0M8 14h0M8 17h0M11 11h0M11 14h0M11 17h0" />
    </svg>
  );
}

function FlagIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 21V4" />
      <path d="M5 5c2-1.3 4-1.3 6 0s4 1.3 6 0v8c-2 1.3-4 1.3-6 0s-4-1.3-6 0" />
    </svg>
  );
}

// Brojke + ikonice + labeli. Vrednosti su podaci — backend ih lako menja.
const STATS = [
  { value: 8123, key: "stats.users", Icon: UsersIcon },
  { value: 83, key: "stats.cities", Icon: CityIcon },
  { value: 45, key: "stats.states", Icon: FlagIcon },
];

// Formatiranje sa tačkom kao separatorom hiljada (8.123).
function formatNumber(n) {
  return n.toLocaleString("de-DE");
}

/**
 * Stats — „u brojkama" traka koja dočarava veličinu agencije.
 *
 * Tamna brend podloga, framing naslov + podnaslov, pa tri velike žute brojke
 * sa ikonicama koje se „izbroje" pri ulasku u ekran (poštuje prefers-reduced-motion).
 * Sav tekst kroz prevod (stats.*).
 *
 * Gde se ubacuje: u <main>, ispod About sekcije (vidi App.jsx).
 */
export default function Stats() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [run, setRun] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setInstant(true);
      setRun(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-24" style={{ backgroundColor: INK }}>
      {/* Suptilni žuti akcent u pozadini */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.07] blur-2xl"
        style={{ backgroundColor: BRAND_YELLOW }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        {/* Framing naslov */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t("stats.heading")}
          </h2>
          <p className="mt-4 text-base text-white/60 sm:text-lg">{t("stats.subtitle")}</p>
        </div>

        {/* Brojke */}
        <div className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-6">
          {STATS.map((stat, i) => (
            <StatItem
              key={stat.key}
              value={stat.value}
              label={t(stat.key)}
              Icon={stat.Icon}
              run={run}
              instant={instant}
              withDivider={i > 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label, Icon, run, instant, withDivider }) {
  const count = useCountUp(value, run, instant);
  return (
    <div className={`px-4 text-center ${withDivider ? "sm:border-l sm:border-white/10" : ""}`}>
      <Icon className="mx-auto h-8 w-8 text-[var(--brand-yellow)]" />
      <div
        className="mt-4 text-5xl font-extrabold leading-none tracking-tight sm:text-6xl lg:text-7xl"
        style={{ color: BRAND_YELLOW, fontFamily: "'Archivo', system-ui, sans-serif" }}
      >
        {formatNumber(count)}
      </div>
      <div className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/70 sm:text-base">
        {label}
      </div>
    </div>
  );
}

// Count-up od 0 do target uz easeOutCubic. Ako je `instant`, odmah prikaže target.
function useCountUp(target, run, instant, duration = 1800) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (instant) {
      setVal(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, instant, target, duration]);

  return val;
}
