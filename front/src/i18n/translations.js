// translations.js
// Rečnik prevoda — jedan izvor istine za tekstove. Svaki jezik je zaseban fajl u ./locales/.
// Novi tekst: dodaj ključ u locales/sr.js (obavezno) i u ostale jezike (ako fali, pada na SR).
//
// U početni paket ide SAMO podrazumevani jezik; ostali se učitavaju tek kad ih korisnik izabere
// (loadLanguage), pa posetilac ne preuzima četiri rečnika koja ne koristi.
//
// Korišćenje u komponentama:
//   const { t } = useTranslation();
//   <span>{t("nav.programi")}</span>

import sr from "./locales/sr";

export const DEFAULT_LANG = "SR";

// Jezici ponuđeni u interfejsu. Dodaj ovde kod jezika kad prevod bude spreman za objavu.
export const LANGUAGES = [
  { code: "SR", label: "Srpski" },
];

export const translations = { SR: sr };

const loaders = {
  EN: () => import("./locales/en"),
  HR: () => import("./locales/hr"),
  MK: () => import("./locales/mk"),
  BS: () => import("./locales/bs"),
};

/** Učitava rečnik jezika na zahtev. Vraća rečnik ili null ako jezik ne postoji. */
export async function loadLanguage(code) {
  if (translations[code]) return translations[code];
  const load = loaders[code];
  if (!load) return null;
  const mod = await load();
  translations[code] = mod.default;
  return mod.default;
}
