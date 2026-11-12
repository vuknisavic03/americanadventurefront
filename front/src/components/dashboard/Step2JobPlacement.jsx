// front/src/components/dashboard/Step2JobPlacement.jsx
import { useState, useEffect } from "react";
import { BriefcaseIcon, ReceiptIcon } from "./icons";
import { getOfferedJobsForCandidate } from "../../data/jobsStore";
import { formatRsdAmount, getCurrentNbsRate, fetchCurrentNbsRate, generateNbsIpsString } from "../../data/invoicesStore";
import { openPrintablePaymentSlipWindow } from "../../data/candidateStore";

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
    <section className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-xs sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm shadow-xs">
            2
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                KORAK 2
              </span>
              <h2 className="text-base sm:text-lg font-black text-[var(--brand-ink)]">
                {isFull
                  ? "Pronalaženje posla, Intervju sa poslodavcem & Job Offer"
                  : "Pronalaženje posla, Intervju sa poslodavcem & II Rata"}
              </h2>
            </div>
            <p className="text-xs text-[var(--brand-ink)]/65 mt-0.5">
              {isFull
                ? "Izbor radne ponude u SAD, intervju sa američkim poslodavcem i potpisivanje Job Offer ugovora."
                : "Izbor radne ponude u SAD, intervju sa američkim poslodavcem, potpisivanje Job Offer ugovora i uplata II rate."}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3.5 py-1 text-xs font-bold ${
            isStep2Done
              ? "bg-green-100 text-green-900 border border-green-300"
              : isSecondInstallmentPending
              ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
              : hasConfirmedJob
              ? "bg-blue-100 text-blue-900 border border-blue-300"
              : !isDocumentsApproved
              ? "bg-slate-100 text-slate-700 border border-slate-300"
              : appStatus === "SCHEDULED"
              ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
              : appStatus === "NO_SLOTS" || appStatus === "REJECTED"
              ? "bg-red-100 text-red-900 border border-red-300"
              : appStatus === "APPLIED"
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : "bg-blue-100 text-blue-900 border border-blue-300"
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
      </div>

      {/* Gate upozorenje ako dosije iz Koraka 1 nije odobren */}
      {!isDocumentsApproved && (
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950">
          <div>
            <p className="font-bold text-amber-950 text-sm">
              Korak 2 je zaključan: Čeka se odobrenje dosijea od strane sponzora
            </p>
            <p className="text-amber-900/80 mt-0.5">
              Da biste mogli da se prijavite za ponuđeni posao i zakažete intervju sa američkim poslodavcima, koordinator i ovlašćeni sponzor moraju prvo da odobre vaš dosije iz Koraka 1.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-[11px] font-black text-amber-900">
            Potreban Korak 1
          </span>
        </div>
      )}

      {/* Glavni sadržaj Koraka 2 */}
      <div className="mt-3.5 space-y-3">
        {/* Podkorak 2.1: Baza poslova & Izbor ponude */}
        <div className="rounded-xl border border-black/10 bg-slate-50 p-4 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Ponuđeni poslovi u SAD & Intervju sa poslodavcem
              </h4>
              <p className="text-slate-600 mt-0.5">
                Pregledajte radne ponude koje vam je koordinator agencije dodelio i pošaljite prijavu za poziciju koja vam najviše odgovara.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowJobFairModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-100 transition-colors shrink-0"
            >
              <span>Pregledaj ponudu poslova ({offeredJobs.length})</span>
            </button>
          </div>

          {/* Dinamički prikaz statusa izbora posla */}
          {!hasSelectedJob ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center">
              <p className="font-bold text-slate-700">
                Još uvek niste izabrali radnu poziciju iz ponude.
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Dostupno vam je {offeredJobs.length} ponuda poslodavaca u SAD. Kliknite na dugme iznad da otvorite katalog.
              </p>
              <button
                type="button"
                onClick={() => setShowJobFairModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                <span>Izaberi posao iz ponude</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Detalji izabranog posla */}
              <div className="rounded-xl border border-blue-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">
                    Izabrano radno mesto
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {candidate.selectedJobTitle} — {candidate.selectedJobEmployer}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                    <span>Lokacija: <strong>{candidate.selectedJobCity || "SAD"}</strong></span>
                    <span>Satnica: <strong>{candidate.selectedJobWage || "Po ugovoru"}</strong></span>
                    <span>Smeštaj: <strong>{candidate.selectedJobHousing || "Obezbeđen"}</strong></span>
                  </div>
                </div>

                {!hasConfirmedJob && (
                  <button
                    type="button"
                    onClick={() => setShowJobFairModal(true)}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0"
                  >
                    Promeni izbor posla
                  </button>
                )}
              </div>

              {/* Status 1: Prijava poslata */}
              {appStatus === "APPLIED" && !hasConfirmedJob && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wide bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      Prijava evidentirana
                    </span>
                    <span className="text-xs font-bold">Čeka se zakazivanje intervjua od strane agencije</span>
                  </div>
                  <p className="text-xs text-amber-900/80 mt-1">
                    Vaša prijava za poziciju {candidate.selectedJobTitle} je prosleđena koordinatoru agencije. Koordinator trenutno usklađuje slobodne termine sa poslodavcem i poslaće vam tačan termin i link za razgovor.
                  </p>
                </div>
              )}

              {/* Status 2: Intervju zakazan */}
              {appStatus === "SCHEDULED" && !hasConfirmedJob && (
                <div className="rounded-xl border border-indigo-300 bg-indigo-50 p-3.5 text-indigo-950 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-xs uppercase tracking-wide bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-full">
                      Termin intervjua zakazan
                    </span>
                    <span className="text-xs font-extrabold text-indigo-900">
                      Termin: {candidate.interviewScheduledAt || "Uskoro"}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-900/90 space-y-1 pt-1">
                    <p>Format razgovora: <strong>{candidate.interviewType === "IN_PERSON" ? "Uživo u agenciji" : "Online razgovor (Zoom / Google Meet)"}</strong></p>
                    {candidate.interviewLink && (
                      <p>Link za pristup: <a href={candidate.interviewLink} target="_blank" rel="noreferrer" className="text-blue-700 underline font-bold">{candidate.interviewLink}</a></p>
                    )}
                    {candidate.interviewNote && (
                      <p className="bg-white/80 border border-indigo-200 rounded-lg p-2.5 text-slate-800 mt-1">
                        Instrukcije koordinatora: <strong>{candidate.interviewNote}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status 3: Nema slobodnih termina */}
              {appStatus === "NO_SLOTS" && !hasConfirmedJob && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950 space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wide bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                    Nema slobodnih termina za intervju
                  </span>
                  <p className="text-xs text-amber-950 font-bold">
                    Poslodavac {candidate.selectedJobEmployer} trenutno nema raspoloživih termina za razgovor za poziciju {candidate.selectedJobTitle}.
                  </p>
                  {candidate.interviewNote && (
                    <p className="text-xs text-amber-900 bg-white/70 border border-amber-200 rounded-lg p-2">
                      Napomena agencije: {candidate.interviewNote}
                    </p>
                  )}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowJobFairModal(true)}
                      className="rounded-lg bg-amber-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-black transition-colors"
                    >
                      Izaberi drugi posao iz ponude
                    </button>
                  </div>
                </div>
              )}

              {/* Status 4: Poslodavac odbio kandidata */}
              {appStatus === "REJECTED" && !hasConfirmedJob && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-red-950 space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wide bg-red-200 text-red-900 px-2.5 py-0.5 rounded-full">
                    Poslodavac nije prihvatio kandidata
                  </span>
                  <p className="text-xs text-red-950 font-bold">
                    Nakon obavljenog intervjua, poslodavac {candidate.selectedJobEmployer} vas nije odabrao za poziciju {candidate.selectedJobTitle}.
                  </p>
                  {candidate.interviewNote && (
                    <p className="text-xs text-red-900 bg-white/70 border border-red-200 rounded-lg p-2">
                      Obrazloženje: {candidate.interviewNote}
                    </p>
                  )}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowJobFairModal(true)}
                      className="rounded-lg bg-red-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-black transition-colors"
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
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2.5">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              Zvanični Job Offer radni ugovor & Prihvatanje
            </h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                hasConfirmedJob
                  ? "bg-green-100 text-green-900 border border-green-300"
                  : "bg-black/10 text-black/50"
              }`}
            >
              {hasConfirmedJob ? "Job Offer prihvaćen" : "Čeka potvrdu poslodavca"}
            </span>
          </div>

          {hasConfirmedJob ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full inline-block">
                  Ugovor o radu zvanično potvrđen
                </span>
                <h4 className="font-black text-sm text-emerald-950 mt-1">
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
                  className="rounded-lg border border-emerald-300 bg-white px-3.5 py-2 font-bold text-emerald-950 hover:bg-emerald-100 shadow-2xs"
                >
                  Pregledaj Job Offer (PDF)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[var(--brand-ink)]/60">
              Nakon što obavite intervju i poslodavac potvrdi vaš angažman, ovde ćete digitalno potpisati svoj zvanični Job Offer dokument.
            </div>
          )}
        </div>

        {/* Podkorak 2.3: Status finansijskih obaveza (Uplata u celosti ili Uplata II rate) */}
        {isFull || candidate.isFullPaymentPaid ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200 pb-2">
              <div>
                <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  Program uplaćen u celosti
                </span>
                <h4 className="font-extrabold text-sm text-emerald-950 mt-1">
                  Finansijske obaveze za II ratu su izmirene
                </h4>
                <p className="text-[11px] text-emerald-900/80 mt-0.5">
                  Izabrali ste uplatu programa u celosti prilikom registracije. Nemate obavezu uplate II rate programa.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-900">
                Oslobođeno II rate
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <p className="text-emerald-950 font-medium">
                Nakon što poslodavac odobri ponudu i potpišete Job Offer, automatski stičete pravo prelaska na Korak 3 (Viza i DS-2019).
              </p>
              <button
                type="button"
                onClick={() => setShowInvoicesModal(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <ReceiptIcon className="h-3.5 w-3.5 text-emerald-700" />
                <span>Moji računi / KIR</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2">
              <div>
                <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
                  Uplata II rate programa ({rate2EurAmount} EUR) & Primer uplatnice
                </h4>
                <p className="text-[11px] text-[var(--brand-ink)]/65 mt-0.5">
                  Druga rata se uplaćuje u dinarskoj protivvrednosti po zvaničnom srednjem kursu NBS na dan uplate.
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                  isSecondInstallmentPaid
                    ? "bg-green-100 text-green-900 border border-green-300"
                    : isSecondInstallmentPending
                    ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                    : hasConfirmedJob
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-black/10 text-black/50"
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
            <div className="rounded-2xl border-2 border-[#b32d2e]/35 bg-[#fffdfd] p-3.5 sm:p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#b32d2e]/20 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-[#b32d2e]">
                    Nalog za uplatu (Primer uplatnice)
                  </span>
                  <span className="rounded-md bg-[#b32d2e]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#b32d2e]">
                    Obrazac br. 1
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    Srednji kurs NBS: <strong className="font-mono text-slate-900">{Number(nbsRate).toFixed(4)} RSD</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => openPrintablePaymentSlipWindow({ id: candidate.id, email: candidate.email, type: "rate2", customRate: nbsRate })}
                    className="rounded-lg bg-[#b32d2e] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#922425] transition-colors"
                  >
                    Odštampaj uplatnicu / Snimi PDF
                  </button>
                </div>
              </div>

              {/* Polja uplatnice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Leva polja */}
                <div className="space-y-2.5">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                      Uplatilac
                    </span>
                    <div className="rounded-lg border border-slate-300 bg-white p-2.5 font-medium text-slate-800 min-h-[52px]">
                      <div className="font-bold text-slate-950">
                        {candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Student Kandidat"}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {candidate.address || candidate.homeAddress || candidate.studyCity || "Srbija"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                      Svrha uplate
                    </span>
                    <div className="rounded-lg border border-slate-300 bg-white p-2.5 font-medium text-slate-800 min-h-[48px]">
                      <div className="font-bold text-slate-900">
                        Uplata II rate programa — Work & Travel USA 2026
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Pozicija: {candidate.selectedJobTitle || "Radna ponuda"} ({candidate.selectedJobEmployer || "Poslodavac u SAD"})
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                      Primalac
                    </span>
                    <div className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 min-h-[52px]">
                      <div className="font-bold text-slate-950">American Adventure d.o.o.</div>
                      <div className="text-[11px] text-slate-600">Gospodar Jevremova 59/4, 11000 Beograd</div>
                      <div className="text-[10px] text-slate-500 font-mono">PIB: 105311717 | MB: 20356090</div>
                    </div>
                  </div>
                </div>

                {/* Desna polja */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                        Šifra pl.
                      </span>
                      <div className="rounded-lg border border-slate-300 bg-white py-2 px-2 text-center font-mono font-bold text-slate-900">
                        189
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                        Valuta
                      </span>
                      <div className="rounded-lg border border-slate-300 bg-white py-2 px-2 text-center font-mono font-bold text-slate-900">
                        RSD
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                        Iznos
                      </span>
                      <div className="rounded-lg border-2 border-[#b32d2e] bg-white py-1.5 px-2 text-right">
                        <div className="font-mono text-sm sm:text-base font-black text-[#b32d2e] whitespace-nowrap">
                          = {rate2RsdAmount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                      Račun primaoca
                    </span>
                    <div className="rounded-lg border border-slate-300 bg-white p-2 text-center font-mono font-extrabold text-sm tracking-wider text-slate-950">
                      160-6000000728717-84
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                        Model
                      </span>
                      <div className="rounded-lg border border-slate-300 bg-white py-2 px-2 text-center font-mono font-bold text-slate-900">
                        97
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                        Poziv na broj (odobrenje)
                      </span>
                      <div className="rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-slate-900 text-center tracking-wide">
                        AA-2026-R2-{candShortId}
                      </div>
                    </div>
                  </div>

                  {/* Prikaz zvaničnog NBS IPS QR koda za instant mobilno plaćanje */}
                  <div className="rounded-xl border border-slate-300 bg-white p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-1 text-slate-700 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                          NBS IPS QR
                        </span>
                        <span className="text-xs font-bold text-slate-950">
                          Instant plaćanje mobilnim telefonom
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Automatski obračun: <strong>{rate2EurAmount},00 EUR × {Number(nbsRate).toFixed(4)} = {rate2RsdAmount} RSD</strong>.
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Skenirajte kod opcijom IPS Pokaži/Skeniraj iz m-bankinga za automatski popunjene podatke.
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=2&data=${encodeURIComponent(ipsPayload)}`}
                        alt="NBS IPS QR Kod"
                        className="h-24 w-24 rounded-lg border border-slate-200 shadow-2xs"
                        loading="lazy"
                      />
                      <span className="mt-1 font-mono text-[9px] font-bold text-slate-500">
                        Model 97 AA-2026-R2-{candShortId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dugmad akcija ispod uplatnice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
              <p className="text-[var(--brand-ink)]/70">
                Nakon uplate, prijavite izvršenu transakciju kako bi je koordinator agencije odmah proknjižio.
              </p>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {hasConfirmedJob && !isSecondInstallmentPaid && !isSecondInstallmentPending && (
                  <button
                    type="button"
                    onClick={handleReportSecondInstallment}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    Prijavi uplatu II rate ({rate2RsdAmount} RSD)
                  </button>
                )}
                {isSecondInstallmentPending && (
                  <span className="rounded-lg bg-amber-100 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-900">
                    Uplata II rate je prijavljena — čeka se knjiženje agencije
                  </span>
                )}
                {isSecondInstallmentPaid && (
                  <span className="rounded-lg bg-emerald-100 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-900">
                    II rata je proknjižena i odobrena
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowInvoicesModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-bold text-[var(--brand-ink)] hover:bg-black/5 transition-colors shadow-2xs"
                >
                  <ReceiptIcon className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Moji računi / KIR</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
