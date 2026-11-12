import { useTranslation } from "../i18n/LanguageContext";
import { Container } from "./ui";

/**
 * About — „O nama" na početnoj: naslov levo, tekst desno, slogan brenda u žutom markeru.
 * Sav tekst kroz prevod (about.*).
 */
export default function About({ id = "o-nama" }) {
  const { t } = useTranslation();

  return (
    <section id={id} className="bg-white py-20 sm:py-28">
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-16">
        <h2 className="font-display text-3xl font-bold leading-[1.08] text-ink sm:text-4xl lg:col-span-4">
          {t("about.title")}
        </h2>
        <div className="lg:col-span-8">
          <p className="text-xl leading-relaxed text-ink sm:text-2xl sm:leading-relaxed">{t("about.body")}</p>
          <p className="mt-8 text-lg leading-loose text-ink-2">
            <span className="marker font-semibold">{t("about.slogan")}</span> {t("about.outro")}
          </p>
        </div>
      </Container>
    </section>
  );
}
