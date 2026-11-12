// NewsArticle.jsx
import { useTranslation } from "../i18n/LanguageContext";
import NewsImage from "./NewsImage";
import newsData from "../data/news";

// „Nazad na vesti" po jeziku (kratko, drži se ovde).
const BACK_LABEL = {
  EN: "Back to news",
  SR: "Nazad na vesti",
  HR: "Natrag na vijesti",
  MK: "Nazad na vesti",
  BS: "Nazad na vijesti",
};

function BackIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

/**
 * NewsArticle — pojedinačna vest (puni tekst).
 *
 * Nalazi vest po `slug`-u, prikazuje sliku, naslov i pasuse (lokalizovano).
 * Naslov/sažetak/telo se biraju po jeziku; „Nazad na vesti" vodi na /vesti.
 *
 * Props:
 *  - slug:       koja vest (string)
 *  - items:      izvor vesti (default: src/data/news.js)
 *  - onNavigate: (event, href) => void
 *
 * Gde se ubacuje: ruta /vesti/<slug> (vidi App.jsx — prebacivanje prikaza).
 */
export default function NewsArticle({ slug, items = newsData, onNavigate = () => {} }) {
  const { t, lang } = useTranslation();
  const tr = (field) => (typeof field === "string" ? field : field?.[lang] || field?.SR);
  const item = items.find((n) => n.slug === slug);

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  if (!item) {
    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <p className="text-lg text-[var(--brand-ink)]/70">404</p>
          <a href="/vesti" onClick={go("/vesti")} className="mt-4 inline-block font-bold text-[var(--brand-ink)] underline">
            {BACK_LABEL[lang] || BACK_LABEL.SR}
          </a>
        </div>
      </section>
    );
  }

  const paragraphs = Array.isArray(item.body?.[lang])
    ? item.body[lang]
    : Array.isArray(item.body?.SR)
    ? item.body.SR
    : [tr(item.excerpt)];

  return (
    <article className="bg-white pb-20 sm:pb-28">
      <div className="mx-auto max-w-3xl px-6 pt-10 sm:px-10 sm:pt-14">
        {/* Nazad */}
        <a
          href="/vesti"
          onClick={go("/vesti")}
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.06em] text-[var(--brand-ink)]/60 transition-colors duration-150 hover:text-[var(--brand-ink)]"
        >
          <BackIcon className="h-4 w-4" />
          {BACK_LABEL[lang] || BACK_LABEL.SR}
        </a>

        {/* Meta */}
        <div className="mt-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.1em]">
          <span className="rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-[var(--brand-ink)]">{item.category}</span>
          <span className="text-[var(--brand-ink)]/45">{item.date}</span>
        </div>

        {/* Naslov */}
        <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-[var(--brand-ink)] sm:text-4xl lg:text-5xl">
          {tr(item.title)}
        </h1>
      </div>

      {/* Slika */}
      <div className="mx-auto mt-8 max-w-4xl px-6 sm:px-10">
        <NewsImage src={item.image} theme={item.theme} alt={tr(item.title)} className="aspect-[16/9] w-full rounded-2xl" />
      </div>

      {/* Tekst */}
      <div className="mx-auto mt-10 max-w-3xl px-6 sm:px-10">
        <div className="space-y-5 text-[1.05rem] leading-relaxed text-[var(--brand-ink)]/80">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
