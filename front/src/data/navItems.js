// navItems.js
// Glavna navigacija — usklađena sa zvaničnom specifikacijom PRILOG 1B (Sekcija 2).
// `key` -> prevod (vidi src/i18n/translations.js). `label` je SR fallback.
import programItems from "./programItems";

export const cooperationItems = [
  { key: "coop.kompanijeNav", label: "Kompanije iz USA", href: "/saradnja#kompanije-usa" },
  { key: "coop.ambasadoriNav", label: "Brand ambasadori", href: "/saradnja#brand-ambasadori" },
  { key: "coop.fransizaNav", label: "Franšiza", href: "/saradnja#fransiza" },
];

const navItems = [
  { key: "nav.programi", label: "Programi", href: "/programi", children: programItems },
  { key: "nav.akcije", label: "Akcije", href: "/akcije" },
  { key: "nav.novosti", label: "Novosti", href: "/novosti" },
  { key: "nav.saradnja", label: "Saradnja", href: "/saradnja", children: cooperationItems },
  { key: "nav.iskustva", label: "Iskustva", href: "/iskustva" },
  { key: "nav.kontakt", label: "Kontakt", href: "/kontakt" },
];

export default navItems;
