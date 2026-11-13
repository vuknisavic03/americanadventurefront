// NewsArticle.jsx
import { useTranslation } from "../i18n/LanguageContext";
import NewsImage from "./NewsImage";
import newsData from "../data/news";
import CtaBand from "./CtaBand";
import { Button } from "./ui";

// „Nazad na vesti" po jeziku (kratko, drži se ovde).
const BACK_LABEL = {
  EN: "Back to news",
  SR: "Nazad na vesti",
  HR: "Natrag na vijesti",
  MK: "Nazad na vesti",
  BS: "Nazad na vijesti",
};

/**
 * NewsArticle — pojedinačna vest (puni tekst).
 *
 * Nalazi vest po `slug`-u, prikazuje sliku, naslov i pasuse (lokalizovano).
 * Naslov/sažetak/telo se biraju po jeziku; „Nazad na vesti" vodi na /novosti.
 *
 * Props:
 *  - slug:       koja vest (string)
 *  - items:      izvor vesti (default: src/data/news.js)
 *  - onNavigate: (event, href) => void
 *
 * Gde se ubacuje: ruta /novosti/<slug> (vidi App.jsx — prebacivanje prikaza).
 */
export default function NewsArticle({ slug, items = newsData, onNavigate = () => {} }) {
  const { lang } = useTranslation();
  const tr = (field) => (typeof field === "string" ? field : field?.[lang] || field?.SR);
  const item = items.find((n) => n.slug === slug);
  const backHref = "/novosti";
  const backLabel = BACK_LABEL[lang] || BACK_LABEL.SR;
  const goBack = (e) => onNavigate(e, backHref);

  if (!item) {
    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <h1 className="font-display text-3xl font-bold text-ink">Ova vest ne postoji</h1>
          <p className="mt-4 text-base text-ink-2">Možda je uklonjena ili je adresa pogrešno upisana.</p>
          <Button variant="outline" className="mt-8" href={backHref} onClick={goBack}>
            {backLabel}
          </Button>
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
    <article className="bg-white">
      <header className="bg-brand pb-40 sm:pb-56">
        <div className="mx-auto max-w-4xl px-5 pt-10 sm:px-8 sm:pt-14">
          <a href={backHref} onClick={goBack} className="text-[15px] font-semibold text-ink underline decoration-2 decoration-ink/30 underline-offset-[5px] hover:decoration-ink">
            {backLabel}
          </a>
          <p className="mt-10 flex flex-wrap items-center gap-x-3 text-sm">
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-brand">{item.category}</span>
            <time className="font-sign text-[15px] font-semibold text-ink/70">{item.date}</time>
          </p>
          <h1 className="font-display mt-5 text-[clamp(2.3rem,5.4vw,4.4rem)] font-extrabold leading-[0.96] text-ink">{tr(item.title)}</h1>
        </div>
      </header>

      <div className="mx-auto -mt-32 max-w-5xl px-5 sm:-mt-44 sm:px-8">
        <NewsImage src={item.image} theme={item.theme} alt={tr(item.title)} className="aspect-[16/9] w-full rounded-[1.5rem]" />
      </div>

      <div className="mx-auto mt-14 max-w-2xl space-y-5 px-5 text-[18px] leading-[1.7] text-ink sm:px-8">
        {paragraphs.map((p, i) =>
          p.startsWith("## ") ? (
            <h2 key={i} className="font-display pt-6 text-[1.6rem] font-extrabold leading-tight text-ink">{p.slice(3)}</h2>
          ) : p.startsWith("• ") ? (
            <p key={i} className="flex gap-4">
              <span className="mt-[12px] h-2 w-2 shrink-0 bg-brand ring-2 ring-ink" aria-hidden="true" />
              <span>{p.slice(2)}</span>
            </p>
          ) : i === 0 ? (
            <p key={i} className="text-[21px] leading-[1.55] text-ink">{p}</p>
          ) : (
            <p key={i} className="text-ink/85">{p}</p>
          )
        )}
      </div>

      <CtaBand className="mt-24" onNavigate={onNavigate} />
    </article>
  );
}
