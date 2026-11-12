// front/src/components/dashboard/modals/TranslationModal.jsx
import { SparklesIcon, CloseIcon, CheckIcon } from "../icons";
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
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-semibold text-ink">
              Zvanični overeni prevod sudskog tumača
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink-3 hover:bg-surface-2 hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs leading-relaxed text-ink">
          {/* Tabovi prevoda */}
          <div className="flex gap-2 border-b border-line pb-3">
            <button
              type="button"
              onClick={() => setActiveTranslationDoc("faculty")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTranslationDoc === "faculty"
                  ? "bg-ink text-white"
                  : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
              }`}
            >
              Uverenje sa fakulteta
            </button>
            <button
              type="button"
              onClick={() => setActiveTranslationDoc("police")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTranslationDoc === "police"
                  ? "bg-ink text-white"
                  : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
              }`}
            >
              Uverenje o nekažnjavanju (MUP)
            </button>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3.5 text-emerald-900 font-semibold flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Zvanični sertifikovan prevod ovlašćenog sudskog tumača za engleski jezik, usklađen sa US Department of State J-1 standardima.</span>
            </div>
            <button
              type="button"
              onClick={() => openPrintableTranslationWindow(activeTranslationDoc, candidate)}
              className="rounded-full bg-emerald-800 text-white font-semibold px-3 py-1.5 text-xs hover:bg-emerald-900 shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Preuzmi overen prevod (PDF) / Štampaj</span>
            </button>
          </div>

          {activeTranslationDoc === "faculty" ? (
            <div className="rounded-xl border border-line bg-white p-5 tabular-nums text-[13px] space-y-3 bg-surface">
              <p className="text-center font-semibold uppercase tracking-wider text-ink">
                CERTIFICATE OF ENROLLMENT & FULL-TIME STUDENT STATUS
              </p>
              <p className="text-center text-xs text-ink-3">
                Certified Translation from Serbian Language — For US J-1 Visa Exchange Visitor Program
              </p>
              <hr className="border-line my-3" />
              <p><strong>Academic Institution:</strong> {getTranslatedFacultyName(candidate?.faculty || candidate?.university || "Ekonomski fakultet Univerziteta u Beogradu")}</p>
              <p><strong>Student Full Name:</strong> {`${candidate?.firstName || ""} ${candidate?.lastName || ""}`.trim() || candidate?.name || "Student Kandidat"}</p>
              <p><strong>National Identification No. (JMBG):</strong> {candidate?.jmbg || "1508001710023"}</p>
              <p><strong>Passport Number:</strong> {candidate?.passportNumber || candidate?.idCardNumber || "010948212"}</p>
              <p><strong>Academic Year & Standing:</strong> {getTranslatedStudyYear(candidate?.studyYear || "YEAR_2")}</p>
              <p><strong>Current Status:</strong> Full-time regular undergraduate student in good academic standing for 2025/2026 academic year.</p>
              <p><strong>Official Summer Recess:</strong> June 1, 2026 – October 1, 2026 (SWT USA Work Period)</p>
              <div className="pt-2 text-xs text-ink-3 border-t border-line mt-3 flex flex-wrap justify-between items-center gap-2">
                <span>* Certified by Official Court Interpreter for English Language, Republic of Serbia</span>
                <span className="font-semibold text-ink">Reg. No: AA-TRANS-2026-{String(candidate?.id || "1042").slice(-4)}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-white p-5 tabular-nums text-[13px] space-y-3 bg-surface">
              <p className="text-center font-semibold uppercase tracking-wider text-ink">
                REPUBLIC OF SERBIA — MINISTRY OF INTERNAL AFFAIRS (MUP)
              </p>
              <p className="text-center font-semibold text-ink text-xs">
                POLICE CLEARANCE CERTIFICATE (CLEAN CRIMINAL RECORD)
              </p>
              <p className="text-center text-xs text-ink-3">
                Official Sworn Translation from Serbian — Certified for US Department of State J-1 Visa Sponsor
              </p>
              <hr className="border-line my-3" />
              <p><strong>Applicant Full Name:</strong> {`${candidate?.firstName || ""} ${candidate?.lastName || ""}`.trim() || candidate?.name || "Student Kandidat"}</p>
              <p><strong>Personal ID (JMBG):</strong> {candidate?.jmbg || "1508001710023"}</p>
              <p><strong>Passport Number:</strong> {candidate?.passportNumber || candidate?.idCardNumber || "010948212"}</p>
              <p><strong>Official Police Registry Finding:</strong></p>
              <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg">
                "It is hereby certified that according to the centralized penal and misdemeanor register of the Ministry of Internal Affairs of the Republic of Serbia, the named person HAS NOT BEEN CONVICTED of any felony or misdemeanor, and NO CRIMINAL PROCEEDINGS are currently pending."
              </div>
              <div className="pt-2 text-xs text-ink-3 border-t border-line mt-3 flex flex-wrap justify-between items-center gap-2">
                <span>* Certified by Official Court Interpreter for English Language, Republic of Serbia</span>
                <span className="font-semibold text-ink">Reg. No: AA-MUP-2026-{String(candidate?.id || "1042").slice(-4)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => openPrintableTranslationWindow(activeTranslationDoc, candidate)}
              className="rounded-full bg-ink text-white px-5 py-2.5 text-xs font-semibold hover:bg-neutral-950 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Preuzmi overen prevod (PDF) / Štampaj</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-brand text-ink rounded-full px-6 py-2.5 text-[13px] font-semibold transition-colors hover:bg-brand-strong"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
