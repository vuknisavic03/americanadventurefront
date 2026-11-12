// Experiences.jsx
import { useTranslation } from "../i18n/LanguageContext";
import testimonialsData from "../data/testimonials";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

// Inicijali iz imena (npr. "Aleksandar Dujaković" -> "AD").
function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function CheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Experiences — „Iskustva studenata" sekcija.
 *
 * Čiste kartice: avatar sa inicijalima, ime, poslodavac • mesto, pa utisci
 * razloženi po aspektima (Agencija / Lokacija / Poslodavac) sa kvačicom.
 * Labele kroz prevod (exp.*); priče dolaze iz `testimonials` propsa (podaci).
 *
 * Props:
 *  - id:           string (default "iskustva") — anchor.
 *  - testimonials: niz priča (default: src/data/testimonials.js).
 *
 * Gde se ubacuje: u <main>, posle Stats sekcije (vidi App.jsx).
 */
export default function Experiences({ id = "iskustva", testimonials = testimonialsData }) {
  const { t, lang } = useTranslation();

  // Tekst utiska na izabranom jeziku (fallback na srpski).
  const localize = (text) => (typeof text === "string" ? text : text[lang] || text.SR);

  return (
    <section id={id} className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        {/* Naslov */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
            {t("exp.kicker")}
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl lg:text-5xl">
            {t("exp.heading")}
          </h2>
          <span className="mx-auto mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mt-6 text-base text-[var(--brand-ink)]/65 sm:text-lg">{t("exp.subtitle")}</p>
        </div>

        {/* Kartice */}
        <div className="mt-14 grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={`${item.name}-${item.employer}`}
              className="flex h-full flex-col rounded-2xl border border-black/10 bg-white p-6 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-7"
            >
              {/* Zaglavlje */}
              <header className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                  style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                  aria-hidden="true"
                >
                  {initialsOf(item.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-[var(--brand-ink)]">{item.name}</h3>
                  <p className="truncate text-sm text-[var(--brand-ink)]/55">
                    {item.employer} · {item.place}
                  </p>
                </div>
              </header>

              {/* Utisci po aspektima */}
              <div className="mt-6 space-y-5">
                {item.aspects.map((aspect) => (
                  <div key={aspect.key}>
                    <div className="flex items-center gap-2 text-[var(--brand-ink)]">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                      >
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-ink)]/70">
                        {t(aspect.key)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--brand-ink)]/80">
                      {localize(aspect.text)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
