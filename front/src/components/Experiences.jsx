import { useTranslation } from "../i18n/LanguageContext";
import testimonialsData from "../data/testimonials";
import { Container, SectionHeading } from "./ui";

function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Experiences — iskustva studenata na početnoj.
 * Svaka priča: ko, gde je radio, pa utisci po aspektima (agencija / lokacija / poslodavac).
 * Labele kroz prevod (exp.*); priče iz `testimonials` propsa (default: src/data/testimonials.js).
 */
export default function Experiences({ id = "iskustva", testimonials = testimonialsData }) {
  const { t, lang } = useTranslation();
  const localize = (text) => (typeof text === "string" ? text : text[lang] || text.SR);

  return (
    <section id={id} className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading title={t("exp.heading")} lead={t("exp.subtitle")} />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article key={`${item.name}-${item.employer}`} className="flex flex-col rounded-2xl border border-line p-6 sm:p-7">
              <header className="flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink"
                  aria-hidden="true"
                >
                  {initialsOf(item.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-ink">{item.name}</h3>
                  <p className="truncate text-sm text-ink-3">
                    {item.employer}, {item.place}
                  </p>
                </div>
              </header>

              <dl className="mt-6 space-y-4 border-t border-line pt-6">
                {item.aspects.map((aspect) => (
                  <div key={aspect.key}>
                    <dt className="text-[13px] font-medium text-ink-3">{t(aspect.key)}</dt>
                    <dd className="mt-1 text-[15px] leading-relaxed text-ink">{localize(aspect.text)}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
