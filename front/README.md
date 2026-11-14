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
front/
├── index.html
├── vite.config.js            # Vite + React + Tailwind v4 plugin, /api proxy ka backendu
├── public/
│   ├── documents/            # ugovori, uplatnice i uputstva koje portal nudi za preuzimanje
│   └── videos/               # hero.mp4 (1600×900), hero-mobile.mp4 (960×540), hero-poster.jpg
└── src/
    ├── main.jsx              # React entry
    ├── App.jsx               # rutiranje (History API), sesija, lazy učitavanje stranica
    ├── config.js             # DEMO_MODE (VITE_DEMO_MODE=false za produkciju)
    ├── index.css             # dizajn sistem: @theme tokeni, font, bazni stilovi
    ├── theme/tokens.js       # isti tokeni za JS (štampani dokumenti, canvas)
    ├── i18n/                 # LanguageContext + locales/ (SR u paketu, ostali na zahtev)
    ├── data/                 # navigacija, programi, poslovi, candidateStore (API + lokalni keš)
    └── components/
        ├── ui/               # zajednički primitivi: Button, Container, SectionHeading, Badge, ikonice
        ├── dashboard/        # portal kandidata: DashboardHeader, Step0–3, ui.jsx (StepShell, Panel, Field…)
        ├── register/         # aktivacija naloga u 4 koraka
        ├── admin/            # admin portal: sekcije, modali, ui.jsx (PageHeader, Card, Modal…)
        └── *.jsx             # javne stranice (Hero, ProgramsPage, Discounts, News, Contact…)
```

> **Stack:** React 19 · Vite 8 · Tailwind v4. Tailwind se učitava preko `@tailwindcss/vite` plugina — nema `tailwind.config.js` ni `postcss.config.js`; tema je u `src/index.css` (`@theme`).

## Konvencije

- **React + Tailwind v4**, utility klase koje čitaju tokene teme. Bez inline boja i bez heks vrednosti u komponentama.
- Ono što se ponavlja živi u primitivima (`components/ui`, `dashboard/ui.jsx`, `admin/ui.jsx`) — pre pisanja novog dugmeta, kartice ili značke proveri da li već postoji.
- Akcije idu preko callback propsa (`onNavigate`, `onSubmit`…); komponente ne zavise od rutera.
- Sav UI tekst je na **srpskom (latinica)**, rečenični stil (bez teksta pisanog velikim slovima).
- Semantički HTML + pristupačnost: vidljiv fokus, `aria-*` gde ima smisla, poštuje se `prefers-reduced-motion`.
- **Bez dodatnih biblioteka** dok se izričito ne odobre.

## Dizajn sistem

Jedan izvor istine je `src/index.css` (`@theme`). Brend boje su nepromenjene: žuta `#FDD503` i ink `#231F20`.

| Namena | Klase |
| --- | --- |
| Brend | `bg-brand` (hover `bg-brand-strong`), `bg-ink`, `text-ink` |
| Tekst | `text-ink` · `text-ink-2` (sekundarni) · `text-ink-3` (prigušen) |
| Površine | `bg-white` · `bg-surface` · `bg-surface-2` |
| Linije | `border-line` · `border-line-strong` |
| Stanja | `emerald` uspeh · `amber` pažnja (izveden iz brend žute) · `red` greška · neutralno za info |
| Naslovi | `font-display` (Archivo, prošireni rez) |

Pravila:

- **Žuto dugme je jedna glavna akcija po ekranu.** Sporedne akcije su `outline` ili `ghost`; tamno (`dark`) za akcije unutar portala.
- **Strukturu nose linije i podloge, ne senke.** Senka je rezervisana za slojeve iznad sadržaja (meni, modal, chat).
- **Hijerarhija u portalima:** strana `bg-surface` → kartica `bg-white` sa `border-line` → pločica `bg-surface`. Bez kartice u kartici sa okvirom.
- **Radijusi:** kontrole `rounded-xl`, kartice `rounded-2xl`, paneli `rounded-3xl`, dugmad i značke `rounded-full`.
- **Font:** Archivo (varijabilni) hostovan lokalno u `src/assets/fonts` — nema zahteva ka Google Fonts.

## Prevod (i18n)

Sav vidljiv tekst ide kroz prevod — **nema tvrdo zakucanih stringova u komponentama**.

- Rečnici: `src/i18n/locales/<jezik>.js` (SR, EN, HR, MK, BS; makedonski latinicom). U početni paket ide samo SR, ostali se učitavaju na zahtev. Novi tekst = ključ u `sr.js` (obavezno) i u ostale jezike.
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

## Veza sa backendom

- Backend se ne nalazi u ovom direktorijumu (`apps/platform`); frontend ga zove preko `/api/*` (Vite proxy lokalno, reverse proxy na hostingu — `netlify.toml` / `vercel.json`).
- Pozivi ka API-ju su u `src/data/candidateStore/*` i `App.jsx` (prijava administratora). Komponente dobijaju podatke kroz props i callback-ove.
- `VITE_DEMO_MODE=false` isključuje demo administratora i prečicu na strani za prijavu — obavezno za produkcioni build.
