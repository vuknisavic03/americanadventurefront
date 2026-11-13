// Discounts.jsx
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";
import { discountGroups as defaultGroups, earlyReasons as defaultReasons, VISA_GUARANTEE } from "../data/discounts";
import { Badge, BlockTitle, Button, CheckIcon, Container, PageHeader } from "./ui";
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
      <PageHeader crumb="Akcije" title={t("disc.title")} lead={t("disc.subtitle")} />

      {/* Garancija — važi za sve, nije deo izbora popusta */}
      <section className="bg-white pt-14 sm:pt-20">
        <Container>
          <div className="flex flex-col gap-5 rounded-3xl bg-ink p-7 text-white sm:flex-row sm:items-center sm:gap-8 sm:p-10">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
              <CheckIcon className="h-7 w-7" strokeWidth={3} />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-brand">Garancija za sve kandidate</p>
              <h2 className="font-display mt-1 text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-tight">{VISA_GUARANTEE.title}</h2>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-white/75">{VISA_GUARANTEE.text} Garancija se ne računa kao popust i važi uz bilo koju izabranu pogodnost.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Grupe popusta */}
      <section className="bg-white py-16 sm:py-24">
        <Container className="space-y-20">
          {groups.map((group) => (
            <div key={group.program}>
              <BlockTitle>{group.program}</BlockTitle>

              {group.notice && (
                <p className="mt-5 max-w-3xl border-l-4 border-brand pl-5 text-[15px] leading-relaxed text-ink-2">{group.notice}</p>
              )}

              <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <article key={item.title} className="flex flex-col border-t-2 border-ink pt-5">
                    {item.timing && (
                      <Badge tone={item.timing === "immediate" ? "brand" : "neutral"} className="self-start">
                        {item.timingLabel || (item.timing === "immediate" ? "Odmah" : "Na kraju")}
                      </Badge>
                    )}
                    <h3 className="font-display mt-4 text-[1.45rem] font-extrabold leading-[1.08] text-ink">{item.title}</h3>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-2">{item.text}</p>
                    {item.conditionText && <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-sm text-ink">Uslov: {item.conditionText}</p>}
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
          <BlockTitle className="max-w-2xl">{t("disc.reasonsTitle")}</BlockTitle>
          <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason, i) => (
              <li key={reason} className="border-t-2 border-ink pt-4">
                <span className="font-sign text-5xl font-extrabold leading-none text-ink">{i + 1}</span>
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
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1] text-white">{t("disc.clubTitle")}</h2>
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
