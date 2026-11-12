// Hero.jsx
import { useTranslation } from "../i18n/LanguageContext";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

/**
 * Hero — uvodna sekcija sa video pozadinom koja se vrti u petlji.
 *
 * Izgled:
 *  - video preko cele sekcije (object-cover), autoPlay + muted + loop + playsInline,
 *  - blago zamućen (blur) uz mali scale da se ne vide zamućene ivice,
 *  - zatamnjen slojem preko videa radi čitljivosti teksta,
 *  - sadržaj (naslov, podnaslov, CTA) centriran preko videa.
 *
 * VIDEO: ubaci svoj fajl u `public/videos/hero.mp4` (+ poster sliku
 * `public/videos/hero-poster.jpg`). Dok fajla nema, vidi se tamna brend podloga.
 *
 * Sav tekst ide kroz prevod (useTranslation). Akcije preko callback propsa.
 *
 * Props (svi imaju default — radi i bez backenda):
 *  - videoSrc:      putanja do videa (default "/videos/hero.mp4")
 *  - poster:        slika dok se video učitava (default "/videos/hero-poster.jpg")
 *  - primaryHref:   ruta primarnog dugmeta (default "/programi")
 *  - secondaryHref: ruta sekundarnog dugmeta (default "/kontakt")
 *  - onNavigate:    (event, href) => void — klik na CTA (backend kači rute)
 *  - blurPx:        jačina blura u px (default 5) — lako podesi koliko je „malo"
 *  - overlayOpacity: zatamnjenje 0–100 (default 55)
 *
 * Gde se ubacuje: prva sekcija u <main> (vidi App.jsx).
 */
export default function Hero({
  videoSrc = "/videos/hero.mp4",
  poster = "/videos/hero-poster.jpg",
  primaryHref = "/programi",
  secondaryHref = "/kontakt",
  onNavigate = () => {},
  blurPx = 5,
  overlayOpacity = 55,
}) {
  const { t } = useTranslation();

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  return (
    <section
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden"
      style={{ backgroundColor: INK }} // fallback dok video ne učita / ako fajla nema
    >
      {/* Video pozadina */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover"
        style={{ filter: `blur(${blurPx}px)` }}
        src={videoSrc}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Zatamnjenje + suptilni gradijent za dubinu */}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(35,31,32,${overlayOpacity / 100})` }} aria-hidden="true" />
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" aria-hidden="true" />

      {/* Sadržaj */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-28 text-center text-white sm:px-10">
        <p
          className="text-xs font-bold uppercase tracking-[0.28em] sm:text-sm"
          style={{ color: BRAND_YELLOW, fontFamily: "'Archivo', system-ui, sans-serif" }}
        >
          {t("hero.kicker")}
        </p>

        <h1
          className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight drop-shadow-xs sm:text-6xl lg:text-7xl"
          style={{ fontFamily: "'Archivo', system-ui, sans-serif" }}
        >
          {t("hero.title")}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-white/85 sm:text-lg">
          {t("hero.subtitle")}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={primaryHref}
            onClick={go(primaryHref)}
            className="w-full rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-[0.08em] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:w-auto"
            style={{ backgroundColor: BRAND_YELLOW, color: INK }}
          >
            {t("hero.ctaPrimary")}
          </a>
          <a
            href={secondaryHref}
            onClick={go(secondaryHref)}
            className="w-full rounded-full border-2 border-white/80 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 sm:w-auto"
          >
            {t("hero.ctaSecondary")}
          </a>
        </div>
      </div>

      {/* Scroll indikator */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 motion-reduce:hidden">
        <div className="flex flex-col items-center gap-2 text-white/70">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]">{t("hero.scroll")}</span>
          <span className="flex h-9 w-5 items-start justify-center rounded-full border-2 border-white/60 p-1">
            <span className="h-2 w-1 animate-bounce rounded-full bg-white/80" />
          </span>
        </div>
      </div>
    </section>
  );
}
