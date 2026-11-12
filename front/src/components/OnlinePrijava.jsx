// OnlinePrijava.jsx
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";
import programItems from "../data/programItems";
import { submitPreApplicationWithBackend } from "../data/candidateStore";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";
const DEFAULT_BIRTH_DATE = "2005-01-01";
const PUBLIC_UNIVERSITIES = [
  { name: "Univerzitet u Beogradu", city: "Beograd"},
  { name: "Univerzitet u Novom Sadu", city: "Novi Sad" },
  { name: "Univerzitet u Nišu", city: "Niš" },
  { name: "Univerzitet u Kragujevcu", city: "Kragujevac" },
  { name: "Državni univerzitet u Novom Pazaru", city: "Novi Pazar" },
  { name: "Univerzitet u Prištini sa sedištem u Kosovskoj Mitrovici", city: "Kosovska Mitrovica" },
  { name: "Univerzitet umetnosti u Beogradu", city: "Beograd"},
  { name: "Kriminalističko-policijski univerzitet (Beograd)", city: "Beograd" },
  { name: "Univerzitet odbrane u Beogradu", city: "Beograd"},
];
const PRIVATE_UNIVERSITIES = [
  { name: "Univerzitet Singidunum", city: "Beograd" },
  { name: "Univerzitet Megatrend / MB Univerzitet", city: "Beograd" },
  { name: "Univerzitet Metropolitan", city: "Beograd" },
  { name: "Univerzitet Union", city: "Beograd" },
  { name: "Union - Nikola Tesla", city: "Beograd" },
  { name: "Alfa BK Univerzitet", city: "Beograd" },
  { name: "Internacionalni univerzitet u Novom Pazaru", city: "Novi Pazar" },
  { name: "Univerzitet Edukons (Sremska Kamenica)", city: "Sremska Kamenica" },
  { name: "Privredna akademija (Novi Sad)", city: "Novi Sad" },
];

function getLatestAdultBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CheckCircleIcon({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

function ClockIcon({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function BackIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

// Mapiranje zvaničnih destinacija prijava prema specifikaciji PRILOG 1B (Sekcija 4)
const PROGRAM_DESTINATIONS = {
  "work-and-travel": { email: "beograd@workandtravel.rs", label: "Work and Travel USA" },
  "internship": { email: "internship@workandtravel.rs", label: "Internship & Training Program" },
  "high-school": { email: "office.americanadventure@gmail.com", label: "High School USA" },
  "au-pair": { email: "aupair@workandtravel.rs", label: "Au Pair USA" },
  "h2b": { email: "office.americanadventure@gmail.com", label: "H-2B Program u Americi" },
  "australia": { email: "australia@workandtravel.rs", label: "Australia Work Program" },
  "avio-karte": { email: "aviokarte@workandtravel.rs", label: "Avio Karte" },
  "povracaj-poreza": { email: "office.americanadventure@gmail.com", label: "Povraćaj Poreza iz USA" },
  "viza-servis": { email: "office.americanadventure@gmail.com", label: "Viza Servis – SAD" },
};

export default function OnlinePrijava({
  onNavigate = () => {},
  onSubmit = () => {},
  loginHref = "/prijava",
  logoHref = "/",
  initialProgram = "work-and-travel",
}) {
  const { t } = useTranslation();
  const [selectedProgram, setSelectedProgram] = useState(initialProgram || "work-and-travel");
  const [step, setStep] = useState(initialProgram ? "form" : "program");
  const latestAdultBirthDate = getLatestAdultBirthDate();

  // Ažuriraj ako dođe novi prop
  useEffect(() => {
    if (initialProgram) {
      setSelectedProgram(initialProgram);
      setStep("form");
    }
  }, [initialProgram]);

  // Stanje forme sa svim poljima iz Priloga 1B
  const [form, setForm] = useState({
    // Osnovna polja (svi programi)
    firstName: "",
    lastName: "",
    birthDate: DEFAULT_BIRTH_DATE,
    address: "",
    phone: "",
    email: "",
    note: "",

    // Work and Travel polja (Prilog 1B, tačka 4)
    universityName: "",
    studyUniversity: "",
    studyCity: "",
    studyYear: "1",
    repeatedYear: "Ne",
    ectsPoints: "",

    // Internship / H-2B
    fieldOfStudy: "",

    // High School polja
    parentName: "",
    parentAddress: "",
    parentPhone: "",
    parentEmail: "",

    // Au Pair polja
    hasDriversLicense: "Da",

    // Avio karte polja
    ticketType: "Povratna",
    departureCity: "Beograd",
    destinationCity: "",
    departureDate: "",
    returnDate: "",
    passengerType: "Student (J-1)",
  });

  const [privacy, setPrivacy] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  const upd = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  const destInfo = PROGRAM_DESTINATIONS[selectedProgram] || {
    email: "beograd@workandtravel.rs",
    label: selectedProgram,
  };
  const selectedUniversity = [...PUBLIC_UNIVERSITIES, ...PRIVATE_UNIVERSITIES].find(
    (university) => university.name === form.studyUniversity,
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!privacy) return;

    const payload = {
      program: selectedProgram,
      destinationEmail: destInfo.email,
      privacyConsent: privacy,
      newsletterConsent: newsletter,
      ...form,
    };

    await submitPreApplicationWithBackend({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      birthDate: form.birthDate,
      address: form.address,
      faculty: form.studyUniversity
        ? `${form.studyUniversity}${form.universityName ? ` — ${form.universityName}` : ""}`
        : form.universityName || form.fieldOfStudy || destInfo.label,
      studyCity: selectedUniversity?.city || form.studyCity || form.departureCity || "Beograd",
      studyYear: form.studyYear,
      repeatedYear: form.repeatedYear,
      ectsPoints: form.ectsPoints,
      program: destInfo.label,
      message: form.note,
      newsletterConsent: newsletter,
    });

    onSubmit(payload);
    setStep("done");
  };

  const labelCls = "block text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/70";
  const inputCls =
    "mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--brand-ink)] transition-colors duration-150 placeholder:text-black/35 focus:border-[var(--brand-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-ink)]/15";
  const req = <span className="text-red-500 font-bold" aria-hidden="true"> *</span>;

  return (
    <section className="flex min-h-[calc(100vh-6rem)] items-center justify-center bg-[var(--brand-ink)]/[0.03] px-6 py-16 sm:py-20">
      <div className="w-full max-w-2xl">
        <a
          href={logoHref}
          onClick={go(logoHref)}
          aria-label={t("a11y.home")}
          className="mx-auto flex w-fit text-[var(--brand-ink)] transition-opacity duration-200 hover:opacity-80"
        >
          <Logo className="h-12 w-auto" />
        </a>

        {/* Koraci selekcije procesa (Prilog 1A) */}
        {step !== "done" && (
          <ol className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[var(--brand-ink)]/45">
            <span className="flex h-7 items-center whitespace-nowrap rounded-full bg-[var(--brand-ink)] px-3 text-[0.68rem] font-bold text-white">
              1. Online prijava
            </span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-black/20" />
            <span className="flex h-7 items-center whitespace-nowrap rounded-full bg-black/[0.06] px-3 text-[0.68rem] font-bold text-[var(--brand-ink)]/45">
              2. Selekcija
            </span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-black/20" />
            <span className="flex h-7 items-center whitespace-nowrap rounded-full bg-black/[0.06] px-3 text-[0.68rem] font-bold text-[var(--brand-ink)]/45">
              3. Konsultacije
            </span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-black/20" />
            <span className="flex h-7 items-center whitespace-nowrap rounded-full bg-black/[0.06] px-3 text-[0.68rem] font-bold text-[var(--brand-ink)]/45">
              4. Nalog
            </span>
          </ol>
        )}

        <div className="mt-6 rounded-3xl border border-black/10 bg-white p-7 shadow-xs sm:p-10">
          {/* KORAK 1: IZBOR PROGRAMA */}
          {step === "program" && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-ink)]/45">
                Korak 1/2 · Izbor programa
              </p>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
                Izaberite program za prijavu
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-ink)]/65">
                Prijavna forma se automatski prilagođava zahtevima izabranog programa.
              </p>

              <div className="mt-6 space-y-2">
                {programItems.map((p) => {
                  const sel = selectedProgram === (p.id || p.href);
                  return (
                    <button
                      key={p.href}
                      type="button"
                      onClick={() => {
                        setSelectedProgram(p.id || "work-and-travel");
                        setStep("form");
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition-colors duration-150 ${
                        sel
                          ? "border-[var(--brand-ink)] bg-[var(--brand-yellow)]/10 text-[var(--brand-ink)]"
                          : "border-black/10 text-[var(--brand-ink)]/80 hover:bg-black/[0.03]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            sel ? "border-[var(--brand-ink)]" : "border-black/25"
                          }`}
                        >
                          {sel && <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-ink)]" />}
                        </span>
                        <span>{p.label}</span>
                      </span>
                      <span className="text-xs font-normal text-[var(--brand-ink)]/45">
                        {PROGRAM_DESTINATIONS[p.id]?.email}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* KORAK 2: DINAMIČKA PRIJAVNA FORMA PREMA PRILOGU 1B (SEKCIJA 4) */}
          {step === "form" && (
            <>
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <button
                  type="button"
                  onClick={() => setStep("program")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/55 transition-colors hover:text-[var(--brand-ink)]"
                >
                  <BackIcon /> Promeni program
                </button>
                <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-bold text-[var(--brand-ink)]">
                  {destInfo.label}
                </span>
              </div>

              <div className="mt-4">
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
                  Prijavni formular
                </h1>
                <p className="mt-1 text-xs text-[var(--brand-ink)]/55">
                  Podaci iz ove forme se šalju direktno na: <strong className="text-[var(--brand-ink)]">{destInfo.email}</strong>
                </p>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-5">
                {/* 1. OSNOVNI LIČNI PODACI (Obavezni za sve programe) */}
                <div className="rounded-2xl border border-black/5 bg-black/[0.015] p-4 sm:p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                    Osnovni lični podaci
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fn" className={labelCls}>Ime{req}</label>
                      <input id="fn" type="text" required value={form.firstName} onChange={upd("firstName")} className={inputCls} placeholder="npr. Marko" />
                    </div>
                    <div>
                      <label htmlFor="ln" className={labelCls}>Prezime{req}</label>
                      <input id="ln" type="text" required value={form.lastName} onChange={upd("lastName")} className={inputCls} placeholder="npr. Petrović" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="bd" className={labelCls}>Datum rođenja{req}</label>
                      <input id="bd" type="date" required max={latestAdultBirthDate} value={form.birthDate} onChange={upd("birthDate")} className={inputCls} />
                      <p className="mt-1 text-xs text-[var(--brand-ink)]/55">Prijava je moguća samo za punoletne osobe.</p>
                    </div>
                    <div>
                      <label htmlFor="addr" className={labelCls}>Puna adresa stanovanja{req}</label>
                      <input id="addr" type="text" required value={form.address} onChange={upd("address")} className={inputCls} placeholder="Ulica, broj, grad" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ph" className={labelCls}>Telefon{req}</label>
                      <input id="ph" type="tel" required value={form.phone} onChange={upd("phone")} className={inputCls} placeholder="+381 6..." />
                    </div>
                    <div>
                      <label htmlFor="em" className={labelCls}>Email adresa{req}</label>
                      <input id="em" type="email" required value={form.email} onChange={upd("email")} className={inputCls} placeholder="student@example.com" />
                    </div>
                  </div>
                </div>

                {/* 2. SPECIFIČNA POLJA ZA WORK AND TRAVEL (Prilog 1B, tačka 4) */}
                {selectedProgram === "work-and-travel" && (
                  <div className="rounded-2xl border border-black/5 bg-black/[0.015] p-4 sm:p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                      Podaci o studijama (Work and Travel)
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="uni" className={labelCls}>Naziv fakulteta{req}</label>
                        <input id="uni" type="text" required value={form.universityName} onChange={upd("universityName")} className={inputCls} placeholder="npr. Ekonomski fakultet" />
                      </div>
                      <div>
                        <label htmlFor="university" className={labelCls}>Univerzitet{req}</label>
                        <select id="university" required value={form.studyUniversity} onChange={upd("studyUniversity")} className={inputCls}>
                          <option value="">Izaberite univerzitet</option>
                          <optgroup label="Državni univerziteti">
                            {PUBLIC_UNIVERSITIES.map((university) => (
                              <option key={university.name} value={university.name}>
                                {university.name}{university.note ? ` (${university.note})` : ""}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Privatni univerziteti">
                            {PRIVATE_UNIVERSITIES.map((university) => (
                              <option key={university.name} value={university.name}>
                                {university.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="yr" className={labelCls}>Godina studija{req}</label>
                        <select id="yr" value={form.studyYear} onChange={upd("studyYear")} className={inputCls}>
                          <option value="1">1. godina</option>
                          <option value="2">2. godina</option>
                          <option value="3">3. godina</option>
                          <option value="4">4. godina</option>
                          <option value="master">Master studije</option>
                          <option value="apsolvent">Apsolvent</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="rep" className={labelCls}>Obnovljena godina{req}</label>
                        <select id="rep" value={form.repeatedYear} onChange={upd("repeatedYear")} className={inputCls}>
                          <option value="Ne">Ne (prvi put upisana)</option>
                          <option value="Da">Da (obnovljena/pauzirana)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="ects" className={labelCls}>Broj ESP bodova{req}</label>
                        <input id="ects" type="number" required min="0" max="360" value={form.ectsPoints} onChange={upd("ectsPoints")} className={inputCls} placeholder="npr. 120" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SPECIFIČNA POLJA ZA INTERNSHIP / H-2B */}
                {(selectedProgram === "internship" || selectedProgram === "h2b") && (
                  <div className="rounded-2xl border border-black/5 bg-black/[0.015] p-4 sm:p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                      Oblast rada / usavršavanja
                    </h3>
                    <div className="mt-4">
                      <label htmlFor="fos" className={labelCls}>Željena oblast usavršavanja / radnog angažmana{req}</label>
                      <input id="fos" type="text" required value={form.fieldOfStudy} onChange={upd("fieldOfStudy")} className={inputCls} placeholder="npr. Hotelijerstvo / F&B / IT / Finansije" />
                    </div>
                  </div>
                )}

                {/* 4. SPECIFIČNA POLJA ZA HIGH SCHOOL */}
                {selectedProgram === "high-school" && (
                  <div className="rounded-2xl border border-black/5 bg-black/[0.015] p-4 sm:p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                      Podaci o roditeljima (High School Program)
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="pn" className={labelCls}>Ime i prezime roditelja{req}</label>
                        <input id="pn" type="text" required value={form.parentName} onChange={upd("parentName")} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="pa" className={labelCls}>Adresa roditelja{req}</label>
                        <input id="pa" type="text" required value={form.parentAddress} onChange={upd("parentAddress")} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="pp" className={labelCls}>Telefon roditelja{req}</label>
                        <input id="pp" type="tel" required value={form.parentPhone} onChange={upd("parentPhone")} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="pe" className={labelCls}>Email roditelja{req}</label>
                        <input id="pe" type="email" required value={form.parentEmail} onChange={upd("parentEmail")} className={inputCls} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SPECIFIČNA POLJA ZA AU PAIR */}
                {selectedProgram === "au-pair" && (
                  <div className="rounded-2xl border border-black/5 bg-black/[0.015] p-4 sm:p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                      Vozačka dozvola (Au Pair USA)
                    </h3>
                    <div className="mt-4">
                      <label htmlFor="dl" className={labelCls}>Posedovanje važeće vozačke dozvole (B kategorija){req}</label>
                      <select id="dl" value={form.hasDriversLicense} onChange={upd("hasDriversLicense")} className={inputCls}>
                        <option value="Da">Da (aktivan vozač)</option>
                        <option value="Ne">Ne / U toku je obuka</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 6. SPECIFIČNA POLJA ZA AVIO KARTE */}
                {selectedProgram === "avio-karte" && (
                  <div className="rounded-2xl border border-black/5 bg-black/[0.015] p-4 sm:p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                      Detalji leta i karte (Avio karte)
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="tt" className={labelCls}>Vrsta karte{req}</label>
                        <select id="tt" value={form.ticketType} onChange={upd("ticketType")} className={inputCls}>
                          <option value="Povratna">Povratna karta</option>
                          <option value="Jedan pravac">Jedan pravac</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="pt" className={labelCls}>Tip putnika/karte{req}</label>
                        <select id="pt" value={form.passengerType} onChange={upd("passengerType")} className={inputCls}>
                          <option value="Student (J-1)">Student (J-1 viza sa popustom)</option>
                          <option value="Omladinska">Omladinac (do 26 god)</option>
                          <option value="Standardna">Standardna ekonomska</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="dc" className={labelCls}>Grad polaska{req}</label>
                        <input id="dc" type="text" required value={form.departureCity} onChange={upd("departureCity")} className={inputCls} placeholder="npr. Beograd (BEG)" />
                      </div>
                      <div>
                        <label htmlFor="dest" className={labelCls}>Destinacija u SAD / svetu{req}</label>
                        <input id="dest" type="text" required value={form.destinationCity} onChange={upd("destinationCity")} className={inputCls} placeholder="npr. New York (JFK)" />
                      </div>
                      <div>
                        <label htmlFor="dd" className={labelCls}>Datum polaska{req}</label>
                        <input id="dd" type="date" required value={form.departureDate} onChange={upd("departureDate")} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="rd" className={labelCls}>Datum povratka (okviran)</label>
                        <input id="rd" type="date" value={form.returnDate} onChange={upd("returnDate")} className={inputCls} />
                      </div>
                    </div>
                  </div>
                )}

                {/* OPCIONA NAPOMENA (Prilog 1B, tačka 3) */}
                <div>
                  <label htmlFor="note" className={labelCls}>
                    Napomena / Dodatna pitanja <span className="font-normal text-[var(--brand-ink)]/40">(opciono)</span>
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    value={form.note}
                    onChange={upd("note")}
                    className={`${inputCls} resize-none`}
                    placeholder="Unesite bilo kakvu dodatnu napomenu, željenu lokaciju ili pitanje..."
                  />
                </div>

                {/* OBAVEZNA SAGLASNOST SA POLITIKOM PRIVATNOSTI (Prilog 1B, tačka 3) */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 text-xs text-[var(--brand-ink)]/80">
                    <input
                      type="checkbox"
                      required
                      checked={privacy}
                      onChange={(e) => setPrivacy(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-black/30 accent-[var(--brand-ink)]"
                    />
                    <span>
                      Saglasan/na sam sa obradom mojih podataka o ličnosti u svrhu ove prijave i upoznat/a sam sa{" "}
                      <span className="font-bold underline">Politikom privatnosti</span> American Adventure agencije.{req}
                    </span>
                  </label>

                  {/* ZASEBNA OPCIONA NEWSLETTER SAGLASNOST (Prilog 1B, tačka 3) */}
                  <label className="flex items-start gap-3 text-xs text-[var(--brand-ink)]/80">
                    <input
                      type="checkbox"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-black/30 accent-[var(--brand-ink)]"
                    />
                    <span>
                      Želim da primam obaveštenja o akcijama, popustima i novim otvorenim poslovima (opciono).
                    </span>
                  </label>
                </div>

                {/* DUGME ZA SLANJE */}
                <button
                  type="submit"
                  disabled={!privacy}
                  className="w-full rounded-full py-4 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                >
                  POŠALJI PRIJAVU ZA {destInfo.label.toUpperCase()}
                </button>

                <p className="text-center text-xs text-[var(--brand-ink)]/50">
                  Prijava je potpuno besplatna i ne obavezuje vas na potpisivanje ugovora.
                </p>
              </form>
            </>
          )}

          {/* KORAK 3: POTVRDA USPEŠNOG SLANJA */}
          {step === "done" && (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: BRAND_YELLOW, color: INK }}>
                <CheckCircleIcon className="h-9 w-9" />
              </span>
              <h1 className="mt-5 text-2xl font-extrabold text-[var(--brand-ink)]">
                Prijava je uspešno poslata!
              </h1>
              <p className="mt-2 max-w-md text-sm text-[var(--brand-ink)]/70">
                Hvala vam na prijavi za <strong>{destInfo.label}</strong>. Podaci su uspešno evidentirani i prosleđeni timu na <strong>{destInfo.email}</strong>.
              </p>

              <div className="mt-6 w-full max-w-md rounded-2xl border border-black/10 bg-[var(--brand-yellow)]/[0.08] p-5 text-left">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: BRAND_YELLOW, color: INK }}>
                  <ClockIcon className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-center text-sm font-bold text-[var(--brand-ink)]">
                  Naredni koraci u procesu:
                </h2>
                <ol className="mt-4 space-y-2.5 text-xs text-[var(--brand-ink)]/80">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[0.65rem] font-bold text-white">1</span>
                    <span>Naš koordinator će vas kontaktirati telefonom ili putem emaila radi inicijalnog razgovora.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[0.65rem] font-bold text-white">2</span>
                    <span>Zakazujemo besplatne informativne konsultacije (uživo u kancelariji ili online preko video poziva).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[0.65rem] font-bold text-white">3</span>
                    <span>Nakon odobrenja aktiviramo vaš lični nalog na portalu za unos kompletne dokumentacije i izbor posla.</span>
                  </li>
                </ol>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      firstName: "",
                      lastName: "",
                      birthDate: DEFAULT_BIRTH_DATE,
                      address: "",
                      phone: "",
                      email: "",
                      note: "",
                      universityName: "",
                      studyUniversity: "",
                      studyCity: "",
                      studyYear: "1",
                      repeatedYear: "Ne",
                      ectsPoints: "",
                      fieldOfStudy: "",
                      parentName: "",
                      parentAddress: "",
                      parentPhone: "",
                      parentEmail: "",
                      hasDriversLicense: "Da",
                      ticketType: "Povratna",
                      departureCity: "Beograd",
                      destinationCity: "",
                      departureDate: "",
                      returnDate: "",
                      passengerType: "Student (J-1)",
                    });
                    setPrivacy(false);
                    setStep("program");
                  }}
                  className="rounded-full border border-black/15 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] hover:bg-black/5"
                >
                  Nova prijava
                </button>
                <a
                  href={logoHref}
                  onClick={go(logoHref)}
                  className="rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] shadow-xs"
                  style={{ backgroundColor: BRAND_YELLOW }}
                >
                  Povratak na početnu stranu
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
