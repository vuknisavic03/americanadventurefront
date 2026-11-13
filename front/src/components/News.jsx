// News.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import NewsImage from "./NewsImage";
import newsData from "../data/news";
import { Button, Container, PageHeader, SubNav } from "./ui";

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
export default function News({ items = newsData, initialQuery = "", onNavigate = () => {} }) {
  const { t, lang } = useTranslation();
  const tr = (field) => (typeof field === "string" ? field : field[lang] || field.SR);
  const hrefOf = (item) => `/novosti/${item.slug}`;
  const go = (href) => (e) => onNavigate(e, href);

  const [shown, setShown] = useState(12);
  const [cat, setCat] = useState("Sve");
  const cats = ["Sve", ...new Set(items.map((n) => n.category))];
  const [query, setQuery] = useState(initialQuery);
  const norm = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "dj");
  const q = norm(query.trim());
  const matches = (n) => !q || norm(`${tr(n.title)} ${tr(n.excerpt)} ${(n.body?.SR || []).join(" ")}`).includes(q);
  const filtered = items.filter((n) => (cat === "Sve" || n.category === cat) && matches(n));
  const [featured, ...others] = q ? [undefined, ...filtered] : filtered;
  const rest = others.slice(0, shown);

  const Meta = ({ item }) => (
    <p className="flex flex-wrap items-center gap-x-3 text-sm">
      <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-ink">{item.category}</span>
      <time className="font-sign text-[15px] font-semibold text-ink-3">{item.date}</time>
    </p>
  );

  return (
    <>
      <PageHeader crumb="Novosti" title={t("news.heading")} lead={t("news.subtitle")} />
      <SubNav
        label="Rubrike"
        items={cats.map((c) => ({
          key: c,
          label: c,
          active: cat === c,
          onClick: () => {
            setCat(c);
            setShown(12);
          },
        }))}
      />

      <section className="bg-white py-14 sm:py-20">
        <Container>
          {q && (
            <div className="mb-12 flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-5">
              <p className="font-display text-2xl font-extrabold text-ink">
                {filtered.length > 0 ? `${filtered.length} ${filtered.length === 1 ? "tekst" : filtered.length < 5 ? "teksta" : "tekstova"} za „${query.trim()}“` : `Nema tekstova za „${query.trim()}“`}
              </p>
              <button type="button" onClick={() => setQuery("")} className="text-[15px] font-semibold text-ink underline decoration-2 decoration-ink/30 underline-offset-[5px] hover:decoration-ink">
                Prikaži sve vesti
              </button>
            </div>
          )}
          {items.length === 0 && <p className="text-base text-ink-2">Trenutno nema objavljenih novosti.</p>}

          {/* Istaknuta vest */}
          {featured && (
            <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
              <a href={hrefOf(featured)} onClick={go(hrefOf(featured))} tabIndex={-1} aria-hidden="true" className="block lg:col-span-7">
                <NewsImage eager src={featured.image} theme={featured.theme} alt="" className="aspect-[16/10] w-full rounded-[1.25rem]" />
              </a>
              <div className="lg:col-span-5">
                <Meta item={featured} />
                <h2 className="font-display mt-5 text-[clamp(2rem,3.6vw,2.9rem)] font-extrabold leading-[1] text-ink">
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
            <div className={featured ? "mt-20 grid gap-x-8 gap-y-14 border-t-2 border-ink pt-14 md:grid-cols-2 lg:grid-cols-3" : "grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3"}>
              {rest.map((item) => (
                <article key={item.slug}>
                  <a href={hrefOf(item)} onClick={go(hrefOf(item))} tabIndex={-1} aria-hidden="true" className="block">
                    <NewsImage src={item.image} theme={item.theme} alt="" className="aspect-[16/10] w-full rounded-[1.25rem]" />
                  </a>
                  <div className="mt-5">
                    <Meta item={item} />
                    <h3 className="font-display mt-3 text-[1.35rem] font-extrabold leading-[1.12] text-ink">
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

          {others.length > shown && (
            <div className="mt-14 flex justify-center">
              <Button variant="dark" size="lg" onClick={() => setShown((n) => n + 12)}>
                Prikaži još ({others.length - shown})
              </Button>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
