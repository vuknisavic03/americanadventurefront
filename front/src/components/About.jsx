// About.jsx
import { useTranslation } from "../i18n/LanguageContext";

/**
 * About — „O nama" sekcija na početnoj.
 *
 * Editorijalni raspored: levo blok sa naslovom i sloganom, desno opisni tekst.
 * Cilj je da deluje ozbiljno i utemeljeno (agencija sa tradicijom).
 * Sav tekst kroz prevod (about.* u translations.js).
 *
 * Props:
 *  - id: string (default "o-nama") — anchor za navigaciju.
 *
 * Gde se ubacuje: u <main>, posle Hero sekcije (vidi App.jsx).
 */
export default function About({ id = "o-nama" }) {
  const { t } = useTranslation();

  return (
    <section id={id} className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Levo — naslov + slogan */}
          <div className="lg:col-span-5">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
              {t("about.kicker")}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-[var(--brand-ink)] sm:text-4xl lg:text-5xl">
              {t("about.title")}
            </h2>
            <span className="mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />

            <p className="mt-8 text-2xl font-extrabold uppercase leading-tight tracking-tight text-[var(--brand-ink)] sm:text-3xl">
              <span className="box-decoration-clone bg-[var(--brand-yellow)] px-2 py-1">
                {t("about.slogan")}
              </span>
            </p>
            <p className="mt-4 max-w-sm text-sm text-[var(--brand-ink)]/60 sm:text-base">
              {t("about.outro")}
            </p>
          </div>

          {/* Desno — opisni tekst */}
          <div className="lg:col-span-7">
            <p className="text-lg leading-relaxed text-[var(--brand-ink)]/80 sm:text-xl sm:leading-relaxed">
              {t("about.body")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
