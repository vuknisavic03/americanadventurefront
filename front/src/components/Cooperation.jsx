// Cooperation.jsx
import { useTranslation } from "../i18n/LanguageContext";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

function PersonIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="3.2" />
      <path d="M5.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
    </svg>
  );
}

function BriefcaseIcon({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function BuildingIcon({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
    </svg>
  );
}

function GradCapIcon({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 9l10-4 10 4-10 4L2 9z" />
      <path d="M6 11v4c0 1.3 2.7 2.5 6 2.5s6-1.2 6-2.5v-4" />
      <path d="M22 9v5" />
    </svg>
  );
}

const DEFAULT_UNIVERSITIES = [
  "Univerzitet u Beogradu (Ekonomski, FON, Filološki, Pravni, FPN, Arhitektonski)",
  "Univerzitet u Novom Sadu (PMF, FTN, Ekonomski, Filozofski)",
  "Univerzitet u Nišu (Ekonomski, Pravni, Filozofski, Elektronski)",
  "Univerzitet u Kragujevcu (Ekonomski, FILUM, FIN)",
  "Univerzitet Singidunum & Metropolitan u Beogradu",
  "Fakultet za finansije, ekonomiju i administraciju – FEFA",
  "Univerzitet Union Nikola Tesla",
  "Fakultet za inženjerski menadžment i poslovno pravo",
];

export default function Cooperation({
  ambassadorEmail = "office@workandtravel.rs",
  companiesEmail = "usa-employers@workandtravel.rs",
  franchiseEmail = "fransiza@workandtravel.rs",
  universities = DEFAULT_UNIVERSITIES,
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Zaglavlje stranice */}
      <section className="border-b border-black/10 bg-black/[0.02] pt-16 pb-14 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
            {t("coop.kicker") || "Partnerstvo i razvoj"}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl lg:text-6xl">
            {t("coop.title") || "Saradnja sa American Adventure"}
          </h1>
          <span className="mx-auto mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--brand-ink)]/70 sm:text-lg">
            {t("coop.subtitle") ||
              "Gradimo dugoročna partnerstva sa američkim poslodavcima, studentima ambasadorima, preduzetnicima kroz franšizni model i vodećim univerzitetima."}
          </p>

          {/* Brzi anker linkovi (Prilog 1B, Sekcija 2) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#kompanije-usa"
              className="rounded-full border border-black/15 bg-white px-5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/5"
            >
              Kompanije iz USA
            </a>
            <a
              href="#brand-ambasadori"
              className="rounded-full border border-black/15 bg-white px-5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/5"
            >
              Brand ambasadori
            </a>
            <a
              href="#fransiza"
              className="rounded-full border border-black/15 bg-white px-5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/5"
            >
              Franšiza
            </a>
            <a
              href="#univerziteti"
              className="rounded-full border border-black/15 bg-white px-5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/5"
            >
              Univerziteti
            </a>
          </div>
        </div>
      </section>

      {/* 1. CELINA: KOMPANIJE IZ USA (Prilog 1B, Sekcija 2) */}
      <section id="kompanije-usa" className="scroll-mt-24 border-b border-black/10 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                <BriefcaseIcon className="h-4 w-4" />
                <span>U.S. Employers &amp; Sponsors</span>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                Kompanije iz USA
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--brand-ink)]/75">
                Da li ste američki poslodavac, hotelski lanac, akva park ili nacionalni park u potrazi za pouzdanom i marljivom sezonskom radnom snagom?
              </p>
              <div className="mt-6 space-y-3 text-sm text-[var(--brand-ink)]/80">
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-yellow)] font-bold text-xs text-[var(--brand-ink)]">✓</span>
                  <span><strong>Visoko motivisani studenti:</strong> Tečno govore engleski jezik i poseduju radnu etiku.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-yellow)] font-bold text-xs text-[var(--brand-ink)]">✓</span>
                  <span><strong>Kompletna legalnost:</strong> J-1 BridgeUSA vize sponzorisane od strane ovlašćenih State Department partnera.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-yellow)] font-bold text-xs text-[var(--brand-ink)]">✓</span>
                  <span><strong>Podrška tokom sezone:</strong> Stalna asistencija studentima i poslodavcima 24/7.</span>
                </div>
              </div>
              <div className="mt-8">
                <a
                  href={`mailto:${companiesEmail}?subject=US%20Employer%20Inquiry%20-%20American%20Adventure`}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-[var(--brand-ink)]"
                  style={{ backgroundColor: BRAND_YELLOW }}
                >
                  <span>Kontakt za poslodavce ({companiesEmail})</span>
                  <span>→</span>
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-8 sm:p-10">
              <h3 className="text-xl font-extrabold text-[var(--brand-ink)]">Zapošljavanje J-1 studenata</h3>
              <p className="mt-2 text-xs text-[var(--brand-ink)]/65">
                Naša agencija uspešno sarađuje sa preko 200 poslodavaca širom SAD — od obale Atlantika do Pacifika i Aljaske.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
                  <p className="text-2xl font-black text-[var(--brand-ink)]">15.000+</p>
                  <p className="mt-1 text-[0.7rem] font-bold uppercase text-[var(--brand-ink)]/50">Plasiranih studenata</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
                  <p className="text-2xl font-black text-[var(--brand-ink)]">99.2%</p>
                  <p className="mt-1 text-[0.7rem] font-bold uppercase text-[var(--brand-ink)]/50">Stopa uspeha na poslu</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
                  <p className="text-2xl font-black text-[var(--brand-ink)]">4 Meseca</p>
                  <p className="mt-1 text-[0.7rem] font-bold uppercase text-[var(--brand-ink)]/50">Dostupnost (Jun–Okt)</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
                  <p className="text-2xl font-black text-[var(--brand-ink)]">24/7</p>
                  <p className="mt-1 text-[0.7rem] font-bold uppercase text-[var(--brand-ink)]/50">Podrška sponzora</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CELINA: BRAND AMBASADORI (Prilog 1B, Sekcija 2) */}
      <section id="brand-ambasadori" className="scroll-mt-24 py-16 sm:py-20" style={{ backgroundColor: BRAND_YELLOW, color: INK }}>
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-ink)]/60">
                Studentski program
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t("coop.ambTitle") || "Postani Brand Ambasador"}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--brand-ink)]/85 sm:text-lg">
                {t("coop.ambBody") ||
                  "Već si bio na Work and Travel programu i želiš da pomogneš kolegama sa fakulteta da dožive isto? Postani zvanični ambasador American Adventure agencije na svom univerzitetu!"}
              </p>
              <div className="mt-6 space-y-2 text-sm text-[var(--brand-ink)]/90">
                <p>• <strong>$100 popusta</strong> na tvoju prijavu ili učešće u programu.</p>
                <p>• <strong>Provizija / bonus</strong> za svakog upisanog kandidata sa tvojim kodom.</p>
                <p>• <strong>Brendirani merch paket</strong> (majica, duks, promo materijal).</p>
                <p>• <strong>Zvanična preporuka</strong> i sertifikat o marketinškom angažmanu.</p>
              </div>
              <a
                href={`mailto:${ambassadorEmail}?subject=Prijava%20za%20Brand%20Ambasadora`}
                className="mt-8 inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-[var(--brand-yellow)] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                style={{ backgroundColor: INK }}
              >
                <span className="text-sm font-bold uppercase tracking-[0.08em]">{t("coop.ambCta") || "Prijavi se za ambasadora"}</span>
                <span className="text-sm font-medium text-white/70">({ambassadorEmail})</span>
              </a>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-3xl p-10 text-center shadow-2xl" style={{ backgroundColor: INK }}>
                <div className="flex justify-center -space-x-4">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="flex h-14 w-14 items-center justify-center rounded-full border-4"
                      style={{ backgroundColor: BRAND_YELLOW, color: INK, borderColor: INK }}
                    >
                      <PersonIcon className="h-6 w-6" />
                    </span>
                  ))}
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full border-4 text-lg font-extrabold"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)", color: BRAND_YELLOW, borderColor: INK }}
                  >
                    +
                  </span>
                </div>
                <p className="mt-8 text-xl font-extrabold leading-snug text-white">
                  {t("coop.ambNote") || "Budi deo najuspešnijeg studentskog tima u Srbiji"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CELINA: FRANŠIZA (Prilog 1B, Sekcija 2) */}
      <section id="fransiza" className="scroll-mt-24 border-b border-black/10 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-8 sm:p-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: BRAND_YELLOW, color: INK }}>
                <BuildingIcon className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold text-[var(--brand-ink)]">
                Franšizni paket American Adventure
              </h3>
              <p className="mt-3 text-sm text-[var(--brand-ink)]/70">
                Pružamo kompletan operativni i tehnički ekosistem za uspešno poslovanje:
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--brand-ink)]/80">
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-[var(--brand-ink)]">✓</span>
                  <span><strong>Akreditovani ugovori:</strong> Direktna partnerstva sa vodećim američkim sponzorima (Intrax, CCUSA, itd.).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-[var(--brand-ink)]">✓</span>
                  <span><strong>Jedinstveni IS &amp; CRM:</strong> Pristup kompletnoj digitalnoj platformi za vođenje kandidata, plaćanja i ugovora.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-[var(--brand-ink)]">✓</span>
                  <span><strong>Marketing i brend:</strong> Prepoznatljivo ime sa preko 15 godina tradicije, SEO i društvene mreže.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-[var(--brand-ink)]">✓</span>
                  <span><strong>Obuka osoblja:</strong> Detaljna edukacija za vizne intervjue, administraciju i klijentski servis.</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                <span>Poslovno partnerstvo</span>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
                Otvori American Adventure kancelariju
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--brand-ink)]/75">
                Širimo mrežu i tražimo partnere za otvaranje novih centara u univerzitetskim gradovima Srbije (Novi Sad, Niš, Kragujevac, Subotica) i u regionu (Banja Luka, Podgorica, Skoplje, Sarajevo).
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--brand-ink)]/65">
                Ukoliko posedujete preduzetnički duh, iskustvo u radu sa mladima ili turističku agenciju, franšiza American Adventure pruža dokazan poslovni model sa brzim povraćajem investicije.
              </p>
              <div className="mt-8">
                <a
                  href={`mailto:${franchiseEmail}?subject=Upit%20za%20Franšizu%20-%20American%20Adventure`}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-[var(--brand-ink)]"
                  style={{ backgroundColor: BRAND_YELLOW }}
                >
                  <span>Zatraži franšizni plan ({franchiseEmail})</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CELINA: UNIVERZITETI */}
      <section id="univerziteti" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center sm:px-10">
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: BRAND_YELLOW, color: INK }}
          >
            <GradCapIcon className="h-9 w-9" />
          </span>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl lg:text-4xl">
            {t("coop.uniTitle") || "Saradnja sa univerzitetima"}
          </h2>
          <span className="mx-auto mt-5 block h-1 w-12 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mt-7 text-base leading-relaxed text-[var(--brand-ink)]/75 sm:text-lg sm:leading-relaxed">
            {t("coop.uniBody") ||
              "Ponosni smo na zvanične sporazume i saradnju sa visokoškolskim ustanovama u Srbiji, omogućavajući studentima usklađivanje ispitnih rokova sa letnjom praksom u SAD."}
          </p>

          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {universities.map((name) => (
              <li
                key={name}
                className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3.5 shadow-xs"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
                <span className="text-sm font-semibold leading-snug text-[var(--brand-ink)]">{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
