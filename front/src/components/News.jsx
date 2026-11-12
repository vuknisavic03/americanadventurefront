// News.jsx
import { useTranslation } from "../i18n/LanguageContext";
import NewsImage from "./NewsImage";
import newsData from "../data/news";
import { Container, PageHeader } from "./ui";

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
 * Gde se ubacuje: ruta /novosti (vidi App.jsx).
 */
export default function News({ items = newsData, onNavigate = () => {} }) {
  const { t, lang } = useTranslation();
  const tr = (field) => (typeof field === "string" ? field : field[lang] || field.SR);
  const hrefOf = (item) => `/novosti/${item.slug}`;
  const go = (href) => (e) => onNavigate(e, href);

  const [featured, ...rest] = items;

  const Meta = ({ item }) => (
    <p className="flex flex-wrap gap-x-3 text-sm">
      <span className="font-medium text-ink">{item.category}</span>
      <time className="tabular-nums text-ink-3">{item.date}</time>
    </p>
  );

  return (
    <>
      <PageHeader title={t("news.heading")} lead={t("news.subtitle")} />

      <section className="bg-white py-14 sm:py-20">
        <Container>
          {items.length === 0 && <p className="text-base text-ink-2">Trenutno nema objavljenih novosti.</p>}

          {/* Istaknuta vest */}
          {featured && (
            <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <a href={hrefOf(featured)} onClick={go(hrefOf(featured))} tabIndex={-1} aria-hidden="true" className="block">
                <NewsImage src={featured.image} theme={featured.theme} alt="" className="aspect-[16/10] w-full rounded-2xl" />
              </a>
              <div>
                <Meta item={featured} />
                <h2 className="font-display mt-4 text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">
                  <a href={hrefOf(featured)} onClick={go(hrefOf(featured))} className="hover:underline hover:decoration-brand hover:decoration-4 hover:underline-offset-4">
                    {tr(featured.title)}
                  </a>
                </h2>
                <p className="mt-5 text-base leading-relaxed text-ink-2 sm:text-lg">{tr(featured.excerpt)}</p>
                <a
                  href={hrefOf(featured)}
                  onClick={go(hrefOf(featured))}
                  className="mt-6 inline-block text-[15px] font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:decoration-ink"
                >
                  {t("news.readMore")}
                </a>
              </div>
            </article>
          )}

          {/* Ostale vesti */}
          {rest.length > 0 && (
            <div className="mt-16 grid gap-x-8 gap-y-12 border-t border-line pt-16 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((item) => (
                <article key={item.slug}>
                  <a href={hrefOf(item)} onClick={go(hrefOf(item))} tabIndex={-1} aria-hidden="true" className="block">
                    <NewsImage src={item.image} theme={item.theme} alt="" className="aspect-[16/10] w-full rounded-2xl" />
                  </a>
                  <div className="mt-5">
                    <Meta item={item} />
                    <h3 className="mt-2 text-xl font-semibold leading-snug text-ink">
                      <a href={hrefOf(item)} onClick={go(hrefOf(item))} className="hover:underline hover:decoration-brand hover:decoration-2 hover:underline-offset-4">
                        {tr(item.title)}
                      </a>
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{tr(item.excerpt)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
