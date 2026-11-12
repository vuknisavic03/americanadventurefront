// programItems.js
// Zvanična lista programa prema specifikaciji PRILOG 1B (Sekcija 3 i 4).
// `key` -> prevod (src/i18n/translations.js), `label` -> SR fallback, `href` -> ruta.

const programItems = [
  { key: "prog.swtUsa", label: "Work and Travel USA", href: "/programi?p=work-and-travel", id: "work-and-travel" },
  { key: "prog.internship", label: "Internship & Training Program", href: "/programi?p=internship", id: "internship" },
  { key: "prog.highschool", label: "High School USA", href: "/programi?p=high-school", id: "high-school" },
  { key: "prog.aupair", label: "Au Pair USA", href: "/programi?p=au-pair", id: "au-pair" },
  { key: "prog.h2b", label: "H-2B Program u Americi", href: "/programi?p=h2b", id: "h2b" },
  { key: "prog.australia", label: "Australia Work Program", href: "/programi?p=australia", id: "australia" },
  { key: "prog.avioKarte", label: "Avio Karte", href: "/programi?p=avio-karte", id: "avio-karte" },
  { key: "prog.porez", label: "Povraćaj Poreza iz USA", href: "/programi?p=povracaj-poreza", id: "povracaj-poreza" },
  { key: "prog.vizaServis", label: "Viza Servis – SAD", href: "/programi?p=viza-servis", id: "viza-servis" },
];

export default programItems;
