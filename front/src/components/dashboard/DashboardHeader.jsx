// front/src/components/dashboard/DashboardHeader.jsx
// Vrh kandidatskog portala: traka naloga, pozdrav, dokumenti i navigacija kroz korake.
// Koraci su ujedno i filter prikaza — jedna kontrola umesto odvojenog stepera i tabova.
import Logo from "../Logo";
import { FileIcon, UploadIcon, ReceiptIcon, LogoutIcon } from "./icons";
import { Button, buttonCls, cx, CheckIcon } from "../ui";
import { StatusPill } from "./ui";
import { downloadContractPdf, downloadResponsibilityStatementPdf, getDs160Status } from "../../data/candidateStore";

const DOT = {
  wait: "bg-amber-400",
  danger: "bg-red-500",
  current: "bg-brand ring-4 ring-brand/25",
  locked: "bg-neutral-300",
};

function StepTab({ label, title, note, state, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "group flex min-w-56 flex-1 flex-col border-t-2 pt-3 text-left transition-colors sm:min-w-0",
        active ? "border-ink" : "border-line-strong hover:border-ink/50"
      )}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-ink-3">
        {state === "done" ? (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
            <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />
          </span>
        ) : (
          <span className="flex h-4 w-4 items-center justify-center">
            <span className={cx("h-2 w-2 rounded-full", DOT[state] || DOT.locked)} />
          </span>
        )}
        {label}
      </span>
      <span className={cx("mt-1.5 text-sm font-semibold", state === "locked" ? "text-ink-3" : "text-ink")}>{title}</span>
      <span className={cx("mt-0.5 text-[13px] leading-snug", state === "danger" ? "text-red-700" : "text-ink-3")}>{note}</span>
    </button>
  );
}

export default function DashboardHeader({
  candidate,
  logoHref,
  goHome,
  onLogout,
  t,
  hasSignedContract,
  isContractPending,
  isFirstInstallmentPending,
  setShowSignContractModal,
  handlePaymentSlipClick,
  setShowInvoicesModal,
  candidateInvoices,
  setShowDs160Modal,
  uploadToast,
  statusBadgeText,
  isRegistrationDone,
  isStep1Done,
  isDocumentsApproved,
  isDocumentsPending,
  isDocumentsRejected,
  isStep2Done,
  isSecondInstallmentPaid,
  isSecondInstallmentPending,
  isStep3Done,
  isThirdInstallmentPending,
  hasConfirmedJob,
  status,
  interviewScheduled,
  jobApplicationStatus,
  activeStepTab,
  setActiveStepTab,
}) {
  const payNow = candidate.paymentMethod === "now";
  const fullyPaid = payNow || candidate.isFullPaymentPaid;
  const ds160 = getDs160Status(candidate.ds160);

  const steps = [
    {
      id: "reg",
      label: "Registracija",
      title: payNow ? "Ugovor i uplata u celosti" : "Ugovor i I rata",
      state: isRegistrationDone ? "done" : isFirstInstallmentPending || isContractPending ? "wait" : "current",
      note: isRegistrationDone
        ? payNow
          ? "Ugovor odobren, uplata proknjižena"
          : "Ugovor odobren, I rata plaćena"
        : isFirstInstallmentPending
        ? payNow
          ? "Uplata u celosti na proveri"
          : "Uplata I rate na proveri"
        : isContractPending
        ? "Ugovor na overi kod pravnog tima"
        : hasSignedContract
        ? payNow
          ? "Ugovor okačen, čeka uplatu"
          : "Ugovor okačen, čeka I ratu"
        : "Čeka potpisani ugovor",
    },
    {
      id: "step1",
      label: "Korak 1",
      title: "Profil i dokumenti",
      state: isStep1Done
        ? "done"
        : isDocumentsRejected
        ? "danger"
        : isDocumentsPending
        ? "wait"
        : !isRegistrationDone
        ? "locked"
        : "current",
      note: isStep1Done
        ? "Dosije odobren od sponzora"
        : isDocumentsRejected
        ? "Dosije vraćen na dopunu"
        : isDocumentsPending
        ? "Dosije poslat na pregled"
        : !isRegistrationDone
        ? "Otključava se posle registracije"
        : candidate.profileCompleted
        ? "Profil popunjen, dokumenti u pripremi"
        : "Popuni profil i dodaj dokumenta",
    },
    {
      id: "step2",
      label: "Korak 2",
      title: fullyPaid ? "Posao i intervju" : "Posao, intervju i II rata",
      state: isStep2Done
        ? "done"
        : isSecondInstallmentPending
        ? "wait"
        : hasConfirmedJob || status === "job" || interviewScheduled || isDocumentsApproved
        ? "current"
        : "locked",
      note: isStep2Done
        ? fullyPaid
          ? "Job Offer potpisan"
          : "Job Offer potpisan, II rata plaćena"
        : isSecondInstallmentPending
        ? "Čeka knjiženje II rate"
        : hasConfirmedJob
        ? fullyPaid
          ? "Job Offer prihvaćen"
          : "Job Offer prihvaćen, čeka II ratu"
        : !isDocumentsApproved
        ? "Otključava se kad dosije bude odobren"
        : interviewScheduled || jobApplicationStatus === "SCHEDULED"
        ? "Intervju zakazan"
        : jobApplicationStatus === "APPLIED"
        ? "Prijava poslata, čeka termin"
        : jobApplicationStatus === "NO_SLOTS"
        ? "Nema termina za intervju"
        : jobApplicationStatus === "REJECTED"
        ? "Poslodavac je odbio prijavu"
        : "Izaberi radnu ponudu",
    },
    {
      id: "step3",
      label: "Korak 3",
      title: isStep3Done ? "Viza odobrena" : payNow ? "Ambasada i viza" : "Ambasada, viza i III rata",
      state: isStep3Done ? "done" : isThirdInstallmentPending ? "wait" : status === "departure" ? "current" : "locked",
      note: isStep3Done
        ? "Viza u pasošu — spreman za let"
        : isThirdInstallmentPending
        ? "Čeka potvrdu III rate"
        : status === "departure"
        ? "Termin u Ambasadi SAD"
        : !isSecondInstallmentPaid && !fullyPaid
        ? "Otključava se posle II rate"
        : "Čeka DS-2019 i vizu",
    },
  ];

  return (
    <>
      {/* Traka naloga */}
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href={logoHref} onClick={goHome} className="flex items-center" aria-label="American Adventure — početna">
            <Logo className="h-9 w-auto" />
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-xs text-ink-3">{candidate.email}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
              {candidate.firstName?.[0]}
              {candidate.lastName?.[0]}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="px-3">
              <LogoutIcon />
              <span className="hidden sm:inline">{t("dash.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 sm:pt-12">
        {/* Pozdrav */}
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <p className="text-sm text-ink-3">{candidate.packageName || "Work & Travel USA"}</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-[1.08] text-ink sm:text-4xl">
              Zdravo, {candidate.firstName}
            </h1>
            <p className="mt-3 text-base text-ink-2">{statusBadgeText}</p>
          </div>

          <dl className="text-sm sm:text-right">
            <dt className="text-ink-3">Model uplate</dt>
            <dd className="mt-0.5 font-semibold text-ink">
              {candidate.paymentMethod === "later"
                ? "Plati kad se vratiš (uz jemca)"
                : candidate.paymentMethod === "installments"
                ? "U ratama"
                : "U celosti"}
            </dd>
            {candidate.guarantor && (
              <dd className="mt-0.5 text-xs text-ink-3">
                Jemac: {candidate.guarantor.name} ({candidate.guarantor.promissoryNotesCount} menice)
              </dd>
            )}
          </dl>
        </div>

        {/* Dokumenti */}
        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          {!hasSignedContract ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSignContractModal(true)}
              title="Odštampaj, potpiši i okači ugovor pre bilo kakve uplate"
            >
              <UploadIcon className="h-4 w-4" />
              Okači potpisani ugovor
            </Button>
          ) : (
            <StatusPill tone="done" className="h-9 px-4">
              <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              Potpisan ugovor okačen
            </StatusPill>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadContractPdf(candidate.id, candidate.email)}
            title="Ugovor agencije u PDF formatu, popunjen tvojim podacima"
          >
            <FileIcon className="h-4 w-4 text-ink-3" />
            Ugovor
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}
            title="Izjava o odgovornosti (PDF) sa imenom, JMBG-om i brojem pasoša"
          >
            <FileIcon className="h-4 w-4 text-ink-3" />
            Izjava o odgovornosti
          </Button>

          <button
            type="button"
            onClick={handlePaymentSlipClick}
            aria-disabled={!hasSignedContract}
            title={
              hasSignedContract
                ? "Instrukcije i nalog za uplatu sa NBS IPS QR kodom"
                : "Ugovor mora biti potpisan i okačen pre uplate"
            }
            className={buttonCls({
              variant: "outline",
              size: "sm",
              className: hasSignedContract ? "" : "cursor-not-allowed opacity-50",
            })}
          >
            <UploadIcon className="h-4 w-4 rotate-180 text-ink-3" />
            Uplatnica
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvoicesModal(true)}
            title="Računi i fakture iz Knjige izdatih računa (KIR)"
          >
            <ReceiptIcon className="h-4 w-4 text-ink-3" />
            Moji računi
            {candidateInvoices.length > 0 && (
              <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular-nums text-ink-2">{candidateInvoices.length}</span>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowDs160Modal(true)}>
            DS-160 upitnik
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-xs",
                ds160.isComplete
                  ? "bg-emerald-100 text-emerald-800"
                  : ds160.isStarted
                  ? "bg-amber-100 text-amber-800"
                  : "bg-surface-2 text-ink-3"
              )}
            >
              {ds160.isComplete
                ? "Popunjen"
                : ds160.isStarted
                ? `${ds160.filledCount}/${ds160.totalCount}`
                : "Nije popunjen"}
            </span>
          </Button>
        </div>

        {uploadToast && (
          <div role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            {uploadToast}
          </div>
        )}

        {/* Koraci (ujedno filter prikaza) */}
        <nav aria-label={t("dash.appStatus")} className="mt-10">
          <div className="no-scrollbar -mx-5 flex gap-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {steps.map((s) => (
              <StepTab key={s.id} {...s} active={activeStepTab === s.id} onClick={() => setActiveStepTab(s.id)} />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() =>
                setActiveStepTab(activeStepTab === "all" ? steps.find((s) => s.state !== "done")?.id || "step3" : "all")
              }
              className="text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              {activeStepTab === "all" ? "Prikaži samo aktivan korak" : "Prikaži sve korake"}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
