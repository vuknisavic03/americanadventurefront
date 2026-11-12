// ExperiencesPage.jsx
import { useTranslation } from "../i18n/LanguageContext";
import experiencesData from "../data/experiencesPage";
import { Container, PageHeader } from "./ui";

/**
 * ExperiencesPage — iskustva učesnika (ruta /foto-story).
 * `summary` je sažetak iskustva u trećem licu, ne citat — zato nema navodnika.
 * Ako stavka ima `quote` (doslovna izjava učesnika), prikazuje se pod navodnicima.
 */
export default function ExperiencesPage({ items = experiencesData }) {
  const { t, lang } = useTranslation();
  const tr = (field) => (typeof field === "string" ? field : field?.[lang] || field?.SR || "");

  return (
    <>
      <PageHeader title={t("exp.heading")} lead="Šta su učesnici zapisali o agenciji, mestu i poslodavcu — ukratko." />

      <section className="bg-white py-14 sm:py-20">
        <Container>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <figure key={i} className="flex flex-col rounded-2xl border border-line p-6 sm:p-7">
                <figcaption>
                  <p className="text-base font-semibold text-ink">{item.name}</p>
                  <p className="mt-0.5 text-sm text-ink-3">{[item.employer, item.place].filter(Boolean).join(" · ")}</p>
                </figcaption>
                {item.quote ? (
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">„{tr(item.quote)}“</blockquote>
                ) : (
                  <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-2">{tr(item.summary)}</p>
                )}
                <p className="mt-5 border-t border-line pt-4 text-[13px] text-ink-3">{item.program}</p>
              </figure>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
