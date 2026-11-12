// Discounts.jsx
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";
import { discountGroups as defaultGroups, earlyReasons as defaultReasons } from "../data/discounts";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

// Ručno crtana ikonica popusta (cenovnica/tag).
function TagIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20.5 13.5l-7 7a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.5.6l7 7a2 2 0 0 1 0 2.9z" />
      <circle cx="8" cy="8" r="1.4" />
    </svg>
  );
}

/**
 * Discounts — stranica „Popusti".
 *
 * Grupe popusta po programima (kartice), sekcija „8 razloga da se prijaviš
 * ranije", American Adventure Club blok i CTA. Strukturne labele kroz prevod
 * (disc.*); sadržaj popusta ulazi preko propsa (podaci).
 *
 * Props:
 *  - groups:     grupe popusta (default: src/data/discounts.js)
 *  - reasons:    lista razloga (default: src/data/discounts.js)
 *  - onRegister: () => void — CTA dugme.
 *
 * Gde se ubacuje: kao sadržaj rute /popusti (vidi App.jsx — prebacivanje prikaza).
 */
export default function Discounts({
  groups = defaultGroups,
  reasons = defaultReasons,
  onRegister = () => {},
  onNavigate = () => {},
}) {
  const { t } = useTranslation();

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  return (
    <>
      {/* Zaglavlje stranice */}
      <section className="bg-white pt-16 pb-10 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
            {t("disc.kicker")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl lg:text-6xl">
            {t("disc.title")}
          </h1>
          <span className="mx-auto mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mt-6 text-base font-semibold text-[var(--brand-ink)]/70 sm:text-lg">{t("disc.subtitle")}</p>
        </div>
      </section>

      {/* Grupe popusta */}
      <section className="bg-white pb-8">
        <div className="mx-auto max-w-6xl space-y-16 px-6 sm:px-10">
          {groups.map((group) => (
            <div key={group.program}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
                  {group.program}
                </h2>
              </div>
              <span className="mt-3 block h-1 w-12 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />

              {group.notice && (
                <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 text-xs font-medium text-[var(--brand-ink)]/80">
                  <strong className="font-bold text-[var(--brand-ink)]">Važna napomena:</strong> {group.notice}
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <article
                    key={item.title}
                    className="flex h-full flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-xs transition-shadow duration-200 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-xl"
                          style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                        >
                          <TagIcon />
                        </span>
                        {item.timing && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              item.timing === "immediate"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-sky-100 text-sky-800 border border-sky-200"
                            }`}
                          >
                            {item.timingLabel || (item.timing === "immediate" ? "Odmah" : "Na kraju")}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-bold leading-snug text-[var(--brand-ink)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--brand-ink)]/75">{item.text}</p>
                    </div>

                    {item.conditionText && (
                      <div className="mt-4 border-t border-black/[0.06] pt-3 text-[11px] font-semibold text-[var(--brand-ink)]/60">
                        Uslov: {item.conditionText}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8 razloga — bento grid sa ghost brojevima */}
      <section className="bg-[var(--brand-ink)] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-yellow)] sm:text-sm">
              Work and Travel
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t("disc.reasonsTitle")}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason, i) => (
              <div
                key={i}
                className="group relative overflow-hidden bg-[var(--brand-ink)] p-6 transition-colors duration-200 hover:bg-white/[0.04]"
              >
                <span className="text-3xl font-extrabold leading-none text-[var(--brand-yellow)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="relative mt-4 text-sm leading-relaxed text-white/80">{reason}</p>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-5 -right-1 select-none text-8xl font-extrabold leading-none text-white/[0.04] transition-transform duration-300 group-hover:scale-110"
                >
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* American Adventure Club — članska kartica + tekst */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="overflow-hidden rounded-3xl bg-[var(--brand-ink)] px-8 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Mockup kartice */}
              <div className="flex justify-center lg:justify-start">
                <div
                  className="relative aspect-[1.586/1] w-full max-w-sm -rotate-6 rounded-2xl p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)] transition-transform duration-500 hover:rotate-0"
                  style={{ backgroundImage: "linear-gradient(135deg, #FDD503 0%, #E7C200 100%)", color: INK }}
                >
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-tr from-white/0 via-white/25 to-white/0" />
                  <div className="relative flex items-start justify-between">
                    <Logo className="h-9 w-auto" />
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em]">Club</span>
                  </div>
                  <div className="relative mt-7 h-8 w-11 rounded-md" style={{ backgroundColor: "rgba(35,31,32,0.22)" }} aria-hidden="true" />
                  <div className="relative mt-7">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] opacity-70">Member</p>
                    <p className="text-lg font-extrabold leading-tight tracking-tight">American Adventure Club</p>
                  </div>
                </div>
              </div>

              {/* Tekst */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-yellow)] sm:text-sm">
                  {t("disc.kicker")}
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {t("disc.clubTitle")}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                  {t("disc.clubBody")}
                </p>
                <a
                  href="/kontakt"
                  onClick={go("/kontakt")}
                  className="mt-8 inline-block rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                >
                  {t("hero.ctaSecondary")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white pb-20 sm:pb-28">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
            {t("disc.ctaTitle")}
          </h2>
          <button
            type="button"
            onClick={onRegister}
            className="mt-8 rounded-full px-9 py-4 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            style={{ backgroundColor: BRAND_YELLOW, color: INK }}
          >
            {t("auth.register")}
          </button>
        </div>
      </section>
    </>
  );
}
