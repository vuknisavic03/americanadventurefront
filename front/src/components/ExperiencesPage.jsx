// ExperiencesPage.jsx
import { useTranslation } from "../i18n/LanguageContext";
import experiencesData from "../data/experiencesPage";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

// Inicijali iz imena (npr. "Ime Prezime" -> "IP").
function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Veliki navodnik kao akcenat.
function QuoteMark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7.5 6C5 6 3 8 3 10.5S5 15 7.5 15c.3 0 .6 0 .9-.1-.5 1.6-1.9 2.8-3.4 3.1l.5 2c3.4-.7 6-3.7 6-7.4V10.5C11.5 8 9.9 6 7.5 6zm9 0C14 6 12 8 12 10.5S14 15 16.5 15c.3 0 .6 0 .9-.1-.5 1.6-1.9 2.8-3.4 3.1l.5 2c3.4-.7 6-3.7 6-7.4V10.5C20.5 8 18.9 6 16.5 6z" />
    </svg>
  );
}

/**
 * ExperiencesPage — stranica „Iskustva".
 *
 * Zid sa iskustvima studenata (kartice sa citatima). Trenutno PLACEHOLDER
 * (lorem ipsum) dok ne stignu pravi podaci. Naslovi kroz prevod (exp.*),
 * sadržaj ulazi preko propsa (podaci).
 *
 * Props:
 *  - items: lista iskustava (default: src/data/experiencesPage.js)
 *
 * Gde se ubacuje: kao sadržaj rute /iskustva (vidi App.jsx — prebacivanje prikaza).
 */
export default function ExperiencesPage({ items = experiencesData }) {
  const { t } = useTranslation();

  return (
    <>
      {/* Zaglavlje stranice */}
      <section className="bg-white pt-16 pb-12 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
            {t("exp.kicker")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl lg:text-6xl">
            {t("exp.heading")}
          </h1>
          <span className="mx-auto mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--brand-ink)]/65 sm:text-lg">
            {t("exp.subtitle")}
          </p>
        </div>
      </section>

      {/* Zid iskustava */}
      <section className="bg-white pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <article
                key={i}
                className="flex h-full flex-col rounded-2xl border border-black/10 bg-white p-6 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-7"
              >
                <QuoteMark className="h-8 w-8 text-[var(--brand-yellow)]" />

                <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-[var(--brand-ink)]/80">
                  {typeof item.quote === "string" ? item.quote : item.quote.SR}
                </p>

                {item.program && (
                  <span className="mt-5 inline-flex w-fit rounded-full bg-[var(--brand-yellow)]/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-[var(--brand-ink)]/80">
                    {item.program}
                  </span>
                )}

                <div className="mt-5 flex items-center gap-3 border-t border-black/10 pt-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                    style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                    aria-hidden="true"
                  >
                    {initialsOf(item.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--brand-ink)]">{item.name}</p>
                    <p className="truncate text-sm text-[var(--brand-ink)]/55">{item.place}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
