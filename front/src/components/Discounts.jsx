// Discounts.jsx
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";
import { discountGroups as defaultGroups, earlyReasons as defaultReasons } from "../data/discounts";
import { Badge, Button, Container, PageHeader } from "./ui";
import CtaBand from "./CtaBand";

/**
 * Discounts — stranica „Akcije i popusti".
 *
 * Grupe popusta po programima, razlozi za raniju prijavu, American Adventure Club i poziv na prijavu.
 * Strukturne labele kroz prevod (disc.*); sadržaj popusta ulazi preko propsa (podaci).
 *
 * Props:
 *  - groups / reasons: podaci (default: src/data/discounts.js)
 *  - onRegister: () => void — poziv na online prijavu
 *  - onNavigate: (event, href) => void
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
      <PageHeader title={t("disc.title")} lead={t("disc.subtitle")} />

      {/* Grupe popusta */}
      <section className="bg-white py-14 sm:py-20">
        <Container className="space-y-16">
          {groups.map((group) => (
            <div key={group.program}>
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">{group.program}</h2>

              {group.notice && (
                <p className="mt-5 max-w-3xl rounded-xl bg-brand-soft px-5 py-4 text-sm leading-relaxed text-ink">
                  <strong className="font-semibold">Važna napomena:</strong> {group.notice}
                </p>
              )}

              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <article key={item.title} className="flex flex-col rounded-2xl border border-line p-6">
                    {item.timing && (
                      <Badge tone={item.timing === "immediate" ? "success" : "neutral"} className="mb-4 self-start">
                        {item.timingLabel || (item.timing === "immediate" ? "Odmah" : "Na kraju")}
                      </Badge>
                    )}
                    <h3 className="text-lg font-semibold leading-snug text-ink">{item.title}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-2">{item.text}</p>
                    {item.conditionText && (
                      <p className="mt-5 border-t border-line pt-4 text-sm text-ink-2">
                        <span className="text-ink-3">Uslov:</span> {item.conditionText}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* Razlozi za raniju prijavu */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <h2 className="font-display max-w-2xl text-3xl font-bold text-ink sm:text-4xl">{t("disc.reasonsTitle")}</h2>
          <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason, i) => (
              <li key={reason} className="border-t-2 border-ink pt-4">
                <span className="font-display text-2xl font-bold tabular-nums text-ink">{i + 1}</span>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{reason}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* American Adventure Club */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 rounded-3xl bg-ink px-7 py-12 sm:px-12 sm:py-16 lg:grid-cols-2 lg:px-16">
            {/* Članska kartica */}
            <div className="flex justify-center lg:justify-start">
              <div className="flex aspect-[1.586/1] w-full max-w-sm -rotate-3 flex-col justify-between rounded-2xl bg-brand p-6 text-ink shadow-2xl">
                <div className="flex items-start justify-between">
                  <Logo className="h-9 w-auto" />
                  <span className="text-sm font-medium">Club</span>
                </div>
                <div>
                  <p className="text-[13px] opacity-70">Member</p>
                  <p className="font-display text-lg font-bold leading-tight">American Adventure Club</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t("disc.clubTitle")}</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{t("disc.clubBody")}</p>
              <Button size="lg" className="mt-8" href="/kontakt" onClick={go("/kontakt")}>
                {t("hero.ctaSecondary")}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Poziv na prijavu */}
      <CtaBand onNavigate={onNavigate} />
    </>
  );
}
