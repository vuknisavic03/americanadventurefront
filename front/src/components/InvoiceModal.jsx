import React, { useState, useEffect, useMemo } from "react";
import {
  AGENCY_INFO,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  formatRsd,
  formatEur,
  numberToWordsSr,
  getInvoicesForCandidate,
  ensureCandidateInstallmentInvoice,
  getCurrentNbsRate,
} from "../data/invoicesStore";
import { openPrintablePaymentSlipWindow } from "../data/candidateStore/documentsExport";

export default function InvoiceModal({
  invoice = null,
  selectedInvoice = null,
  candidate = null,
  isOpen = false,
  onClose = () => {},
  isAdmin = false,
  onStatusChange = () => {},
  onSelectInvoice = () => {},
  onPayInvoice = () => {},
}) {
  if (!isOpen) return null;

  const [currentInvoice, setCurrentInvoice] = useState(invoice || selectedInvoice || null);

  useEffect(() => {
    if (invoice || selectedInvoice) {
      setCurrentInvoice(invoice || selectedInvoice);
    }
  }, [invoice, selectedInvoice]);

  const candidateInvoices = useMemo(() => {
    if (!candidate) return [];
    let list = getInvoicesForCandidate(candidate.id, candidate.email);
    if (list.length === 0) {
      const isFull = candidate.paymentMethod === "now";
      const isPaid = isFull
        ? Boolean(candidate.isFullPaymentPaid)
        : Boolean(candidate.isFirstInstallmentPaid);
      const initial = ensureCandidateInstallmentInvoice(
        candidate,
        isFull ? "FULL" : 1,
        isPaid ? "PAID" : "PENDING"
      );
      if (initial) {
        list = [initial];
      }
    }
    if (candidate.isSecondInstallmentPaid && !list.some((inv) => inv.serviceType === "RATE_2" && inv.status === "PAID")) {
      ensureCandidateInstallmentInvoice(candidate, 2, "PAID");
      list = getInvoicesForCandidate(candidate.id, candidate.email);
    } else if (candidate.isSecondInstallmentPending && !list.some((inv) => inv.serviceType === "RATE_2")) {
      ensureCandidateInstallmentInvoice(candidate, 2, "PENDING");
      list = getInvoicesForCandidate(candidate.id, candidate.email);
    }
    if (candidate.isThirdInstallmentPaid && !list.some((inv) => inv.serviceType === "RATE_3" && inv.status === "PAID")) {
      ensureCandidateInstallmentInvoice(candidate, 3, "PAID");
      list = getInvoicesForCandidate(candidate.id, candidate.email);
    } else if (candidate.isThirdInstallmentPending && !list.some((inv) => inv.serviceType === "RATE_3")) {
      ensureCandidateInstallmentInvoice(candidate, 3, "PENDING");
      list = getInvoicesForCandidate(candidate.id, candidate.email);
    }
    return list;
  }, [candidate]);

  const nbsRate = getCurrentNbsRate();
  const packagePriceEur = Number(candidate?.finalPrice) || Number(candidate?.basePrice) || 1750;
  const isFull = candidate?.paymentMethod === "now";

  let totalPaidEur = 0;
  let totalPaidRsd = 0;

  if (isFull && candidate?.isFullPaymentPaid) {
    totalPaidEur = packagePriceEur;
    totalPaidRsd = Number(candidate?.fullPaymentPaidRsd) || Math.round(packagePriceEur * nbsRate);
  } else {
    if (candidate?.isFirstInstallmentPaid) {
      const r1Eur = Number(candidate?.firstInstallmentAmount) || 250;
      totalPaidEur += r1Eur;
      totalPaidRsd += Number(candidate?.firstInstallmentPaidRsd) || Math.round(r1Eur * nbsRate);
    }
    if (candidate?.isSecondInstallmentPaid) {
      const r2Eur = Number(candidate?.secondInstallmentAmount) || 400;
      totalPaidEur += r2Eur;
      totalPaidRsd += Number(candidate?.secondInstallmentPaidRsd) || Math.round(r2Eur * nbsRate);
    }
    if (candidate?.isThirdInstallmentPaid) {
      const r3Eur = Number(candidate?.thirdInstallmentAmount) || Math.max(0, packagePriceEur - (Number(candidate?.firstInstallmentAmount) || 250) - (Number(candidate?.secondInstallmentAmount) || 400));
      totalPaidEur += r3Eur;
      totalPaidRsd += Number(candidate?.thirdInstallmentPaidRsd) || Math.round(r3Eur * nbsRate);
    }
  }

  const remainingEur = Math.max(0, packagePriceEur - totalPaidEur);
  const remainingRsd = Math.max(0, Math.round(remainingEur * nbsRate));

  const handlePrint = () => {
    window.print();
  };

  const handleOpenSlip = (inv) => {
    let slipType = "rate1";
    if (inv.serviceType === "RATE_FULL" || inv.serviceType === "RATE_0") {
      slipType = "full";
    } else if (inv.serviceType === "RATE_2") {
      slipType = "rate2";
    } else if (inv.serviceType === "RATE_3") {
      slipType = "rate3";
    }
    openPrintablePaymentSlipWindow({
      candidate,
      id: candidate?.id,
      email: candidate?.email,
      type: slipType,
      customRate: inv.exchangeRate || nbsRate,
    });
  };

  // AKO JE IZABRANA SPECIFIČNA FAKTURA, PRIKAZUJEMO ZVANIČAN FORMATIRAN RAČUN (A4)
  if (currentInvoice) {
    const statusInfo = PAYMENT_STATUSES[currentInvoice.status] || {
      label: currentInvoice.status,
      badgeCls: "bg-surface-2 text-ink",
    };

    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-2 sm:p-6 backdrop-blur-xs overflow-y-auto">
        <div className="relative my-4 flex max-h-[94vh] w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl flex-col rounded-2xl bg-white shadow-2xl border border-line overflow-hidden">
          {/* Kontrolni bar (sakriven pri štampi) */}
          <div className="flex flex-wrap items-center justify-between border-b border-line bg-ink px-5 py-3 text-white print:hidden">
            <div className="flex items-center gap-3">
              {candidate && candidateInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentInvoice(null);
                    onSelectInvoice(null);
                  }}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
                >
                  &larr; Nazad na sve račune
                </button>
              )}
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-ink">
                KIR
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{currentInvoice.invoiceNumber}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${statusInfo.badgeCls}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-xs text-neutral-300">
                  Kandidat: {currentInvoice.candidateName} • {currentInvoice.currency} {currentInvoice.originalAmount} (
                  {formatRsd(currentInvoice.totalRsd)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && currentInvoice.status !== "PAID" && (
                <button
                  type="button"
                  onClick={() => onStatusChange(currentInvoice.id, "PAID")}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Proknjiži uplatu
                </button>
              )}

              {isAdmin && currentInvoice.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => {
                    const reason = prompt("Razlog storniranja ovog računa:");
                    if (reason) onStatusChange(currentInvoice.id, "CANCELLED", reason);
                  }}
                  className="rounded-full bg-red-600/80 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Storniraj
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Štampaj / PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-white/10 p-1.5 text-neutral-300 hover:bg-white/20 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Telo računa / A4 papir */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-ink font-sans text-xs sm:text-sm">
            {/* Zaglavlje računa */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-ink pb-6 gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-ink">
                    AMERICAN ADVENTURE
                  </span>
                  <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-bold text-ink">
                    D.O.O. BEOGRAD
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-2 font-medium">
                  {AGENCY_INFO.activity} • Licenca {AGENCY_INFO.licenseNumber}
                </p>
                <p className="text-xs text-ink-2 mt-0.5">
                  {AGENCY_INFO.address}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs font-semibold text-ink-2">
                  <span>PIB: <strong className="tabular-nums text-ink">{AGENCY_INFO.pib}</strong></span>
                  <span>MB: <strong className="tabular-nums text-ink">{AGENCY_INFO.maticniBroj}</strong></span>
                  <span>Račun: <strong className="tabular-nums text-ink">{AGENCY_INFO.bankAccountFormatted}</strong> ({AGENCY_INFO.bankName})</span>
                </div>
              </div>

              <div className="text-left sm:text-right w-full sm:w-auto">
                <span className="inline-block rounded-md bg-surface-2 px-3 py-1 tabular-nums text-[13px] font-bold text-ink">
                  FAKTURA / RAČUN BR:
                </span>
                <h2 className="mt-1 text-2xl font-bold text-ink tabular-nums tracking-tight">
                  {currentInvoice.invoiceNumber}
                </h2>
                <div className="mt-2 space-y-0.5 text-xs text-ink-2">
                  <div>Mesto i datum: <strong>Beograd, {currentInvoice.issueDate}</strong></div>
                  <div>Datum prometa usluga: <strong>{currentInvoice.deliveryDate}</strong></div>
                  <div>Rok za plaćanje: <strong className="text-red-700">{currentInvoice.dueDate}</strong></div>
                  {currentInvoice.paidDate && (
                    <div className="text-emerald-700 font-semibold">Datum naplate: <strong>{currentInvoice.paidDate}</strong></div>
                  )}
                </div>
              </div>
            </div>

            {/* Podaci o kupcu (studentu) & programu */}
            <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-line bg-neutral-50/70 p-4">
              <div>
                <span className="text-xs font-bold text-ink-3">
                  KUPAC (KANDIDAT):
                </span>
                <h3 className="mt-0.5 text-base font-bold text-ink">
                  {currentInvoice.candidateName}
                </h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  {currentInvoice.candidateAddress}, {currentInvoice.candidateCity}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-ink-2">
                  <span>JMBG: <strong className="tabular-nums text-ink">{currentInvoice.candidateJmbg || "—"}</strong></span>
                  <span>Pasoš: <strong className="tabular-nums text-ink">{currentInvoice.candidatePassport || "—"}</strong></span>
                  <span>Email: <strong className="text-ink">{currentInvoice.candidateEmail}</strong></span>
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-line pt-3 md:pt-0 md:pl-4">
                <span className="text-xs font-bold text-ink-3">
                  PROGRAM I USLUGA:
                </span>
                <h4 className="mt-0.5 text-sm font-semibold text-ink">
                  {currentInvoice.programName}
                </h4>
                <p className="text-xs text-ink-2 mt-1">
                  Način plaćanja: <strong>{PAYMENT_METHODS[currentInvoice.paymentMethod] || currentInvoice.paymentMethod}</strong>
                </p>
                <p className="text-xs text-ink-2">
                  Poziv na broj: <strong className="tabular-nums text-ink">Model {AGENCY_INFO.modelNumber} • {currentInvoice.referenceNumber}</strong>
                </p>
              </div>
            </div>

            {/* Tabela stavki računa */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-line-strong bg-neutral-100/80 text-xs font-bold text-ink-2">
                    <th className="py-2.5 px-3 w-10 text-center">R.br.</th>
                    <th className="py-2.5 px-3">Naziv usluge / Opis</th>
                    <th className="py-2.5 px-3 text-right">Iznos ({currentInvoice.currency})</th>
                    <th className="py-2.5 px-3 text-right">NBS Kurs</th>
                    <th className="py-2.5 px-3 text-right">Osnovica (RSD)</th>
                    <th className="py-2.5 px-3 text-center">PDV %</th>
                    <th className="py-2.5 px-3 text-right">Ukupno (RSD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs">
                  <tr>
                    <td className="py-3.5 px-3 text-center tabular-nums font-semibold text-ink-3">1</td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-ink">{currentInvoice.purpose}</p>
                      <p className="text-xs text-ink-3 mt-0.5">
                        Obračun po zvaničnom srednjem kursu Narodne banke Srbije na dan fakturisanja.
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-ink whitespace-nowrap">
                      {currentInvoice.currency === "EUR" ? formatEur(currentInvoice.originalAmount) : `${currentInvoice.originalAmount} USD`}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-ink-2 whitespace-nowrap">
                      {Number(currentInvoice.exchangeRate).toFixed(6)}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-ink whitespace-nowrap">
                      {formatRsd(currentInvoice.vatBaseRsd)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-ink-2">
                      0%*
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-bold text-ink whitespace-nowrap">
                      {formatRsd(currentInvoice.totalRsd)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sumarni rekapitular */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-6 border-t-2 border-ink pt-5">
              <div className="max-w-md space-y-2 text-xs">
                <div>
                  <span className="font-bold uppercase text-ink-2">Iznos slovima:</span>
                  <p className="mt-0.5 font-semibold italic text-ink capitalize bg-surface border border-line rounded-md p-2">
                    {numberToWordsSr(currentInvoice.totalRsd)}
                  </p>
                </div>

                <div className="rounded-md bg-amber-50 p-2.5 text-xs text-amber-950">
                  <strong>* Poreska napomena:</strong> {AGENCY_INFO.taxNote}
                </div>
              </div>

              <div className="w-full md:w-80 space-y-1.5 text-xs bg-white rounded-2xl p-5 border border-line sm:p-6">
                <div className="flex justify-between text-ink-2">
                  <span>Ukupna poreska osnovica:</span>
                  <span className="tabular-nums font-semibold">{formatRsd(currentInvoice.vatBaseRsd)}</span>
                </div>
                <div className="flex justify-between text-ink-2">
                  <span>Iznos PDV-a (0% oslobođeno):</span>
                  <span className="tabular-nums font-semibold">0,00 RSD</span>
                </div>
                <div className="my-2 border-t border-line-strong" />
                <div className="flex justify-between text-base font-bold text-ink">
                  <span>ZA UPLATU (RSD):</span>
                  <span className="tabular-nums text-emerald-700">{formatRsd(currentInvoice.totalRsd)}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-3 font-medium">
                  <span>Ekvivalent u devizama:</span>
                  <span className="tabular-nums">{currentInvoice.currency === "EUR" ? formatEur(currentInvoice.originalAmount) : `${currentInvoice.originalAmount} USD`}</span>
                </div>
              </div>
            </div>

            {/* Instrukcija za uplatu + IPS QR kod NBS */}
            <div className="mt-8 rounded-xl border border-line-strong bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-xs flex-1">
                  <span className="inline-block rounded-md bg-ink px-2 py-0.5 text-xs font-bold text-white">
                    INSTRUKCIJE ZA PLAĆANJE (NBS IPS STANDARD)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-ink-2">
                    <div>
                      Primalac: <strong>{AGENCY_INFO.name}</strong>
                    </div>
                    <div>
                      Tekući račun: <strong className="tabular-nums text-ink">{AGENCY_INFO.bankAccountFormatted}</strong>
                    </div>
                    <div>
                      Svrha uplate: <strong>{currentInvoice.purpose}</strong>
                    </div>
                    <div>
                      Model i poziv na broj: <strong className="tabular-nums text-ink">{AGENCY_INFO.modelNumber} {currentInvoice.referenceNumber}</strong>
                    </div>
                  </div>
                  <p className="text-xs text-ink-3 pt-1">
                    Skeniranjem NBS IPS QR koda u mobilnoj aplikaciji vaše banke svi podaci i tačan dinarski iznos biće automatski popunjeni.
                  </p>
                </div>

                {/* IPS QR grafički boks */}
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-ink bg-white p-3 text-center shrink-0">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="rounded bg-ink px-1 py-0.5 text-2xs font-bold tracking-widest text-white">
                      NBS
                    </span>
                    <span className="text-2xs font-bold text-red-700">
                      IPS QR
                    </span>
                  </div>
                  <div className="relative flex h-28 w-28 items-center justify-center bg-ink p-1.5 rounded-lg">
                    <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white rounded">
                      <div className="bg-ink col-span-2 row-span-2 rounded-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-2xs" />
                      </div>
                      <div className="bg-ink col-span-1 rounded-2xs" />
                      <div className="bg-ink col-span-2 row-span-2 rounded-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-2xs" />
                      </div>
                      <div className="bg-ink col-span-1 rounded-2xs" />
                      <div className="bg-ink col-span-1 rounded-2xs" />
                      <div className="bg-ink col-span-1 rounded-2xs" />
                      <div className="bg-ink col-span-2 row-span-2 rounded-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-2xs" />
                      </div>
                      <div className="bg-ink col-span-1 rounded-2xs" />
                      <div className="bg-ink col-span-2 rounded-2xs" />
                    </div>
                  </div>
                  <span className="mt-1.5 tabular-nums text-2xs font-bold text-ink">
                    {formatRsd(currentInvoice.totalRsd)}
                  </span>
                </div>
              </div>
            </div>

            {/* Potpis & Pečat agencije */}
            <div className="mt-10 flex flex-wrap justify-between items-end border-t border-line pt-6 text-xs text-ink-2">
              <div>
                <p className="italic">
                  Faktura je punovažna bez pečata i potpisa u skladu sa članom 9. Zakona o računovodstvu RS.
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Dokument generisan u American Adventure ERP sistemu
                </p>
              </div>

              <div className="text-center min-w-[200px]">
                <div className="relative inline-block border-b-2 border-ink pb-1 px-8 text-center">
                  <span className="font-serif italic font-semibold text-ink text-sm">
                    American Adventure Finance
                  </span>
                  <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full border-2 border-dashed border-ink p-1 flex items-center justify-center rotate-[-12deg] pointer-events-none opacity-80">
                    <div className="text-xs font-bold text-ink text-center leading-tight">
                      AMERICAN ADVENTURE<br />BEOGRAD
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-xs font-semibold text-ink-3">
                  Za American Adventure d.o.o.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // KANDIDATSKI PREGLED: LISTA SVIH IZDATIH FAKTURA I UPLATNICA
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-2 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-4 flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-line overflow-hidden">
        {/* Kontrolno zaglavlje */}
        <div className="flex flex-wrap items-center justify-between border-b border-line bg-ink px-5 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-xs font-bold text-ink">
              KIR
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Moji računi / Knjiga izdatih računa (KIR)
              </h3>
              <p className="text-xs text-neutral-300">
                {candidate?.name || `${candidate?.firstName || ""} ${candidate?.lastName || ""}`.trim() || "Student Kandidat"} • {candidate?.packageName || "Work & Travel USA 2026"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-1.5 text-neutral-300 hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sadržaj liste sa finansijskim pregledom */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-surface">
          {/* 3 finansijske kartice za kandidata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-white p-3.5">
              <span className="text-xs font-bold text-ink-3">
                Cena programa
              </span>
              <div className="mt-1 tabular-nums text-lg font-bold text-ink">
                {formatEur(packagePriceEur)}
              </div>
              <div className="text-xs text-ink-3 mt-0.5">
                ≈ {formatRsd(Math.round(packagePriceEur * nbsRate))}
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3.5">
              <span className="text-xs font-bold text-emerald-800">
                Ukupno uplaćeno
              </span>
              <div className="mt-1 tabular-nums text-lg font-bold text-emerald-900">
                {formatEur(totalPaidEur)}
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                = {formatRsd(totalPaidRsd)}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-3.5">
              <span className="text-xs font-bold text-amber-800">
                Preostali dug
              </span>
              <div className="mt-1 tabular-nums text-lg font-bold text-amber-950">
                {formatEur(remainingEur)}
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                ≈ {formatRsd(remainingRsd)}
              </div>
            </div>
          </div>

          {/* Lista računa */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold leading-snug text-ink">
                Zvanične fakture i nalozi za plaćanje
              </h4>
              <span className="text-xs text-ink-3 font-medium">
                Ukupno računa: <strong>{candidateInvoices.length}</strong>
              </span>
            </div>

            {candidateInvoices.length === 0 ? (
              <div className="rounded-xl border border-line bg-white p-8 text-center text-ink-2">
                <p className="font-semibold text-sm text-ink">Trenutno nema izdatih računa u bazi.</p>
                <p className="text-xs text-ink-3 mt-1">
                  Vaše fakture se automatski kreiraju prilikom svake prijave ili knjiženja uplate.
                </p>
              </div>
            ) : (
              candidateInvoices.map((inv) => {
                const statusInfo = PAYMENT_STATUSES[inv.status] || {
                  label: inv.status,
                  badgeCls: "bg-surface-2 text-ink border-line-strong",
                };
                const isPaid = inv.status === "PAID";

                return (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-line bg-white p-4 hover:border-line-strong transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums text-sm font-bold text-ink">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium border ${statusInfo.badgeCls}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <h5 className="font-semibold text-xs sm:text-sm text-ink mt-1">
                          {inv.purpose}
                        </h5>
                      </div>

                      <div className="text-right">
                        <div className="tabular-nums text-base font-bold text-ink">
                          {formatEur(inv.originalAmount)}
                        </div>
                        <div className="tabular-nums text-xs font-semibold text-emerald-800 mt-0.5">
                          = {formatRsd(inv.totalRsd)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-line text-xs text-ink-2">
                      <div>
                        Datum izdavanja: <strong className="text-ink">{inv.issueDate}</strong>
                      </div>
                      <div>
                        Rok za uplatu: <strong className="text-ink">{inv.dueDate}</strong>
                      </div>
                      <div>
                        Srednji kurs NBS: <strong className="text-ink tabular-nums">{Number(inv.exchangeRate).toFixed(4)}</strong>
                      </div>
                      <div>
                        Status kursa: <strong className="text-ink">{inv.exchangeRateLocked ? "Zaključan" : "Dnevni"}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
                      <div className="text-xs text-ink-3">
                        {isPaid && inv.paidDate && (
                          <span className="text-emerald-700 font-semibold">
                            Uplaćeno dana: {inv.paidDate}
                          </span>
                        )}
                        {!isPaid && (
                          <span className="text-amber-800 font-medium">
                            Poziv na broj: Model 97 • {inv.referenceNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSlip(inv)}
                          className="rounded-full border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface transition-colors"
                        >
                          Primer uplatnice (IPS QR)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentInvoice(inv);
                            onSelectInvoice(inv);
                          }}
                          className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-ink transition-colors"
                        >
                          Pregledaj zvanični račun
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Podnožje modala */}
        <div className="flex items-center justify-between border-t border-line bg-white px-5 py-3 text-xs text-ink-2">
          <p>
            Svi računi su punovažni u elektronskom obliku u skladu sa Zakonom o računovodstvu RS.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line-strong bg-white px-4 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
