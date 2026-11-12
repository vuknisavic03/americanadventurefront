import { useTranslation } from "../i18n/LanguageContext";
import { Container } from "./ui";

const STATS = [
  { value: 8123, key: "stats.users" },
  { value: 83, key: "stats.cities" },
  { value: 45, key: "stats.states" },
];

const formatNumber = (n) => n.toLocaleString("sr-Latn-RS");

/**
 * Stats — agencija u brojkama. Jedina žuta traka na početnoj: brend boja nosi
 * poruku, brojke su u naslovnom rezu. Bez animacije — brojevi su tu odmah.
 */
export default function Stats() {
  const { t } = useTranslation();

  return (
    <section className="bg-brand py-16 text-ink sm:py-20">
      <Container>
        <h2 className="max-w-xl text-lg font-medium leading-snug sm:text-xl">{t("stats.subtitle")}</h2>
        <dl className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {STATS.map((stat) => (
            <div key={stat.key} className="border-t-2 border-ink pt-5">
              <dd className="font-display text-6xl font-bold leading-none tabular-nums lg:text-7xl">{formatNumber(stat.value)}</dd>
              <dt className="mt-3 text-base font-medium">{t(stat.key)}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
