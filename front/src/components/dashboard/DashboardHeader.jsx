// front/src/components/dashboard/DashboardHeader.jsx
import Logo from "../Logo";
import {
  FileIcon,
  CheckIcon,
  UploadIcon,
  ReceiptIcon,
  LogoutIcon,
} from "./icons";
import { BRAND_YELLOW } from "./constants";
import {
  downloadContractPdf,
  downloadResponsibilityStatementPdf,
  getDs160Status,
} from "../../data/candidateStore";

export default function DashboardHeader({
  candidate,
  logoHref,
  goHome,
  onLogout,
  t,
  hasSignedContract,
  isContractApproved,
  isContractPending,
  isFirstInstallmentPaid,
  isFirstInstallmentPending,
  setShowSignContractModal,
  handlePaymentSlipClick,
  setShowInvoicesModal,
  candidateInvoices,
  setShowDs160Modal,
  uploadToast,
  statusBadgeText,
  currentProgress,
  isRegistrationDone,
  isStep1Done,
  isDocumentsApproved,
  isDocumentsPending,
  isDocumentsRejected,
  isStep2Done,
  isSecondInstallmentPaid,
  isSecondInstallmentPending,
  isStep3Done,
  isThirdInstallmentPaid,
  isThirdInstallmentPending,
  profileScore,
  hasConfirmedJob,
  status,
  interviewScheduled,
  jobApplicationStatus,
  activeStepTab,
  setActiveStepTab,
}) {
  return (
    <>
      {/* Gornji bar / Header profila */}
      <header className="sticky top-0 z-30 border-b border-black/[0.08] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href={logoHref} onClick={goHome} className="flex items-center">
            <Logo className="h-8 w-auto" />
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-[var(--brand-ink)]">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-[0.7rem] text-[var(--brand-ink)]/50">{candidate.email}</p>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-yellow)]/30 text-xs font-bold text-[var(--brand-ink)]">
              {candidate.firstName?.[0]}
              {candidate.lastName?.[0]}
            </span>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[var(--brand-ink)] transition-colors hover:bg-black/[0.04]"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">{t("dash.logout")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dobrodošlica i status */}
      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-4 lg:px-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-xs sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-xs font-bold tracking-wide text-[var(--brand-ink)]">
              {candidate.packageName || "Work & Travel USA"}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
              Zdravo, {candidate.firstName}!
            </h1>
            <p className="mt-1 text-sm text-[var(--brand-ink)]/65">
              Dobrodošao/la u svoj kandidatski profil za Work & Travel 2026.
            </p>
          </div>

          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-left sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/45">
              Model uplate
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--brand-ink)]">
              {candidate.paymentMethod === "later"
                ? "Plati kad se vratiš (uz jemca)"
                : candidate.paymentMethod === "installments"
                ? "U ratama"
                : "U celosti"}
            </p>
            {candidate.guarantor && (
              <p className="mt-1 text-xs text-[var(--brand-ink)]/60">
                Jemac: {candidate.guarantor.name} ({candidate.guarantor.promissoryNotesCount} menice)
              </p>
            )}
          </div>
        </div>

        {/* Brze akcije dokumentacije */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-black/[0.07] pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadContractPdf(candidate.id, candidate.email)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-bold text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/[0.04]"
              title="Preuzmi zvanični ugovor agencije u PDF formatu sa automatski popunjenim podacima"
            >
              <FileIcon className="h-4 w-4 text-[var(--brand-ink)]/70" />
              <span>Preuzmi ugovor (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-bold text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/[0.04]"
              title="Preuzmi zvaničnu Izjavu o odgovornosti (PDF) sa unetim imenom, JMBG-om i brojem pasoša"
            >
              <FileIcon className="h-4 w-4 text-[var(--brand-ink)]/70" />
              <span>Izjava o odgovornosti (PDF)</span>
            </button>

            {!hasSignedContract ? (
              <button
                type="button"
                onClick={() => setShowSignContractModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-black px-3.5 py-2 text-xs font-bold shadow-xs hover:bg-amber-600 transition-colors animate-pulse"
                title="Obavezno odštampati, potpisati i okačiti pre bilo kakve uplate"
              >
                <span>Okači potpisani ugovor</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 text-green-900 px-3 py-2 text-xs font-bold">
                <CheckIcon className="h-4 w-4 text-green-700" />
                <span>Potpisan ugovor okačen</span>
              </span>
            )}

            <button
              type="button"
              onClick={handlePaymentSlipClick}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold shadow-xs transition-colors ${
                hasSignedContract
                  ? "border-black/15 bg-white text-[var(--brand-ink)] hover:bg-black/[0.04]"
                  : "border-black/10 bg-black/[0.04] text-[var(--brand-ink)]/50"
              }`}
              title={
                hasSignedContract
                  ? "Preuzmi instrukcije i nalog za uplatu sa NBS IPS QR kodom"
                  : "Ugovor mora biti odštampan, potpisan i okačen pre uplate"
              }
            >
              <UploadIcon className="h-4 w-4 rotate-180 text-[var(--brand-ink)]/70" />
              <span>Uplatnica / IPS QR (PDF)</span>
              {!hasSignedContract && (
                <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                  Zaključano
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowInvoicesModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-bold text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/[0.04]"
              title="Pregled zvaničnih računa i faktura iz Knjige izdatih računa (KIR)"
            >
              <ReceiptIcon className="h-4 w-4 text-emerald-700" />
              <span>Moji računi / KIR</span>
              {candidateInvoices.length > 0 && (
                <span className="ml-1 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-black">
                  {candidateInvoices.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDs160Modal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-950 shadow-xs transition-colors hover:bg-blue-100"
          >
            <span>DS-160 Upitnik za vizu</span>
            {(() => {
              const st = getDs160Status(candidate.ds160);
              if (st.isComplete) {
                return (
                  <span className="rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-extrabold text-green-900">
                    Popunjen
                  </span>
                );
              }
              if (st.isStarted) {
                return (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                    U toku ({st.filledCount}/{st.totalCount})
                  </span>
                );
              }
              return (
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold text-black/60">
                  Za popunjavanje
                </span>
              );
            })()}
          </button>
        </div>

        {uploadToast && (
          <div className="mt-4 rounded-xl border border-green-300 bg-green-50 px-4 py-2.5 text-xs font-bold text-green-900 shadow-xs animate-in fade-in">
            {uploadToast}
          </div>
        )}

        {/* Stepper toka aplikacije */}
        <div className="mt-3.5 border-t border-black/[0.07] pt-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/50">
            <span>{t("dash.appStatus")}</span>
            <span className="font-extrabold text-[var(--brand-ink)]">
              {statusBadgeText}
            </span>
          </div>



          {/* Stepper: Registracija + 3 koraka */}
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Registracija */}
            <div
              onClick={() => setActiveStepTab("reg")}
              className={`rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01] ${
                isRegistrationDone
                  ? "border-green-300 bg-green-50/80 text-green-950"
                  : isFirstInstallmentPending || isContractPending
                  ? "border-amber-400 bg-amber-50/90 text-amber-950"
                  : "border-amber-300 bg-amber-50/70 text-amber-950"
              } ${activeStepTab === "reg" ? "ring-2 ring-[var(--brand-ink)] shadow-xs" : ""}`}
              title="Prikaži detalje Registracije i Ugovora"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  {isRegistrationDone ? (
                    <CheckIcon className="h-4 w-4 text-green-700" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  Registracija
                </span>
              </div>
              <p className="mt-1 text-xs font-bold text-[var(--brand-ink)]">
                {candidate.paymentMethod === "now" ? "Ugovor, Izjava & Uplata u celosti" : "Ugovor, Izjava & I rata"}
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">
                {isRegistrationDone
                  ? (candidate.paymentMethod === "now" ? "Ugovor odobren - Uplata u celosti knjižena" : "Ugovor odobren - I rata plaćena")
                  : isFirstInstallmentPending
                  ? (candidate.paymentMethod === "now" ? "Uplata u celosti na proveri" : "Uplata I rate na proveri")
                  : isContractPending
                  ? "Ugovor na overi kod pravnog tima"
                  : hasSignedContract
                  ? (candidate.paymentMethod === "now" ? "Ugovor okačen • Čeka uplatu u celosti" : "Ugovor okačen • Čeka uplatu I rate")
                  : "Čeka potpisani ugovor pre uplate"}
              </p>
            </div>

            {/* Korak 1: Profil, Dokumentacija & Prevodi */}
            <div
              onClick={() => setActiveStepTab("step1")}
              className={`rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01] ${
                isStep1Done
                  ? "border-green-300 bg-green-50/80 text-green-950"
                  : isDocumentsRejected
                  ? "border-rose-400 bg-rose-50/90 text-rose-950 ring-1 ring-rose-400"
                  : isDocumentsPending
                  ? "border-amber-400 bg-amber-50/90 text-amber-950"
                  : !isRegistrationDone
                  ? "border-black/10 bg-black/[0.02] text-[var(--brand-ink)]/50"
                  : "border-blue-300 bg-blue-50/70 text-blue-950"
              } ${activeStepTab === "step1" ? "ring-2 ring-[var(--brand-ink)] shadow-xs" : ""}`}
              title="Prikaži detalje Koraka 1: Profil, CV i uverenja sa prevodom"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  {isStep1Done ? (
                    <CheckIcon className="h-4 w-4 text-green-700" />
                  ) : isDocumentsRejected ? (
                    <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                  ) : isDocumentsPending ? (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : isRegistrationDone ? (
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  )}
                  Korak 1: Profil & Dokumenti
                </span>
                {isDocumentsRejected && (
                  <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[9px] font-black uppercase text-rose-900 border border-rose-300">
                    Dopuna
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-bold text-[var(--brand-ink)]">
                CV, Video, Fakultet & MUP
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">
                {isStep1Done
                  ? "Dosije odobren od sponzora"
                  : isDocumentsRejected
                  ? "Dosije vraćen na dopunu"
                  : isDocumentsPending
                  ? "Dosije poslat na pregled"
                  : !isRegistrationDone
                  ? "Zaključano do uplate I rate"
                  : candidate.profileCompleted ? "Profil popunjen • U pripremi" : "Popunjavanje profila i dokumenata"}
              </p>
            </div>

            {/* Korak 2: Pronalaženje posla, Intervju & II rata */}
            <div
              onClick={() => setActiveStepTab("step2")}
              className={`rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01] ${
                isStep2Done
                  ? "border-green-300 bg-green-50/80 text-green-950"
                  : isSecondInstallmentPending
                  ? "border-amber-400 bg-amber-50/90 text-amber-950"
                  : hasConfirmedJob || status === "job" || interviewScheduled
                  ? "border-blue-400 bg-blue-50/90 text-blue-950"
                  : "border-black/10 bg-black/[0.02] text-[var(--brand-ink)]/50"
              } ${activeStepTab === "step2" ? "ring-2 ring-[var(--brand-ink)] shadow-xs" : ""}`}
              title="Prikaži detalje Koraka 2: Sajam poslova i Job Offer"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  {isStep2Done ? (
                    <CheckIcon className="h-4 w-4 text-green-700" />
                  ) : isSecondInstallmentPending ? (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : hasConfirmedJob || status === "job" || interviewScheduled ? (
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  )}
                  {candidate.paymentMethod === "now" ? "Korak 2: Posao & Intervju" : "Korak 2: Posao & II rata"}
                </span>
              </div>
              <p className="mt-1 text-xs font-bold text-[var(--brand-ink)]">
                Sajam poslova & Job Offer
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">
                {isStep2Done
                  ? (candidate.paymentMethod === "now" || candidate.isFullPaymentPaid ? "Job Offer potpisan - Program plaćen" : "Job Offer potpisan - II rata plaćena")
                  : isSecondInstallmentPending
                  ? "Čeka knjiženje II rate"
                  : hasConfirmedJob
                  ? (candidate.paymentMethod === "now" || candidate.isFullPaymentPaid ? "Job Offer prihvaćen" : "Job Offer prihvaćen - Čeka II ratu")
                  : !isDocumentsApproved
                  ? "Zaključano do odobrenja dosijea"
                  : interviewScheduled || jobApplicationStatus === "SCHEDULED"
                  ? "Intervju zakazan"
                  : jobApplicationStatus === "APPLIED"
                  ? "Prijava poslata - Čeka termin"
                  : jobApplicationStatus === "NO_SLOTS"
                  ? "Nema termina za intervju"
                  : jobApplicationStatus === "REJECTED"
                  ? "Poslodavac odbio kandidata"
                  : "Čeka odabir radne ponude"}
              </p>
            </div>

            {/* Korak 3: Ambasada SAD, Viza, III rata / PKZ & Polazak */}
            <div
              onClick={() => setActiveStepTab("step3")}
              className={`rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01] ${
                isStep3Done
                  ? "border-green-300 bg-green-50/80 text-green-950"
                  : isThirdInstallmentPending
                  ? "border-amber-400 bg-amber-50/90 text-amber-950"
                  : status === "departure"
                  ? "border-amber-400 bg-amber-50/90 text-amber-950"
                  : "border-black/10 bg-black/[0.02] text-[var(--brand-ink)]/50"
              } ${activeStepTab === "step3" ? "ring-2 ring-[var(--brand-ink)] shadow-xs" : ""}`}
              title="Prikaži detalje Koraka 3: Ambasada SAD i viza"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  {isStep3Done ? (
                    <CheckIcon className="h-4 w-4 text-green-700" />
                  ) : isThirdInstallmentPending || status === "departure" ? (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  )}
                  {isStep3Done ? "Viza odobrena" : "Korak 3: Čekanje na vizu"}
                </span>
              </div>
              <p className="mt-1 text-xs font-bold text-[var(--brand-ink)]">
                {candidate.paymentMethod === "now" ? "DS-2019, Ambasada & Viza" : "DS-2019, Ambasada & III rata"}
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">
                {isStep3Done
                  ? "Viza u pasošu - Spreman za let!"
                  : isThirdInstallmentPending
                  ? "Čeka potvrdu III rate"
                  : status === "departure"
                  ? "Termin u ambasadi SAD"
                  : !isSecondInstallmentPaid && candidate.paymentMethod !== "now" && !candidate.isFullPaymentPaid
                  ? "Zaključano do uplate II rate"
                  : "Čeka DS-2019 i vizu"}
              </p>
            </div>
          </div>

          {/* Navigacioni filter tabovi koraka */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/[0.07] pt-2.5">
            <button
              type="button"
              onClick={() => setActiveStepTab("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                activeStepTab === "all"
                  ? "bg-[var(--brand-ink)] text-white shadow-xs"
                  : "bg-black/[0.04] text-[var(--brand-ink)]/70 hover:bg-black/[0.08]"
              }`}
            >
              Svi koraci (Kompletan pregled)
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab("reg")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                activeStepTab === "reg"
                  ? "bg-[var(--brand-ink)] text-white shadow-xs"
                  : "bg-black/[0.04] text-[var(--brand-ink)]/70 hover:bg-black/[0.08]"
              }`}
            >
              {candidate.paymentMethod === "now" ? "Registracija (Ugovor & Uplata u celosti)" : "Registracija (Ugovor & I rata)"}
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab("step1")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                activeStepTab === "step1"
                  ? "bg-[var(--brand-ink)] text-white shadow-xs"
                  : "bg-black/[0.04] text-[var(--brand-ink)]/70 hover:bg-black/[0.08]"
              }`}
            >
              Korak 1: Profil, Dokumenti & Prevodi
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab("step2")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                activeStepTab === "step2"
                  ? "bg-[var(--brand-ink)] text-white shadow-xs"
                  : "bg-black/[0.04] text-[var(--brand-ink)]/70 hover:bg-black/[0.08]"
              }`}
            >
              {candidate.paymentMethod === "now" ? "Korak 2: Posao & Intervju" : "Korak 2: Posao, Intervju & II rata"}
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab("step3")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                activeStepTab === "step3"
                  ? "bg-[var(--brand-ink)] text-white shadow-xs"
                  : "bg-black/[0.04] text-[var(--brand-ink)]/70 hover:bg-black/[0.08]"
              }`}
            >
              {candidate.paymentMethod === "now" ? "Korak 3: Ambasada, Viza & Polazak" : "Korak 3: Ambasada, Viza, III rata & Polazak"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
