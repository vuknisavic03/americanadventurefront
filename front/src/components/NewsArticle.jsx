// NewsArticle.jsx
import { useTranslation } from "../i18n/LanguageContext";
import NewsImage from "./NewsImage";
import newsData from "../data/news";
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
    <article className="bg-white pb-20 sm:pb-28">
      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-8 sm:pt-14">
        <a href={backHref} onClick={goBack} className="text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline">
          ← {backLabel}
        </a>

        <p className="mt-10 flex flex-wrap gap-x-3 text-sm">
          <span className="font-medium text-ink">{item.category}</span>
          <time className="tabular-nums text-ink-3">{item.date}</time>
        </p>
        <h1 className="font-display mt-4 text-3xl font-bold leading-[1.1] text-ink sm:text-5xl">{tr(item.title)}</h1>
      </div>

      <div className="mx-auto mt-10 max-w-4xl px-5 sm:px-8">
        <NewsImage src={item.image} theme={item.theme} alt={tr(item.title)} className="aspect-[16/9] w-full rounded-2xl" />
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-5 px-5 text-[17px] leading-relaxed text-ink sm:px-8">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
