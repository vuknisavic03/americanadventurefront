// Brend tokeni za JS pristup (npr. inline stilovi, canvas, grafici).
// Iste vrednosti žive i kao CSS varijable u src/index.css.
// Držati sinhrono — ovo je jedini izvor istine za brend u JS-u.

export const colors = {
  yellow: "#FDD503", // pozadina brenda
  ink: "#231f20", // tamna / tekst / logo
};

export const font = {
  family: "Archivo, system-ui, sans-serif",
};

const tokens = { colors, font };
export default tokens;
