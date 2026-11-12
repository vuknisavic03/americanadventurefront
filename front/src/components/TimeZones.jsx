// TimeZones.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { MoonIcon, SunIcon, cx } from "./ui";

// Šest glavnih vremenskih zona SAD (Prilog 1B, tačka 7) — po jedan grad za svaku.
const ZONES = [
  { id: "new-york", nameKey: "tz.newYork", defaultName: "New York", iana: "America/New_York", code: "ET" },
  { id: "chicago", nameKey: "tz.chicago", defaultName: "Chicago", iana: "America/Chicago", code: "CT" },
  { id: "denver", nameKey: "tz.denver", defaultName: "Denver", iana: "America/Denver", code: "MT" },
  { id: "los-angeles", nameKey: "tz.losAngeles", defaultName: "Los Angeles", iana: "America/Los_Angeles", code: "PT" },
  { id: "alaska", nameKey: "tz.alaska", defaultName: "Anchorage", iana: "America/Anchorage", code: "AKT" },
  { id: "hawaii", nameKey: "tz.hawaii", defaultName: "Honolulu", iana: "Pacific/Honolulu", code: "HST" },
];

const HOME_ZONE = "Europe/Belgrade";

// Pomak zone od UTC u minutima za dati trenutak (uzima u obzir letnje računanje vremena).
function utcOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - date.getTime()) / 60000);
}

function zoneInfo(now, iana) {
  try {
    const time = new Intl.DateTimeFormat("sr-Latn-RS", {
      timeZone: iana,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    const hour = Number(time.slice(0, 2));
    const diffH = (utcOffsetMinutes(now, iana) - utcOffsetMinutes(now, HOME_ZONE)) / 60;
    return { time, day: hour >= 6 && hour < 20, diff: `${diffH > 0 ? "+" : "−"}${Math.abs(diffH)} h` };
  } catch {
    return { time: "--:--", day: true, diff: "" };
  }
}

/**
 * TimeZones — tabla sa tačnim vremenom u šest zona SAD (uživo).
 * Razlika u odnosu na Beograd se računa, pa ostaje tačna i kad SAD i Evropa
 * ne pomeraju sat istog dana (Havaji uopšte ne pomeraju).
 *
 * Props: tone — "dark" (preko videa / tamne podloge, default) ili "light".
 */
export default function TimeZones({ tone = "dark", className = "" }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  // Prikaz je na minut — osvežavamo tačno na prelazu minuta, ne svake sekunde.
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, 60000 - (Date.now() % 60000) + 50);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const dark = tone === "dark";
  const name = (zone) => {
    const translated = t(zone.nameKey);
    return translated === zone.nameKey ? zone.defaultName : translated;
  };

  return (
    <section aria-label={t("tz.title")} className={className}>
      <dl className={cx("grid grid-cols-3 lg:grid-cols-6", dark ? "text-white" : "text-ink")}>
        {ZONES.map((zone, i) => {
          const info = zoneInfo(now, zone.iana);
          return (
            <div
              key={zone.id}
              className={cx(
                "px-3 py-4 sm:px-5",
                dark ? "border-white/15" : "border-line",
                i % 3 !== 0 && "border-l",
                i > 2 && "border-t lg:border-t-0",
                i === 3 && "lg:border-l"
              )}
            >
              <dt className={cx("truncate text-xs sm:text-[13px]", dark ? "text-white/70" : "text-ink-3")}>{name(zone)}</dt>
              <dd className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold tabular-nums sm:text-2xl">{info.time}</span>
                <span className={cx("hidden items-center gap-1 text-xs tabular-nums sm:inline-flex", dark ? "text-white/60" : "text-ink-3")}>
                  {info.day ? <SunIcon className="h-3 w-3 translate-y-px" /> : <MoonIcon className="h-3 w-3 translate-y-px" />}
                  <span title={t("tz.diffHint")}>{info.diff}</span>
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
