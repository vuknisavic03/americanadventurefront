// LanguageContext.jsx
// Globalni jezik + prevod (t) za ceo sajt. Bez spoljnih biblioteka.
//
// Postavljanje (jednom, u main.jsx):
//   <LanguageProvider><App /></LanguageProvider>
//
// Korišćenje u bilo kojoj komponenti:
//   const { t, lang, setLang } = useTranslation();
//   <h1>{t("home.title")}</h1>
//
// Komponenta radi i BEZ providera (npr. izolovan preview) — tada `t` vraća
// podrazumevani jezik (SR), a `setLang` ne radi ništa.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_LANG, loadLanguage, translations } from "./translations";

const LanguageContext = createContext(null);

// Zameni {placeholder} vrednostima iz `vars`: t("home.subtitle", { cmd: "npm run dev" })
function interpolate(str, vars) {
  if (!vars || typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function translate(lang, key, vars) {
  const dict = translations[lang] || translations[DEFAULT_LANG] || {};
  const fallback = translations[DEFAULT_LANG] || {};
  const value = dict[key] ?? fallback[key] ?? key;
  return interpolate(value, vars);
}

export function LanguageProvider({ children, initialLang = DEFAULT_LANG }) {
  const [lang, setLangState] = useState(initialLang);

  // Rečnik jezika se učitava na zahtev, pa tek onda menjamo jezik (bez treptaja ključeva).
  const setLang = useCallback(async (code) => {
    const dict = await loadLanguage(code);
    if (dict) setLangState(code);
  }, []);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  // Fallback bez providera.
  return {
    lang: DEFAULT_LANG,
    setLang: () => {},
    t: (key, vars) => translate(DEFAULT_LANG, key, vars),
  };
}
