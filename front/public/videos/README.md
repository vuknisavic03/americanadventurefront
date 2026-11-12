# Hero video

Ovde ide video za pozadinu Hero sekcije.

- **`hero.mp4`** — glavni video (obavezno). Komponenta `Hero.jsx` ga čita sa `/videos/hero.mp4`.
- **`hero-poster.jpg`** — slika koja se prikazuje dok se video učitava (preporučeno).

Saveti:

- Format: MP4 (H.264) radi u svim browserima. Po želji dodaj i `hero.webm` za manju veličinu.
- Trajanje: 8–20s, bešavni loop (kraj se nastavlja na početak).
- Rezolucija: 1920×1080 je dovoljno; kompresuj da fajl bude ispod ~5–8 MB radi brzog učitavanja.
- Bez zvuka (svejedno se reprodukuje muted) — izbaci audio traku da fajl bude manji.

Dok fajl ne postoji, Hero prikazuje tamnu brend podlogu, pa preview radi i bez videa.
