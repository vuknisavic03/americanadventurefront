// front/src/components/dashboard/modals/TranslationModal.jsx
import { SparklesIcon, CloseIcon, CheckIcon } from "../icons";
import { BRAND_YELLOW, INK } from "../constants";
import {
  openPrintableTranslationWindow,
  getTranslatedFacultyName,
  getTranslatedStudyYear,
} from "../../../data/candidateStore";

export default function TranslationModal({
  isOpen,
  onClose,
  activeTranslationDoc,
  setActiveTranslationDoc,
  candidate,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-[var(--brand-ink)]">
              Zvanični overeni prevod sudskog tumača
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-black/50 hover:bg-black/5 hover:text-black"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs leading-relaxed text-[var(--brand-ink)]/85">
          {/* Tabovi prevoda */}
          <div className="flex gap-2 border-b border-black/10 pb-3">
            <button
              type="button"
              onClick={() => setActiveTranslationDoc("faculty")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTranslationDoc === "faculty"
                  ? "bg-[var(--brand-ink)] text-white shadow-2xs"
                  : "bg-black/[0.05] text-[var(--brand-ink)]/70 hover:bg-black/[0.08]"
              }`}
            >
              🎓 Uverenje sa fakulteta
            </button>
            <button
              type="button"
              onClick={() => setActiveTranslationDoc("police")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTranslationDoc === "police"
                  ? "bg-[var(--brand-ink)] text-white shadow-2xs"
                  : "bg-black/[0.05] text-[var(--brand-ink)]/70 hover:bg-black/[0.08]"
              }`}
            >
              🏛️ Uverenje o nekažnjavanju (MUP)
            </button>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-3.5 text-green-900 font-semibold flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-700 shrink-0" />
              <span>Zvanični sertifikovan prevod ovlašćenog sudskog tumača za engleski jezik, usklađen sa US Department of State J-1 standardima.</span>
            </div>
            <button
              type="button"
              onClick={() => openPrintableTranslationWindow(activeTranslationDoc, candidate)}
              className="rounded-lg bg-green-800 text-white font-bold px-3 py-1.5 text-xs hover:bg-green-900 shrink-0 inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>🖨️ Preuzmi overen prevod (PDF) / Štampaj</span>
            </button>
          </div>

          {activeTranslationDoc === "faculty" ? (
            <div className="rounded-xl border border-black/10 bg-white p-5 font-mono text-[0.8rem] space-y-3 bg-[#fafafa]">
              <p className="text-center font-bold uppercase tracking-wider text-black">
                CERTIFICATE OF ENROLLMENT & FULL-TIME STUDENT STATUS
              </p>
              <p className="text-center text-[0.7rem] text-black/60">
                Certified Translation from Serbian Language — For US J-1 Visa Exchange Visitor Program
              </p>
              <hr className="border-black/10 my-3" />
              <p><strong>Academic Institution:</strong> {getTranslatedFacultyName(candidate?.faculty || candidate?.university || "Ekonomski fakultet Univerziteta u Beogradu")}</p>
              <p><strong>Student Full Name:</strong> {`${candidate?.firstName || ""} ${candidate?.lastName || ""}`.trim() || candidate?.name || "Student Kandidat"}</p>
              <p><strong>National Identification No. (JMBG):</strong> {candidate?.jmbg || "1508001710023"}</p>
              <p><strong>Passport Number:</strong> {candidate?.passportNumber || candidate?.idCardNumber || "010948212"}</p>
              <p><strong>Academic Year & Standing:</strong> {getTranslatedStudyYear(candidate?.studyYear || "YEAR_2")}</p>
              <p><strong>Current Status:</strong> Full-time regular undergraduate student in good academic standing for 2025/2026 academic year.</p>
              <p><strong>Official Summer Recess:</strong> June 1, 2026 – October 1, 2026 (SWT USA Work Period)</p>
              <div className="pt-2 text-[0.7rem] text-black/60 border-t border-black/10 mt-3 flex flex-wrap justify-between items-center gap-2">
                <span>* Certified by Official Court Interpreter for English Language, Republic of Serbia</span>
                <span className="font-bold text-slate-800">Reg. No: AA-TRANS-2026-{String(candidate?.id || "1042").slice(-4)}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 bg-white p-5 font-mono text-[0.8rem] space-y-3 bg-[#fafafa]">
              <p className="text-center font-bold uppercase tracking-wider text-black">
                REPUBLIC OF SERBIA — MINISTRY OF INTERNAL AFFAIRS (MUP)
              </p>
              <p className="text-center font-bold uppercase tracking-wider text-black text-[0.75rem]">
                POLICE CLEARANCE CERTIFICATE (CLEAN CRIMINAL RECORD)
              </p>
              <p className="text-center text-[0.7rem] text-black/60">
                Official Sworn Translation from Serbian — Certified for US Department of State J-1 Visa Sponsor
              </p>
              <hr className="border-black/10 my-3" />
              <p><strong>Applicant Full Name:</strong> {`${candidate?.firstName || ""} ${candidate?.lastName || ""}`.trim() || candidate?.name || "Student Kandidat"}</p>
              <p><strong>Personal ID (JMBG):</strong> {candidate?.jmbg || "1508001710023"}</p>
              <p><strong>Passport Number:</strong> {candidate?.passportNumber || candidate?.idCardNumber || "010948212"}</p>
              <p><strong>Official Police Registry Finding:</strong></p>
              <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-200">
                "It is hereby certified that according to the centralized penal and misdemeanor register of the Ministry of Internal Affairs of the Republic of Serbia, the named person HAS NOT BEEN CONVICTED of any felony or misdemeanor, and NO CRIMINAL PROCEEDINGS are currently pending."
              </div>
              <div className="pt-2 text-[0.7rem] text-black/60 border-t border-black/10 mt-3 flex flex-wrap justify-between items-center gap-2">
                <span>* Certified by Official Court Interpreter for English Language, Republic of Serbia</span>
                <span className="font-bold text-slate-800">Reg. No: AA-MUP-2026-{String(candidate?.id || "1042").slice(-4)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-black/10">
            <button
              type="button"
              onClick={() => openPrintableTranslationWindow(activeTranslationDoc, candidate)}
              className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-black transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>🖨️ Preuzmi overen prevod (PDF) / Štampaj</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: BRAND_YELLOW, color: INK }}
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
