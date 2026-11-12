// front/src/components/dashboard/Step2JobPlacement.jsx
import { useState, useEffect } from "react";
import { ReceiptIcon } from "./icons";
import { getOfferedJobsForCandidate } from "../../data/jobsStore";
import { formatRsdAmount, getCurrentNbsRate, fetchCurrentNbsRate, generateNbsIpsString } from "../../data/invoicesStore";
import { openPrintablePaymentSlipWindow } from "../../data/candidateStore";

import { StepShell } from "./ui";

export default function Step2JobPlacement({
  candidate,
  status,
  isDocumentsApproved,
  isStep2Done,
  hasConfirmedJob,
  isSecondInstallmentPaid,
  isSecondInstallmentPending,
  handleReportSecondInstallment,
  handleConfirmSecondInstallment,
  setShowJobFairModal,
  setShowJobOfferModal,
  setShowInvoicesModal,
  handleAcceptJobOffer,
  updateCandidateState,
  setUploadToast,
}) {
  const offeredJobs = getOfferedJobsForCandidate(candidate);
  const appStatus = candidate.jobApplicationStatus || (candidate.jobOfferSignedAt || (candidate.hasJob && candidate.jobApplicationStatus === "ACCEPTED") ? "ACCEPTED" : candidate.selectedJobEmployer ? "APPLIED" : "NONE");
  const hasSelectedJob = Boolean(candidate.selectedJobTitle || candidate.selectedJobEmployer);

  const [nbsRate, setNbsRate] = useState(() => getCurrentNbsRate("EUR"));

  useEffect(() => {
    let active = true;
    fetchCurrentNbsRate("EUR").then((rate) => {
      if (active && rate) setNbsRate(rate);
    });
    return () => {
      active = false;
    };
  }, []);

  const isFull = candidate.paymentMethod === "now";
  const rate2EurAmount = Number(candidate.secondInstallmentAmount) || 400;
  const lockedRate2Rsd = candidate.secondInstallmentPaidRsd;
  const rate2RsdAmount = lockedRate2Rsd
    ? lockedRate2Rsd.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : formatRsdAmount(rate2EurAmount, nbsRate, "EUR");
  const candShortId = String(candidate.id || "1042").replace(/[^0-9]/g, "").slice(-4) || "1042";
  const ipsPayload = generateNbsIpsString({
    account: "160600000072871784",
    recipient: "American Adventure d.o.o. Beograd",
    amountRsd: rate2RsdAmount,
    payer: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Student Kandidat",
    code: "289",
    purpose: `Uplata II rate SWT ${candidate.selectedJobEmployer || ""}`.trim().slice(0, 35),
    model: "97",
    reference: `AA2026R2${candShortId}`,
  });

  return (
    <StepShell
      index="2"
      state={isStep2Done ? "done" : !isDocumentsApproved ? "locked" : "current"}
      kicker="Korak 2"
      title={isFull ? "Posao, intervju i Job Offer" : "Posao, intervju i II rata"}
      description={
        isFull
          ? "Izbor radne ponude u SAD, intervju sa američkim poslodavcem i potpisivanje Job Offer ugovora."
          : "Izbor radne ponude u SAD, intervju sa američkim poslodavcem, potpisivanje Job Offer ugovora i uplata II rate."
      }
      status={
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${
              isStep2Done
                ? "bg-emerald-100 text-emerald-800"
                : isSecondInstallmentPending
                ? "bg-amber-100 text-amber-800"
                : hasConfirmedJob
                ? "bg-surface-2 text-ink"
                : !isDocumentsApproved
                ? "bg-surface-2 text-ink-2"
                : appStatus === "SCHEDULED"
                ? "bg-surface-2 text-ink"
                : appStatus === "NO_SLOTS" || appStatus === "REJECTED"
                ? "bg-red-100 text-red-700"
                : appStatus === "APPLIED"
                ? "bg-amber-100 text-amber-800"
                : "bg-surface-2 text-ink"
            }`}
          >
            {isStep2Done
              ? isFull
                ? "Posao potvrđen • Spreman za viziranje"
                : "Posao potvrđen & II rata izmirena"
              : isSecondInstallmentPending
              ? "Čeka se proknjižavanje II rate"
              : hasConfirmedJob
              ? isFull
                ? "Job Offer potpisan • Spreman za viziranje"
                : "Job Offer potpisan - Čeka II ratu"
              : !isDocumentsApproved
              ? "Zaključano do odobrenja dosijea"
              : appStatus === "SCHEDULED"
              ? "Intervju zakazan"
              : appStatus === "NO_SLOTS"
              ? "Nema termina za intervju"
              : appStatus === "REJECTED"
              ? "Poslodavac odbio kandidata"
              : appStatus === "APPLIED"
              ? "Prijava poslata koordinatoru"
              : "Katalog poslova otvoren"}
          </span>
      }
    >

      {/* Gate upozorenje ako dosije iz Koraka 1 nije odobren */}
      {!isDocumentsApproved && (
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3.5 text-[13px] text-amber-900 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-amber-950 text-sm">
              Korak 2 je zaključan: Čeka se odobrenje dosijea od strane sponzora
            </p>
            <p className="text-amber-900/80 mt-0.5">
              Da biste mogli da se prijavite za ponuđeni posao i zakažete intervju sa američkim poslodavcima, koordinator i ovlašćeni sponzor moraju prvo da odobre vaš dosije iz Koraka 1.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900">
            Potreban Korak 1
          </span>
        </div>
      )}

      {/* Glavni sadržaj Koraka 2 */}
      <div className="space-y-4">
        {/* Podkorak 2.1: Baza poslova & Izbor ponude */}
        <div className="rounded-2xl border border-line bg-white p-5 text-[13px] space-y-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold leading-snug text-ink">
                Ponuđeni poslovi u SAD & Intervju sa poslodavcem
              </h4>
              <p className="text-ink-2 mt-0.5">
                Pregledajte radne ponude koje vam je koordinator agencije dodelio i pošaljite prijavu za poziciju koja vam najviše odgovara.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowJobFairModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 py-2 text-[13px] font-semibold text-ink hover:bg-surface-2 transition-colors shrink-0"
            >
              <span>Pregledaj ponudu poslova ({offeredJobs.length})</span>
            </button>
          </div>

          {/* Dinamički prikaz statusa izbora posla */}
          {!hasSelectedJob ? (
            <div className="rounded-xl border border-dashed border-line-strong bg-white p-4 text-center">
              <p className="font-semibold text-ink-2">
                Još uvek niste izabrali radnu poziciju iz ponude.
              </p>
              <p className="text-ink-3 text-[13px] mt-0.5">
                Dostupno vam je {offeredJobs.length} ponuda poslodavaca u SAD. Kliknite na dugme iznad da otvorite katalog.
              </p>
              <button
                type="button"
                onClick={() => setShowJobFairModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-neutral-950"
              >
                <span>Izaberi posao iz ponude</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Detalji izabranog posla */}
              <div className="rounded-xl border border-line bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[13px] font-semibold text-ink block">
                    Izabrano radno mesto
                  </span>
                  <h4 className="text-base font-semibold leading-snug text-ink">
                    {candidate.selectedJobTitle} — {candidate.selectedJobEmployer}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-2">
                    <span>Lokacija: <strong>{candidate.selectedJobCity || "SAD"}</strong></span>
                    <span>Satnica: <strong>{candidate.selectedJobWage || "Po ugovoru"}</strong></span>
                    <span>Smeštaj: <strong>{candidate.selectedJobHousing || "Obezbeđen"}</strong></span>
                  </div>
                </div>

                {!hasConfirmedJob && (
                  <button
                    type="button"
                    onClick={() => setShowJobFairModal(true)}
                    className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-surface-2 shrink-0"
                  >
                    Promeni izbor posla
                  </button>
                )}
              </div>

              {/* Status 1: Prijava poslata */}
              {appStatus === "APPLIED" && !hasConfirmedJob && (
                <div className="rounded-xl bg-amber-50 p-3.5 text-amber-950">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
                      Prijava evidentirana
                    </span>
                    <span className="text-[13px] font-semibold">Čeka se zakazivanje intervjua od strane agencije</span>
                  </div>
                  <p className="text-[13px] text-amber-900/80 mt-1">
                    Vaša prijava za poziciju {candidate.selectedJobTitle} je prosleđena koordinatoru agencije. Koordinator trenutno usklađuje slobodne termine sa poslodavcem i poslaće vam tačan termin i link za razgovor.
                  </p>
                </div>
              )}

              {/* Status 2: Intervju zakazan */}
              {appStatus === "SCHEDULED" && !hasConfirmedJob && (
                <div className="rounded-2xl border border-line bg-white p-5 text-ink space-y-2 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-xs bg-neutral-200 text-ink px-3 py-1 rounded-full">
                      Termin intervjua zakazan
                    </span>
                    <span className="text-[13px] font-bold text-ink">
                      Termin: {candidate.interviewScheduledAt || "Uskoro"}
                    </span>
                  </div>
                  <div className="text-[13px] text-ink space-y-1 pt-1">
                    <p>Format razgovora: <strong>{candidate.interviewType === "IN_PERSON" ? "Uživo u agenciji" : "Online razgovor (Zoom / Google Meet)"}</strong></p>
                    {candidate.interviewLink && (
                      <p>Link za pristup: <a href={candidate.interviewLink} target="_blank" rel="noreferrer" className="text-ink underline font-semibold">{candidate.interviewLink}</a></p>
                    )}
                    {candidate.interviewNote && (
                      <p className="rounded-xl text-ink mt-1 bg-surface px-4 py-3">
                        Instrukcije koordinatora: <strong>{candidate.interviewNote}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status 3: Nema slobodnih termina */}
              {appStatus === "NO_SLOTS" && !hasConfirmedJob && (
                <div className="rounded-xl bg-amber-50 p-3.5 text-amber-950 space-y-2">
                  <span className="font-medium text-xs bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
                    Nema slobodnih termina za intervju
                  </span>
                  <p className="text-[13px] text-amber-950 font-semibold">
                    Poslodavac {candidate.selectedJobEmployer} trenutno nema raspoloživih termina za razgovor za poziciju {candidate.selectedJobTitle}.
                  </p>
                  {candidate.interviewNote && (
                    <p className="text-[13px] text-amber-900 bg-white/70 border border-amber-200 rounded-lg p-2">
                      Napomena agencije: {candidate.interviewNote}
                    </p>
                  )}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowJobFairModal(true)}
                      className="rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-neutral-950 transition-colors"
                    >
                      Izaberi drugi posao iz ponude
                    </button>
                  </div>
                </div>
              )}

              {/* Status 4: Poslodavac odbio kandidata */}
              {appStatus === "REJECTED" && !hasConfirmedJob && (
                <div className="rounded-xl bg-red-50 p-3.5 text-red-950 space-y-2">
                  <span className="font-medium text-xs bg-red-200 text-red-900 px-3 py-1 rounded-full">
                    Poslodavac nije prihvatio kandidata
                  </span>
                  <p className="text-[13px] text-red-950 font-semibold">
                    Nakon obavljenog intervjua, poslodavac {candidate.selectedJobEmployer} vas nije odabrao za poziciju {candidate.selectedJobTitle}.
                  </p>
                  {candidate.interviewNote && (
                    <p className="text-[13px] text-red-900 bg-white/70 border border-red-200 rounded-lg p-2">
                      Obrazloženje: {candidate.interviewNote}
                    </p>
                  )}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowJobFairModal(true)}
                      className="rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-neutral-950 transition-colors"
                    >
                      Izaberi drugu radnu ponudu
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Podkorak 2.2: Zvanični radni ugovor (Job Offer) */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-base font-semibold leading-snug text-ink">
              Zvanični Job Offer radni ugovor & Prihvatanje
            </h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                hasConfirmedJob
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-surface-2 text-ink-3"
              }`}
            >
              {hasConfirmedJob ? "Job Offer prihvaćen" : "Čeka potvrdu poslodavca"}
            </span>
          </div>

          {hasConfirmedJob ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-emerald-50 p-3 text-[13px]">
              <div className="space-y-1">
                <span className="tabular-nums text-xs font-medium text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full inline-block">
                  Ugovor o radu zvanično potvrđen
                </span>
                <h4 className="font-bold text-sm text-emerald-950 mt-1">
                  {candidate.selectedJobTitle || "Radna pozicija"} — {candidate.selectedJobEmployer || "Poslodavac u SAD"}
                </h4>
                <p className="text-emerald-900/80">
                  Lokacija: {candidate.selectedJobCity || "SAD"} • Satnica: <strong>{candidate.selectedJobWage || "Po ugovoru"}</strong> • Smeštaj: <strong>{candidate.selectedJobHousing || "Po ugovoru"}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowJobOfferModal(true)}
                  className="rounded-full border border-emerald-300 bg-white px-3.5 py-2 font-semibold text-emerald-950 hover:bg-emerald-100"
                >
                  Pregledaj Job Offer (PDF)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-ink-3">
              Nakon što obavite intervju i poslodavac potvrdi vaš angažman, ovde ćete digitalno potpisati svoj zvanični Job Offer dokument.
            </div>
          )}
        </div>

        {/* Podkorak 2.3: Status finansijskih obaveza (Uplata u celosti ili Uplata II rate) */}
        {isFull || candidate.isFullPaymentPaid ? (
          <div className="rounded-xl bg-emerald-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[13px] font-bold text-white">
                  Program uplaćen u celosti
                </span>
                <h4 className="font-bold text-sm text-emerald-950 mt-1">
                  Finansijske obaveze za II ratu su izmirene
                </h4>
                <p className="text-[13px] text-emerald-900/80 mt-0.5">
                  Izabrali ste uplatu programa u celosti prilikom registracije. Nemate obavezu uplate II rate programa.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                Oslobođeno II rate
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] pt-1">
              <p className="text-emerald-950 font-medium">
                Nakon što poslodavac odobri ponudu i potpišete Job Offer, automatski stičete pravo prelaska na Korak 3 (Viza i DS-2019).
              </p>
              <button
                type="button"
                onClick={() => setShowInvoicesModal(true)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-3 py-2 text-[13px] font-semibold text-emerald-950 hover:bg-emerald-100 transition-colors"
              >
                <ReceiptIcon className="h-3.5 w-3.5 text-emerald-700" />
                <span>Moji računi / KIR</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-base font-semibold leading-snug text-ink">
                  Uplata II rate programa ({rate2EurAmount} EUR) & Primer uplatnice
                </h4>
                <p className="text-[13px] text-ink-2 mt-0.5">
                  Druga rata se uplaćuje u dinarskoj protivvrednosti po zvaničnom srednjem kursu NBS na dan uplate.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isSecondInstallmentPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : isSecondInstallmentPending
                    ? "bg-amber-100 text-amber-800"
                    : hasConfirmedJob
                    ? "bg-amber-100 text-amber-800"
                    : "bg-surface-2 text-ink-3"
                }`}
              >
                {isSecondInstallmentPaid
                  ? "II rata plaćena"
                  : isSecondInstallmentPending
                  ? "Prijavljena uplata"
                  : "Čeka uplatu"}
              </span>
            </div>

            {/* PRIMER UPLATNICE ZA II RATU SA AUTOMATSKIM DINARSKIM IZNOSOM */}
            <div className="rounded-2xl border-2 border-[#b32d2e]/35 bg-[#fffdfd] p-3.5 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#b32d2e]/20 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-sm text-[#b32d2e]">
                    Nalog za uplatu (Primer uplatnice)
                  </span>
                  <span className="rounded-md bg-[#b32d2e]/10 px-2 py-0.5 tabular-nums text-xs font-semibold text-[#b32d2e]">
                    Obrazac br. 1
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2">
                    Srednji kurs NBS: <strong className="tabular-nums text-ink">{Number(nbsRate).toFixed(4)} RSD</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => openPrintablePaymentSlipWindow({ id: candidate.id, email: candidate.email, type: "rate2", customRate: nbsRate })}
                    className="rounded-full bg-[#b32d2e] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#922425] transition-colors"
                  >
                    Odštampaj uplatnicu / Snimi PDF
                  </button>
                </div>
              </div>

              {/* Polja uplatnice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                {/* Leva polja */}
                <div className="space-y-2.5">
                  <div>
                    <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                      Uplatilac
                    </span>
                    <div className="rounded-lg border border-line-strong bg-white p-2.5 font-medium text-ink min-h-[52px]">
                      <div className="font-semibold text-ink">
                        {candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Student Kandidat"}
                      </div>
                      <div className="text-[13px] text-ink-2">
                        {candidate.address || candidate.homeAddress || candidate.studyCity || "Srbija"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                      Svrha uplate
                    </span>
                    <div className="rounded-lg border border-line-strong bg-white p-2.5 font-medium text-ink min-h-[48px]">
                      <div className="font-semibold text-ink">
                        Uplata II rate programa — Work & Travel USA 2026
                      </div>
                      <div className="text-[13px] text-ink-2">
                        Pozicija: {candidate.selectedJobTitle || "Radna ponuda"} ({candidate.selectedJobEmployer || "Poslodavac u SAD"})
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                      Primalac
                    </span>
                    <div className="rounded-lg border border-line-strong bg-white p-2.5 text-ink min-h-[52px]">
                      <div className="font-semibold text-ink">American Adventure d.o.o.</div>
                      <div className="text-[13px] text-ink-2">Gospodar Jevremova 59/4, 11000 Beograd</div>
                      <div className="text-xs text-ink-3 tabular-nums">PIB: 105311717 | MB: 20356090</div>
                    </div>
                  </div>
                </div>

                {/* Desna polja */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                        Šifra pl.
                      </span>
                      <div className="rounded-lg border border-line-strong bg-white py-2 px-2 text-center tabular-nums font-semibold text-ink">
                        189
                      </div>
                    </div>
                    <div>
                      <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                        Valuta
                      </span>
                      <div className="rounded-lg border border-line-strong bg-white py-2 px-2 text-center tabular-nums font-semibold text-ink">
                        RSD
                      </div>
                    </div>
                    <div>
                      <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                        Iznos
                      </span>
                      <div className="rounded-lg border-2 border-[#b32d2e] bg-white py-1.5 px-2 text-right">
                        <div className="tabular-nums text-sm sm:text-base font-bold text-[#b32d2e] whitespace-nowrap">
                          = {rate2RsdAmount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                      Račun primaoca
                    </span>
                    <div className="rounded-lg border border-line-strong bg-white p-2 text-center tabular-nums font-bold text-sm tracking-wider text-ink">
                      160-6000000728717-84
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                        Model
                      </span>
                      <div className="rounded-lg border border-line-strong bg-white py-2 px-2 text-center tabular-nums font-semibold text-ink">
                        97
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className="block text-[13px] font-semibold text-ink-3 mb-0.5">
                        Poziv na broj (odobrenje)
                      </span>
                      <div className="rounded-lg border border-line-strong bg-white p-2 tabular-nums font-semibold text-ink text-center tracking-wide">
                        AA-2026-R2-{candShortId}
                      </div>
                    </div>
                  </div>

                  {/* Prikaz zvaničnog NBS IPS QR koda za instant mobilno plaćanje */}
                  <div className="rounded-xl border border-line-strong bg-white p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-1 text-ink-2 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-ink px-1.5 py-0.5 text-[13px] font-bold text-white">
                          NBS IPS QR
                        </span>
                        <span className="text-[13px] font-semibold text-ink">
                          Instant plaćanje mobilnim telefonom
                        </span>
                      </div>
                      <p className="text-[13px] text-ink-2">
                        Automatski obračun: <strong>{rate2EurAmount},00 EUR × {Number(nbsRate).toFixed(4)} = {rate2RsdAmount} RSD</strong>.
                      </p>
                      <p className="text-xs text-ink-3">
                        Skenirajte kod opcijom IPS Pokaži/Skeniraj iz m-bankinga za automatski popunjene podatke.
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=2&data=${encodeURIComponent(ipsPayload)}`}
                        alt="NBS IPS QR Kod"
                        className="h-24 w-24 rounded-lg border border-line"
                        loading="lazy"
                      />
                      <span className="mt-1 tabular-nums text-xs font-semibold text-ink-3">
                        Model 97 AA-2026-R2-{candShortId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dugmad akcija ispod uplatnice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] pt-1">
              <p className="text-ink-2">
                Nakon uplate, prijavite izvršenu transakciju kako bi je koordinator agencije odmah proknjižio.
              </p>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {hasConfirmedJob && !isSecondInstallmentPaid && !isSecondInstallmentPending && (
                  <button
                    type="button"
                    onClick={handleReportSecondInstallment}
                    className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-neutral-950 transition-colors"
                  >
                    Prijavi uplatu II rate ({rate2RsdAmount} RSD)
                  </button>
                )}
                {isSecondInstallmentPending && (
                  <span className="rounded-lg bg-amber-100 px-3.5 py-2 text-[13px] font-semibold text-amber-800">
                    Uplata II rate je prijavljena — čeka se knjiženje agencije
                  </span>
                )}
                {isSecondInstallmentPaid && (
                  <span className="rounded-lg bg-emerald-100 px-3.5 py-2 text-[13px] font-semibold text-emerald-800">
                    II rata je proknjižena i odobrena
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowInvoicesModal(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white px-3 py-2 text-[13px] font-semibold text-ink hover:bg-surface-2 transition-colors"
                >
                  <ReceiptIcon className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Moji računi / KIR</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StepShell>
  );
}
