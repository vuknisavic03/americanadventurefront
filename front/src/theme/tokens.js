// Brend tokeni za JS pristup (inline stilovi, canvas, grafici, štampani dokumenti).
// Iste vrednosti žive kao tokeni teme u src/index.css (@theme) — držati sinhrono.
// U komponentama koristiti klase (bg-brand, text-ink…), a ovo samo gde klase ne mogu.

export const colors = {
  yellow: "#FDD503", // brend žuta — glavna akcija, akcenat
  ink: "#231f20", // brend tamna — tekst, logo, tamne površine
  ink2: "#5a5657", // sekundarni tekst
  ink3: "#757273", // prigušen tekst
  surface: "#f7f6f5",
  line: "rgba(35, 31, 32, 0.1)",
};

export const font = {
  family: '"Archivo Variable", Archivo, system-ui, sans-serif',
};

const tokens = { colors, font };
export default tokens;
