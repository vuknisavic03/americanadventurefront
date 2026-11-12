// News.jsx
import { useTranslation } from "../i18n/LanguageContext";
import NewsImage from "./NewsImage";
import newsData from "../data/news";

function ArrowIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * News — stranica „Vesti".
 *
 * Magazinski format: istaknuta (prva) vest + grid ostalih. Naslov i sažetak su
 * lokalizovani po jeziku; chrome (kicker, naslov, „Pročitaj više") kroz prevod.
 *
 * Props:
 *  - items:      vesti (default: src/data/news.js)
 *  - onNavigate: (event, href) => void — klik na vest / „Pročitaj više"
 *
 * Gde se ubacuje: kao sadržaj rute /vesti (vidi App.jsx — prebacivanje prikaza).
 */
export default function News({ items = newsData, onNavigate = () => {} }) {
  const { t, lang } = useTranslation();
  const tr = (field) => (typeof field === "string" ? field : field[lang] || field.SR);

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  const [featured, ...rest] = items;

  const Meta = ({ item }) => (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.1em]">
      <span className="rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-[var(--brand-ink)]">{item.category}</span>
      <span className="text-[var(--brand-ink)]/45">{item.date}</span>
    </div>
  );

  const ReadMore = ({ href }) => (
    <a
      href={href}
      onClick={go(href)}
      className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.06em] text-[var(--brand-ink)] transition-colors duration-150 hover:text-[var(--brand-ink)]/60"
    >
      {t("news.readMore")}
      <ArrowIcon className="h-4 w-4" />
    </a>
  );

  return (
    <>
      {/* Zaglavlje */}
      <section className="bg-white pt-16 pb-12 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
            {t("news.kicker")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl lg:text-6xl">
            {t("news.heading")}
          </h1>
          <span className="mx-auto mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--brand-ink)]/65 sm:text-lg">
            {t("news.subtitle")}
          </p>
        </div>
      </section>

      <section className="bg-white pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          {/* Istaknuta vest */}
          {featured && (
            <article className="grid overflow-hidden rounded-3xl border border-black/10 shadow-xs transition-shadow duration-200 hover:shadow-md lg:grid-cols-2">
              <a href={`/vesti/${featured.slug}`} onClick={go(`/vesti/${featured.slug}`)} className="block">
                <NewsImage src={featured.image} theme={featured.theme} alt={tr(featured.title)} className="h-64 w-full lg:h-full" />
              </a>
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <Meta item={featured} />
                <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[var(--brand-ink)] sm:text-3xl">
                  <a href={`/vesti/${featured.slug}`} onClick={go(`/vesti/${featured.slug}`)} className="transition-colors duration-150 hover:text-[var(--brand-ink)]/70">
                    {tr(featured.title)}
                  </a>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--brand-ink)]/75">{tr(featured.excerpt)}</p>
                <ReadMore href={`/vesti/${featured.slug}`} />
              </div>
            </article>
          )}

          {/* Ostale vesti */}
          {rest.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {rest.map((item) => (
                <article
                  key={item.slug}
                  className="flex flex-col overflow-hidden rounded-2xl border border-black/10 shadow-xs transition-shadow duration-200 hover:shadow-md"
                >
                  <a href={`/vesti/${item.slug}`} onClick={go(`/vesti/${item.slug}`)} className="block">
                    <NewsImage src={item.image} theme={item.theme} alt={tr(item.title)} className="aspect-[16/9] w-full" />
                  </a>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <Meta item={item} />
                    <h3 className="mt-3 text-xl font-bold leading-snug tracking-tight text-[var(--brand-ink)]">
                      <a href={`/vesti/${item.slug}`} onClick={go(`/vesti/${item.slug}`)} className="transition-colors duration-150 hover:text-[var(--brand-ink)]/70">
                        {tr(item.title)}
                      </a>
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--brand-ink)]/75">{tr(item.excerpt)}</p>
                    <ReadMore href={`/vesti/${item.slug}`} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
