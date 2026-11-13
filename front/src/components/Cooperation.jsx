// Cooperation.jsx
import { useTranslation } from "../i18n/LanguageContext";
import { Button, CheckIcon, Container, PageHeader } from "./ui";

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

const ANCHORS = [
  { href: "#kompanije-usa", label: "Kompanije iz USA" },
  { href: "#brand-ambasadori", label: "Brand ambasadori" },
  { href: "#fransiza", label: "Franšiza" },
  { href: "#univerziteti", label: "Univerziteti" },
];

const EMPLOYER_POINTS = [
  { title: "Visoko motivisani studenti", text: "Tečno govore engleski jezik i poseduju radnu etiku." },
  { title: "Kompletna legalnost", text: "J-1 BridgeUSA vize sponzorisane od strane ovlašćenih State Department partnera." },
  { title: "Podrška tokom sezone", text: "Podrška studentima i poslodavcima tokom cele sezone." },
];

// Brojke su iste kao na početnoj (izvor: workandtravel.rs).
const EMPLOYER_STATS = [
  { value: "8.123", label: "Učesnika do sada" },
  { value: "83", label: "Grada u SAD" },
  { value: "45", label: "Saveznih država" },
  { value: "4 meseca", label: "Dostupnost (maj–oktobar)" },
];

const AMBASSADOR_PERKS = [
  { title: "$100 popusta", text: "na tvoju prijavu ili učešće u programu." },
  { title: "Provizija / bonus", text: "za svakog upisanog kandidata sa tvojim kodom." },
  { title: "Brendirani merch paket", text: "(majica, duks, promo materijal)." },
  { title: "Zvanična preporuka", text: "i sertifikat o marketinškom angažmanu." },
];

const FRANCHISE_POINTS = [
  { title: "Akreditovani ugovori", text: "Ugovori sa američkim sponzorskim organizacijama." },
  { title: "Jedinstveni IS i CRM", text: "Pristup kompletnoj digitalnoj platformi za vođenje kandidata, plaćanja i ugovora." },
  { title: "Marketing i brend", text: "Prepoznatljivo ime, sajt i društvene mreže." },
  { title: "Obuka osoblja", text: "Detaljna edukacija za vizne intervjue, administraciju i klijentski servis." },
];

function PointList({ items }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
            <CheckIcon className="h-3 w-3" strokeWidth={3} />
          </span>
          <span>
            <strong className="font-semibold text-ink">{item.title}:</strong> {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Poziv na akciju preko e-pošte: dugme + vidljiva adresa (da može i da se prepiše).
function MailCta({ email, subject, children, variant = "primary" }) {
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
      <Button size="lg" variant={variant} href={href}>
        {children}
      </Button>
      <a href={href} className="text-[15px] underline underline-offset-4">
        {email}
      </a>
    </div>
  );
}

/**
 * Cooperation — stranica „Saradnja" (Prilog 1B, Sekcija 2): kompanije iz USA,
 * brand ambasadori, franšiza i univerziteti. Svaka celina ima svoj anker.
 */
export default function Cooperation({
  ambassadorEmail = "office@workandtravel.rs",
  companiesEmail = "usa-employers@workandtravel.rs",
  franchiseEmail = "fransiza@workandtravel.rs",
  universities = DEFAULT_UNIVERSITIES,
}) {
  const { t } = useTranslation();
  const sectionCls = "scroll-mt-24 py-16 sm:py-24";
  const gridCls = "grid gap-10 lg:grid-cols-2 lg:gap-16";

  return (
    <div className="bg-white">
      <PageHeader
        title={t("coop.title") || "Saradnja sa American Adventure"}
        lead={
          t("coop.subtitle") ||
          "Gradimo dugoročna partnerstva sa američkim poslodavcima, studentima ambasadorima, preduzetnicima kroz franšizni model i vodećim univerzitetima."
        }
      >
        <nav aria-label="Celine na strani" className="mt-8 flex flex-wrap gap-2">
          {ANCHORS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="rounded-full border-2 border-ink px-4 py-2 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-ink hover:text-brand"
            >
              {a.label}
            </a>
          ))}
        </nav>
      </PageHeader>

      {/* 1. Kompanije iz USA */}
      <section id="kompanije-usa" className={sectionCls}>
        <Container className={gridCls}>
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1] text-ink">Kompanije iz USA</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">
              Da li ste američki poslodavac, hotelski lanac, akva park ili nacionalni park u potrazi za pouzdanom i marljivom
              sezonskom radnom snagom?
            </p>
            <div className="mt-8">
              <PointList items={EMPLOYER_POINTS} />
            </div>
            <MailCta email={companiesEmail} subject="US Employer Inquiry - American Adventure">
              Kontakt za poslodavce
            </MailCta>
          </div>

          <div className="rounded-3xl bg-surface p-7 sm:p-10">
            <h3 className="font-display text-xl font-extrabold text-ink">Zapošljavanje J-1 studenata</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Naši studenti rade kod poslodavaca širom SAD — od obale Atlantika do Pacifika i Aljaske.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8">
              {EMPLOYER_STATS.map((stat) => (
                <div key={stat.label} className="border-t border-line-strong pt-4">
                  <dd className="font-sign text-6xl font-extrabold leading-none text-ink">{stat.value}</dd>
                  <dt className="mt-1 text-sm text-ink-2">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* 2. Brand ambasadori */}
      <section id="brand-ambasadori" className={`${sectionCls} bg-brand text-ink`}>
        <Container className={gridCls}>
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1]">{t("coop.ambTitle") || "Postani Brand Ambasador"}</h2>
            <p className="mt-5 text-lg leading-relaxed">
              {t("coop.ambBody") ||
                "Već si bio na Work and Travel programu i želiš da pomogneš kolegama sa fakulteta da dožive isto? Postani zvanični ambasador American Adventure agencije na svom univerzitetu!"}
            </p>
            <MailCta email={ambassadorEmail} subject="Prijava za Brand Ambasadora" variant="dark">
              {t("coop.ambCta") || "Prijavi se za ambasadora"}
            </MailCta>
          </div>

          <div>
            <p className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
              {t("coop.ambNote") || "Budi deo najuspešnijeg studentskog tima u Srbiji"}
            </p>
            <ul className="mt-8 divide-y divide-ink/20 border-y border-ink/20">
              {AMBASSADOR_PERKS.map((perk) => (
                <li key={perk.title} className="py-4 text-[15px] leading-relaxed">
                  <strong className="font-semibold">{perk.title}</strong> {perk.text}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 3. Franšiza */}
      <section id="fransiza" className={sectionCls}>
        <Container className={gridCls}>
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1] text-ink">Otvori American Adventure kancelariju</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">
              Širimo mrežu i tražimo partnere za otvaranje novih centara u univerzitetskim gradovima Srbije (Novi Sad, Niš,
              Kragujevac, Subotica) i u regionu (Banja Luka, Podgorica, Skoplje, Sarajevo).
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              Ukoliko posedujete preduzetnički duh, iskustvo u radu sa mladima ili turističku agenciju, franšiza American
              Adventure pruža dokazan poslovni model sa brzim povraćajem investicije.
            </p>
            <MailCta email={franchiseEmail} subject="Upit za Franšizu - American Adventure">
              Zatraži franšizni plan
            </MailCta>
          </div>

          <div className="rounded-3xl bg-surface p-7 sm:p-10">
            <h3 className="font-display text-xl font-extrabold text-ink">Franšizni paket American Adventure</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Kompletan operativni i tehnički ekosistem za uspešno poslovanje:
            </p>
            <div className="mt-6">
              <PointList items={FRANCHISE_POINTS} />
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Univerziteti */}
      <section id="univerziteti" className={`${sectionCls} border-t border-line`}>
        <Container className={gridCls}>
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1] text-ink">{t("coop.uniTitle") || "Saradnja sa univerzitetima"}</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">
              {t("coop.uniBody") ||
                "Ponosni smo na zvanične sporazume i saradnju sa visokoškolskim ustanovama u Srbiji, omogućavajući studentima usklađivanje ispitnih rokova sa letnjom praksom u SAD."}
            </p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {universities.map((name) => (
              <li key={name} className="py-4 text-[15px] font-medium leading-snug text-ink">
                {name}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}
