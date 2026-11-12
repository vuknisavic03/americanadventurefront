// ExperiencesPage.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import experiencesData from "../data/experiencesPage";
import { Button, Container, PageHeader, cx } from "./ui";

const RATING_TONE = {
  Pozitivno: "bg-emerald-100 text-emerald-800",
  Neutralno: "bg-surface-2 text-ink-2",
  Negativno: "bg-red-100 text-red-700",
};

function Rating({ label, value }) {
  if (!value) return null;
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", RATING_TONE[value] || RATING_TONE.Neutralno)}>
      {label}: {value.toLowerCase()}
    </span>
  );
}

/**
 * ExperiencesPage — iskustva učesnika (ruta /foto-story).
 * Izjave su doslovne (src/data/experiencesPage.js), zajedno sa ocenama koje su učesnici sami dali.
 */
export default function ExperiencesPage({ items = experiencesData }) {
  const { t, lang } = useTranslation();
  const tr = (field) => (typeof field === "string" ? field : field?.[lang] || field?.SR || "");
  const [shown, setShown] = useState(12);

  return (
    <>
      <PageHeader title={t("exp.heading")} lead={t("exp.subtitle")} />

      <section className="bg-white py-14 sm:py-20">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            {items.slice(0, shown).map((item) => {
              const facts = [
                item.wage && `Satnica: ${item.wage}`,
                item.hours && `Sati nedeljno: ${item.hours}`,
                item.tips && `Napojnice: ${item.tips}`,
              ].filter(Boolean);
              return (
                <figure key={item.slug} className="flex flex-col rounded-2xl border border-line p-6 sm:p-7">
                  <figcaption className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div>
                      <p className="text-base font-semibold text-ink">{item.name}</p>
                      <p className="mt-0.5 text-sm text-ink-3">{[item.place, item.year].filter(Boolean).join(" · ")}</p>
                    </div>
                    <Rating label="Agencija" value={item.agencyRating} />
                  </figcaption>

                  {item.quote && <blockquote className="mt-5 text-[17px] leading-relaxed text-ink">„{tr(item.quote)}“</blockquote>}

                  {(item.job || item.employerNote || item.extraJob) && (
                    <details className="group mt-5 border-t border-line pt-4">
                      <summary className="cursor-pointer list-none text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Posao, mesto i poslodavac</span>
                        <span className="hidden group-open:inline">Sakrij detalje</span>
                      </summary>
                      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-2">
                        {item.job && (
                          <p>
                            <span className="font-medium text-ink">Posao: </span>
                            {tr(item.job)}
                          </p>
                        )}
                        {facts.length > 0 && <p className="text-sm text-ink-3">{facts.join(" · ")}</p>}
                        {item.employerNote && (
                          <div>
                            <Rating label="Poslodavac" value={item.employerRating} />
                            <p className="mt-2">„{tr(item.employerNote)}“</p>
                          </div>
                        )}
                        {item.extraJob && (
                          <div>
                            <Rating label="Dodatni posao" value={item.extraJobRating} />
                            <p className="mt-2">„{tr(item.extraJob)}“</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </figure>
              );
            })}
          </div>

          {items.length > shown && (
            <div className="mt-12 flex justify-center">
              <Button variant="outline" onClick={() => setShown((n) => n + 12)}>
                Prikaži još ({items.length - shown})
              </Button>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
