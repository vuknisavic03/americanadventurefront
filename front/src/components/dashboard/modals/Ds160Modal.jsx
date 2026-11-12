// front/src/components/dashboard/modals/Ds160Modal.jsx
import { useState } from "react";
import { CloseIcon } from "../icons";
import { BRAND_YELLOW } from "../constants";
import { getDs160Status } from "../../../data/candidateStore";

export default function Ds160Modal({ candidate, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [f, setF] = useState(() => {
    const d = candidate.ds160 || {};
    const candFirst = candidate.firstName || (candidate.name ? candidate.name.split(" ")[0] : "");
    const candLast = candidate.lastName || (candidate.name ? candidate.name.split(" ").slice(1).join(" ") : "");
    return {
      lastNameAndMaiden: d.lastNameAndMaiden || candLast || "",
      firstName: d.firstName || candFirst || "",
      gender: d.gender || candidate.gender || "Muški",
      maritalStatus: d.maritalStatus || candidate.maritalStatus || "Neoženjen / Neudata",
      dateOfBirth: d.dateOfBirth || candidate.birthDate || candidate.dateOfBirth || "",
      birthPlace: d.birthPlace || candidate.birthPlace || candidate.city || candidate.studyCity || "",
      birthCountry: d.birthCountry || candidate.birthCountry || "Srbija",
      citizenship: d.citizenship || candidate.citizenship || "Republika Srbija",
      jmbg: d.jmbg || candidate.jmbg || "",
      ssn: d.ssn || candidate.ssn || "",
      passportNumber: d.passportNumber || candidate.passportNumber || candidate.idCardNumber || "",
      passportCountry: d.passportCountry || candidate.passportCountry || "Republika Srbija",
      passportExpiryDate: d.passportExpiryDate || candidate.passportExpiryDate || candidate.passportExpiry || "",
      employerInfo: d.employerInfo || (candidate.selectedJobEmployer || candidate.jobEmployer ? `${candidate.selectedJobEmployer || candidate.jobEmployer} (${candidate.selectedJobTitle || candidate.jobTitle || "Radna pozicija"})` : ""),
      stayAddress: d.stayAddress || (candidate.selectedJobCity || candidate.jobCity || candidate.jobLocation ? `${candidate.selectedJobHousing || candidate.jobHousing ? `${candidate.selectedJobHousing || candidate.jobHousing}, ` : ""}${candidate.selectedJobCity || candidate.jobCity || candidate.jobLocation}, SAD` : ""),
      supervisorName: d.supervisorName || (candidate.selectedJobEmployer || candidate.jobEmployer ? "HR Department / Supervisor" : ""),
      employerPhone: d.employerPhone || (candidate.selectedJobEmployer || candidate.jobEmployer ? "+1 (555) 234-5678" : ""),
      tripFunder: d.tripFunder || "Roditelji / Lična sredstva",
      previousUsTravel: d.previousUsTravel || "Ne",
      visaRefusal: d.visaRefusal || "Ne",
      homeAddress: d.homeAddress || candidate.address || "",
      mobilePhone: d.mobilePhone || candidate.phone || "",
      primaryEmail: d.primaryEmail || candidate.email || "",
      socialMediaAccounts: d.socialMediaAccounts || "",
      highSchoolInfo: d.highSchoolInfo || "",
      university: d.university || candidate.faculty || "",
      studyProgram: d.studyProgram || candidate.studyProgram || "",
      referencePerson1: d.referencePerson1 || "",
      referencePerson2: d.referencePerson2 || "",
      emergencyContact: d.emergencyContact || (candidate.guarantor ? `${candidate.guarantor.name} (${candidate.guarantor.phone || "Roditelj"})` : ""),
    };
  });

  const upd = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(f);
  };

  const dsStatus = getDs160Status(f);

  const inputCls =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-[var(--brand-ink)] transition-colors placeholder:text-black/35 focus:border-[var(--brand-ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--brand-ink)]";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="DS-160 Upitnik za izradu J-1 vize"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--brand-ink)]">
              Upitnik za izradu DS-160 vize za SAD (J-1)
            </h2>
            <p className="text-[11px] text-[var(--brand-ink)]/55">
              Zvanični formular agencije American Adventure po specifikaciji US State Department-a
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-black/50 hover:bg-black/5 hover:text-black"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Zvanično upozorenje agencije & Preuzimanje Word dokumenta */}
        <div className="border-b border-black/[0.08] bg-amber-50 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
          <div className="leading-snug">
            <strong>VAŽNA NAPOMENA AGENCIJE:</strong> Molimo Vas da dva puta proverite unete podatke. Netačnost informacija može rezultirati odbijanjem vize.
          </div>
          <a
            href="/documents/UPITNIK_za_izradu_DS160_J1.docx"
            download="UPITNIK_za_izradu_DS160_J1.docx"
            className="shrink-0 rounded-lg bg-white border border-amber-300 px-3 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-100 shadow-2xs"
          >
            Preuzmi originalni Word (.docx)
          </a>
        </div>

        {/* Tab traka */}
        <div className="flex border-b border-black/[0.08] bg-black/[0.02] px-6">
          {[
            ["personal", "1. Lični podaci & Pasoš"],
            ["us_travel", "2. Poslodavac & Putovanje"],
            ["contact_edu", "3. Kontakt & Fakultet"],
            ["references", "4. Reference & Pomoć"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`border-b-2 px-3.5 py-3 text-xs font-bold transition-colors ${
                activeTab === id
                  ? "border-[var(--brand-ink)] text-[var(--brand-ink)]"
                  : "border-transparent text-black/45 hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sadržaj tabova */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "personal" && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-black/70">Prezime i devojačko</label>
                <input value={f.lastNameAndMaiden} onChange={upd("lastNameAndMaiden")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Ime</label>
                <input value={f.firstName} onChange={upd("firstName")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Pol</label>
                <select value={f.gender} onChange={upd("gender")} className={inputCls}>
                  <option value="Muški">Muški</option>
                  <option value="Ženski">Ženski</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Bračno stanje</label>
                <select value={f.maritalStatus} onChange={upd("maritalStatus")} className={inputCls}>
                  <option value="Neoženjen / Neudata">Neoženjen / Neudata</option>
                  <option value="U braku">U braku</option>
                  <option value="Veren / Verena">Veren / Verena</option>
                  <option value="Razveden / Razvedena">Razveden / Razvedena</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Datum rođenja (DD/MM/GGGG)</label>
                <input value={f.dateOfBirth} onChange={upd("dateOfBirth")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Mesto i država rođenja</label>
                <input value={f.birthPlace} onChange={upd("birthPlace")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">JMBG (13 cifara)</label>
                <input value={f.jmbg} onChange={upd("jmbg")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">SSN (ako ste ga ranije dobili u SAD)</label>
                <input value={f.ssn} onChange={upd("ssn")} placeholder="Ostavite prazno ako nemate" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Broj važećeg pasoša</label>
                <input value={f.passportNumber} onChange={upd("passportNumber")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Datum isteka pasoša (DD/MM/GGGG)</label>
                <input value={f.passportExpiryDate} onChange={upd("passportExpiryDate")} className={inputCls} />
              </div>
            </div>
          )}

          {activeTab === "us_travel" && (
            <div className="space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Naziv poslodavca / kompanije u SAD</label>
                  <input value={f.employerInfo} onChange={upd("employerInfo")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Ime i prezime supervizora</label>
                  <input value={f.supervisorName} onChange={upd("supervisorName")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Adresa smeštaja ili poslodavca u SAD</label>
                <input value={f.stayAddress} onChange={upd("stayAddress")} className={inputCls} />
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Kontakt telefon kompanije u SAD</label>
                  <input value={f.employerPhone} onChange={upd("employerPhone")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Ko finansira put i program</label>
                  <input value={f.tripFunder} onChange={upd("tripFunder")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Prethodni boravci u SAD (datumi i svrhe boravka)</label>
                <input value={f.previousUsTravel} onChange={upd("previousUsTravel")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Da li ste ikada odbijeni za vizu SAD?</label>
                <input value={f.visaRefusal} onChange={upd("visaRefusal")} className={inputCls} />
              </div>
            </div>
          )}

          {activeTab === "contact_edu" && (
            <div className="space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Adresa prebivališta u Srbiji</label>
                  <input value={f.homeAddress} onChange={upd("homeAddress")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Mobilni telefon</label>
                  <input value={f.mobilePhone} onChange={upd("mobilePhone")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Nalozi na društvenim mrežama u zadnjih 5 godina (profili moraju biti otključani)</label>
                <textarea rows={2} value={f.socialMediaAccounts} onChange={upd("socialMediaAccounts")} className={`${inputCls} resize-y`} />
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Završena srednja škola (naziv i grad)</label>
                  <input value={f.highSchoolInfo} onChange={upd("highSchoolInfo")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black/70">Fakultet i smer studiranja</label>
                  <input value={f.university} onChange={upd("university")} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "references" && (
            <div className="space-y-3.5">
              <p className="text-xs text-black/60">
                Po propisima ambasade SAD, neophodno je navesti 2 osobe u Srbiji koje vas poznaju a nisu u krvnom srodstvu.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-black/70">1. Kontakt lice u Srbiji (Ime, prezime, adresa, telefon)</label>
                <input value={f.referencePerson1} onChange={upd("referencePerson1")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">2. Kontakt lice u Srbiji (Ime, prezime, adresa, telefon)</label>
                <input value={f.referencePerson2} onChange={upd("referencePerson2")} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/70">Kontakt za hitne slučajeve (Roditelj / staratelj — telefon i ime)</label>
                <input value={f.emergencyContact} onChange={upd("emergencyContact")} className={inputCls} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-4 mt-6">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  dsStatus.isComplete
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : dsStatus.isStarted
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-black/10 text-black/60"
                }`}
              >
                {dsStatus.isComplete
                  ? "Kompletno popunjeno (17/17 polja)"
                  : `Delimično popunjeno (${dsStatus.filledCount}/${dsStatus.totalCount} obaveznih polja)`}
              </span>
              <span className="text-[11px] text-black/50 hidden sm:inline">
                {dsStatus.isComplete
                  ? "Svi podaci su uneti."
                  : "Možete sačuvati uneto i dovršiti kasnije."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-xs font-bold text-black/70 hover:bg-black/5"
              >
                Odustani
              </button>
              <button
                type="submit"
                className="rounded-full px-7 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] shadow-md hover:brightness-105"
                style={{ backgroundColor: BRAND_YELLOW }}
              >
                {dsStatus.isComplete ? "Sačuvaj popunjen upitnik" : "Sačuvaj delimično (Nacrt)"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
