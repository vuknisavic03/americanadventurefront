# American Adventure — Frontend

Sajt i platforma za Work & Travel agenciju. Ovaj repo je **samo frontend** (React + Vite + Tailwind). Backend rade inženjeri; komponente su pisane tako da se lako kače na API.

## Pokretanje (live preview)

```bash
npm install
npm run dev
```

Otvori se `http://localhost:5173` sa hot-reload-om — menjaj komponente i odmah vidiš rezultat sa strane.

Ostale komande:

```bash
npm run build     # produkcioni build u dist/
npm run preview   # lokalni pregled build-a
```

## Struktura

```
americanadventure/
├── index.html              # Archivo font, #root
├── vite.config.js          # Vite + React + Tailwind v4 plugin
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # korenska kompozicija — uklapa Header + sekcije
    ├── index.css           # @import "tailwindcss" + brend tokeni (CSS varijable)
    ├── theme/
    │   └── tokens.js       # brend tokeni za JS pristup
    ├── data/
    │   └── navItems.js     # stavke navigacije (jedan izvor istine)
    └── components/         # svaki UI element = zaseban fajl
        ├── Logo.jsx
        └── Header.jsx
```

> **Stack:** React 19 · Vite 8 · Tailwind v4. Tailwind se učitava preko `@tailwindcss/vite` plugina — nema `tailwind.config.js` ni `postcss.config.js` (sadržaj se detektuje automatski).

## Konvencije

- **React + Tailwind v4**, samo core utility klase (bez custom Tailwind configa).
- **Svaki UI element je zaseban fajl** u `src/components/`.
- Komponente su **samostalne**: props sa default vrednostima (rade i bez backenda), akcije preko callback propsa (`onNavigate`, `onLogin`, ...), bez tvrdo zakucanih zavisnosti ka backendu.
- Sav UI tekst je na **srpskom (latinica)**.
- Semantički HTML + osnovna pristupačnost (aria gde ima smisla).
- **Bez dodatnih biblioteka** dok se izričito ne odobre.

## Brend tokeni

Drže se na jednom mestu:

- CSS (za komponente): `src/index.css` → `--brand-yellow: #FDD503`, `--brand-ink: #231f20`. Koriste se kao `bg-[var(--brand-yellow)]`, `text-[var(--brand-ink)]`.
- JS (za grafike/inline): `src/theme/tokens.js`.
- Font: **Archivo** (učitan u `index.html`).

## Prevod (i18n)

Sav vidljiv tekst ide kroz prevod — **nema tvrdo zakucanih stringova u komponentama**.

- Rečnik: `src/i18n/translations.js` (jezici: EN, SR, HR, MK, BS; makedonski latinicom). Novi tekst = dodaš ključ u svaki jezik.
- Logika: `src/i18n/LanguageContext.jsx` — `LanguageProvider` (postavljen u `main.jsx`) + hook `useTranslation()`.
- U komponenti:

  ```jsx
  import { useTranslation } from "../i18n/LanguageContext";

  function Primer() {
    const { t, lang, setLang } = useTranslation();
    return <h2>{t("home.title")}</h2>;
  }
  ```

- Interpolacija: `t("home.subtitle", { cmd: "npm run dev" })` zameni `{cmd}` u stringu.
- Komponenta radi i bez providera (izolovan preview) — tada `t` vraća SR.
- Promena jezika u `Header`-u je globalna i odmah menja ceo UI.

**Konvencija od sada:** svaka nova komponenta od starta koristi `useTranslation()` za tekst.

## Za backend

- Navigacija ulazi preko `navItems` propsa (default: `src/data/navItems.js`) — može se servirati i sa API-ja.
- Sve akcije idu preko callback propsa: `onNavigate(href, e)`, `onLogin()`, `onRegister()`. Trenutno su placeholder (`console.log`) u `App.jsx` — zameniti pravim routerom/auth-om.
- Komponente ne drže globalni state niti pozivaju API direktno; podaci ulaze kroz props.

## Komponente

### `Logo.jsx`
Brend logo kao inline SVG. Boju nasleđuje preko `currentColor` (radi na žutoj i na tamnoj podlozi), veličina preko `className`.

Props: `className` (default `h-9 w-auto`), `title`.

### `Header.jsx`
Sticky žuti header — vizuelni jezik sajta. Navigacija sa animiranom linijom na hover, auth dugmad, mobilni meni (hamburger → X + padajući panel).

Props: `navItems`, `activeHref`, `onNavigate`, `onLogin`, `onRegister`, `logoHref`.
