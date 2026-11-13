// OnlinePrijava.jsx
import { useEffect, useState } from "react";
import { labelCls as baseLabelCls, inputCls as baseInputCls, ArrowRightIcon } from "./ui";
import { useTranslation } from "../i18n/LanguageContext";
import programItems from "../data/programItems";
import { submitPreApplicationWithBackend } from "../data/candidateStore";

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
  "internship": { email: "internship@workandtravel.rs", label: "Internship i Training" },
  "high-school": { email: "office.americanadventure@gmail.com", label: "High School USA" },
  "au-pair": { email: "aupair@workandtravel.rs", label: "Au Pair USA" },
  "h2b": { email: "office.americanadventure@gmail.com", label: "H-2B program u Americi" },
  "australia": { email: "australia@workandtravel.rs", label: "Australia Training Program" },
  "avio-karte": { email: "aviokarte@workandtravel.rs", label: "Avio karte" },
  "povracaj-poreza": { email: "office.americanadventure@gmail.com", label: "Povraćaj poreza iz SAD" },
  "viza-servis": { email: "office.americanadventure@gmail.com", label: "Viza servis za SAD" },
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

  const labelCls = baseLabelCls;
  const inputCls = `mt-2 ${baseInputCls}`;
  const req = <span className="text-red-600" aria-hidden="true"> *</span>;

  return (
    <section className="bg-surface px-5 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        {/* Koraci selekcije (Prilog 1A) */}
        {step !== "done" && (
          <ol className="grid grid-cols-4 gap-2 sm:gap-3">
            {["Online prijava", "Selekcija", "Konsultacije", "Nalog"].map((label, i) => (
              <li
                key={label}
                aria-current={i === 0 ? "step" : undefined}
                className={`border-t-2 pt-2.5 ${i === 0 ? "border-ink" : "border-line-strong"}`}
              >
                <span className={`block text-xs tabular-nums ${i === 0 ? "text-ink" : "text-ink-3"}`}>{i + 1}</span>
                <span className={`mt-0.5 hidden text-[13px] leading-snug sm:block ${i === 0 ? "font-semibold text-ink" : "text-ink-3"}`}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className={`rounded-[1.75rem] border border-line bg-white p-7 sm:p-10 ${step !== "done" ? "mt-8" : ""}`}>
          {/* KORAK 1: IZBOR PROGRAMA */}
          {step === "program" && (
            <>
              <h1 className="font-display text-[2.2rem] font-extrabold leading-[1] text-ink">
                Izaberi program
              </h1>
              <p className="mt-2 text-sm text-ink-2">
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
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors duration-150 ${
                        sel ? "border-ink bg-surface text-ink" : "border-line-strong text-ink hover:border-ink/40"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            sel ? "border-ink" : "border-line-strong"
                          }`}
                        >
                          {sel && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                        </span>
                        <span>{p.label}</span>
                      </span>
                      <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-3" />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* KORAK 2: DINAMIČKA PRIJAVNA FORMA PREMA PRILOGU 1B (SEKCIJA 4) */}
          {step === "form" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setStep("program")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  <BackIcon /> Promeni program
                </button>
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink">
                  {destInfo.label}
                </span>
              </div>

              <div className="mt-4">
                <h1 className="font-display text-[2.2rem] font-extrabold leading-[1] text-ink">Prijavni formular</h1>
                <p className="mt-2 text-sm text-ink-2">
                  Prijava stiže direktno timu agencije. Javljamo se na e-mail i telefon koje navedeš.
                </p>
              </div>

              <form onSubmit={submit} className="mt-8 space-y-8">
                {/* 1. OSNOVNI LIČNI PODACI (Obavezni za sve programe) */}
                <div className="border-t border-line pt-6">
                  <h3 className="text-base font-semibold text-ink">
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
                      <p className="mt-1 text-xs text-ink-3">Prijava je moguća samo za punoletne osobe.</p>
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
                  <div className="border-t border-line pt-6">
                    <h3 className="text-base font-semibold text-ink">
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
                          <option value="">Izaberi univerzitet</option>
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
                  <div className="border-t border-line pt-6">
                    <h3 className="text-base font-semibold text-ink">
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
                  <div className="border-t border-line pt-6">
                    <h3 className="text-base font-semibold text-ink">
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
                  <div className="border-t border-line pt-6">
                    <h3 className="text-base font-semibold text-ink">
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
                  <div className="border-t border-line pt-6">
                    <h3 className="text-base font-semibold text-ink">
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
                    Napomena / Dodatna pitanja <span className="font-normal text-ink-3">(opciono)</span>
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    value={form.note}
                    onChange={upd("note")}
                    className={`${inputCls} resize-none`}
                    placeholder="Željena lokacija, pitanje ili bilo šta što treba da znamo"
                  />
                </div>

                {/* OBAVEZNA SAGLASNOST SA POLITIKOM PRIVATNOSTI (Prilog 1B, tačka 3) */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 text-xs text-ink-2">
                    <input
                      type="checkbox"
                      required
                      checked={privacy}
                      onChange={(e) => setPrivacy(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-line-strong accent-ink"
                    />
                    <span>
                      Saglasan/na sam sa obradom mojih podataka o ličnosti u svrhu ove prijave i upoznat/a sam sa{" "}
                      <span className="font-semibold underline">Politikom privatnosti</span> American Adventure agencije.{req}
                    </span>
                  </label>

                  {/* ZASEBNA OPCIONA NEWSLETTER SAGLASNOST (Prilog 1B, tačka 3) */}
                  <label className="flex items-start gap-3 text-xs text-ink-2">
                    <input
                      type="checkbox"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-line-strong accent-ink"
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
                  className="bg-brand text-ink w-full rounded-full py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 transition-colors hover:bg-brand-strong"
                >
                  Pošalji prijavu za {destInfo.label}
                </button>

                <p className="text-center text-xs text-ink-3">
                  Prijava je potpuno besplatna i ne obavezuje vas na potpisivanje ugovora.
                </p>
              </form>
            </>
          )}

          {/* KORAK 3: POTVRDA USPEŠNOG SLANJA */}
          {step === "done" && (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="bg-brand text-ink flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircleIcon className="h-9 w-9" />
              </span>
              <h1 className="mt-6 font-display text-[2.2rem] font-extrabold leading-[1] text-ink">Prijava je poslata</h1>
              <p className="mt-3 max-w-md text-base text-ink-2">
                Hvala na prijavi za <strong className="font-semibold text-ink">{destInfo.label}</strong>. Podaci su evidentirani i naš tim ih je dobio.
              </p>

              <div className="mt-8 w-full max-w-md rounded-2xl bg-surface p-6 text-left">
                <h2 className="text-sm font-semibold text-ink">Šta sledi</h2>
                <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink-2">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">1</span>
                    <span>Koordinator te zove ili ti piše radi kratkog razgovora.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">2</span>
                    <span>Zakazujemo besplatne konsultacije, u kancelariji ili preko video poziva.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">3</span>
                    <span>Kad te odobrimo, otvaramo ti nalog na portalu, gde predaješ dokumenta i biraš posao.</span>
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
                  className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface"
                >
                  Nova prijava
                </button>
                <a
                  href={logoHref}
                  onClick={go(logoHref)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand-strong"
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
