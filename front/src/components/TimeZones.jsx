// TimeZones.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

const ZONES = [
  {
    id: "new-york",
    nameKey: "tz.newYork",
    defaultName: "New York",
    iana: "America/New_York",
    code: "ET (Eastern)",
    diff: "-6h",
    state: "New York (Istočna obala)",
    tag: "Finansije & Turizam",
  },
  {
    id: "chicago",
    nameKey: "tz.chicago",
    defaultName: "Chicago",
    iana: "America/Chicago",
    code: "CT (Central)",
    diff: "-7h",
    state: "Illinois (Srednji zapad)",
    tag: "Velika jezera & Posao",
  },
  {
    id: "las-vegas",
    nameKey: "tz.lasVegas",
    defaultName: "Las Vegas",
    iana: "America/Los_Angeles",
    code: "PT (Pacific)",
    diff: "-9h",
    state: "Nevada (Jugozapad)",
    tag: "Hotelijerstvo & Resorti",
  },
  {
    id: "los-angeles",
    nameKey: "tz.losAngeles",
    defaultName: "Los Angeles",
    iana: "America/Los_Angeles",
    code: "PT (Pacific)",
    diff: "-9h",
    state: "California (Zapadna obala)",
    tag: "Okean, Plaže & Zabava",
  },
  {
    id: "alaska",
    nameKey: "tz.alaska",
    defaultName: "Aljaska (Anchorage)",
    iana: "America/Anchorage",
    code: "AKT (Alaska)",
    diff: "-10h",
    state: "Alaska (Sever)",
    tag: "Priroda & Visoke satnice",
  },
  {
    id: "hawaii",
    nameKey: "tz.hawaii",
    defaultName: "Havaji (Honolulu)",
    iana: "Pacific/Honolulu",
    code: "HST (Hawaii)",
    diff: "-12h",
    state: "Hawaii (Pacifik)",
    tag: "Tropski raj & Turizam",
  },
];

function SunIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ClockIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function TimeZones() {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const translateOrDefault = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (iana) => {
    try {
      const formatter = new Intl.DateTimeFormat("sr-RS", {
        timeZone: iana,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      return formatter.format(now);
    } catch {
      return "--:--:--";
    }
  };

  const formatDate = (iana) => {
    try {
      const formatter = new Intl.DateTimeFormat("sr-RS", {
        timeZone: iana,
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      return formatter.format(now);
    } catch {
      return "";
    }
  };

  const isDaytime = (iana) => {
    try {
      const hourFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: iana,
        hour: "numeric",
        hour12: false,
      });
      const hour = parseInt(hourFormatter.format(now), 10);
      return hour >= 6 && hour < 20;
    } catch {
      return true;
    }
  };

  return (
    <section className="border-y border-black/10 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--brand-ink)]/50 sm:text-sm">
              <ClockIcon className="h-4 w-4 text-[var(--brand-ink)]" />
              <span>{translateOrDefault("tz.kicker", "Uživo iz Amerike")}</span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
              {translateOrDefault("tz.title", "Vremenske zone u SAD")}
            </h2>
            <p className="mt-3 max-w-xl text-base text-[var(--brand-ink)]/70">
              {translateOrDefault(
                "tz.subtitle",
                "SAD se prostire kroz 6 glavnih vremenskih zona. Pratite tačno lokalno vreme na lokacijama gde naši studenti rade i putuju."
              )}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-bold text-[var(--brand-ink)]/70">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
            <span>{translateOrDefault("tz.liveUpdate", "Ažuriranje u realnom vremenu")}</span>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {ZONES.map((zone) => {
            const time = formatTime(zone.iana);
            const date = formatDate(zone.iana);
            const day = isDaytime(zone.iana);

            return (
              <div
                key={zone.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-black/25 hover:shadow-md"
              >
                {/* Oznaka dana/noći */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold tracking-wider text-[var(--brand-ink)]/50">
                    {zone.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                      day
                        ? "bg-amber-100 text-amber-800"
                        : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {day ? <SunIcon className="h-3 w-3" /> : <MoonIcon className="h-3 w-3" />}
                    <span>{day ? "Dan" : "Noć"}</span>
                  </span>
                </div>

                {/* Ime grada i vreme */}
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-[var(--brand-ink)]">
                    {translateOrDefault(zone.nameKey, zone.defaultName)}
                  </h3>
                  <p className="text-[0.72rem] text-[var(--brand-ink)]/55">{zone.state}</p>

                  <div className="mt-3 font-mono text-2xl font-black tracking-tight text-[var(--brand-ink)]">
                    {time}
                  </div>
                  <div className="mt-0.5 text-xs font-medium capitalize text-[var(--brand-ink)]/50">
                    {date}
                  </div>
                </div>

                {/* Razlika i tag */}
                <div className="mt-4 border-t border-black/5 pt-3">
                  <div className="flex items-center justify-between text-[0.7rem] font-bold">
                    <span className="text-[var(--brand-ink)]/50">Razlika od BG:</span>
                    <span className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: BRAND_YELLOW, color: INK }}>
                      {zone.diff}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.68rem] text-[var(--brand-ink)]/65 truncate" title={zone.tag}>
                    {zone.tag}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
