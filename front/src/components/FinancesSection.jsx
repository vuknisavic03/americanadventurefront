import React, { useState, useMemo } from "react";
import { getCandidates } from "../data/candidateStore";
import {
  getInvoices,
  updateInvoiceStatus,
  cancelInvoice,
  exportKirToCsv,
  formatRsd,
  formatEur,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  AGENCY_INFO,
} from "../data/invoicesStore";
import InvoiceModal from "./InvoiceModal";
import NewInvoiceModal from "./NewInvoiceModal";

export default function FinancesSection({ candidates: propCandidates = [] }) {
  const candidates = propCandidates.length ? propCandidates : getCandidates();
  const [invoices, setInvoices] = useState(getInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [toast, setToast] = useState("");

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  // Finansijski KPI proračun
  const stats = useMemo(() => {
    let totalBilledRsd = 0;
    let totalPaidRsd = 0;
    let totalPendingRsd = 0;
    let totalPkzRsd = 0;
    let totalPaidEur = 0;

    invoices.forEach((inv) => {
      if (inv.status === "CANCELLED") return;
      const rsd = Number(inv.totalRsd) || 0;
      totalBilledRsd += rsd;

      if (inv.status === "PAID") {
        totalPaidRsd += rsd;
        if (inv.currency === "EUR") totalPaidEur += Number(inv.originalAmount) || 0;
      } else if (inv.status === "PENDING") {
        totalPendingRsd += rsd;
      } else if (inv.status === "PKZ_DEFERRED") {
        totalPkzRsd += rsd;
      }
    });

    return {
      totalBilledRsd,
      totalPaidRsd,
      totalPendingRsd,
      totalPkzRsd,
      totalPaidEur,
      count: invoices.length,
    };
  }, [invoices]);

  // Filtrirane fakture
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
      if (serviceFilter !== "ALL" && inv.serviceType !== serviceFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchName = inv.candidateName?.toLowerCase().includes(q);
        const matchJmbg = inv.candidateJmbg?.toLowerCase().includes(q);
        const matchPurpose = inv.purpose?.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchJmbg && !matchPurpose) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, serviceFilter, search]);

  const handleStatusChange = (id, newStatus, reason = "") => {
    if (newStatus === "CANCELLED") {
      const updated = cancelInvoice(id, reason);
      setInvoices([...updated]);
      showToastMsg(`✓ Faktura uspešno stornirana.`);
    } else {
      const updated = updateInvoiceStatus(id, newStatus);
      setInvoices([...updated]);
      showToastMsg(`✓ Status fakture uspešno promenjen u: ${PAYMENT_STATUSES[newStatus]?.label || newStatus}`);
    }
    if (selectedInvoice && selectedInvoice.id === id) {
      const refreshed = getInvoices().find((i) => i.id === id);
      setSelectedInvoice(refreshed);
    }
  };

  const handleCreated = (newInv) => {
    setInvoices(getInvoices());
    showToastMsg(`✓ Uspešno izdata i zavedena nova faktura: ${newInv.invoiceNumber}`);
    setSelectedInvoice(newInv);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifikacija */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <span>{toast}</span>
        </div>
      )}

      {/* Header sekcije */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs font-black text-sm">
              KIR
            </span>
            <h1 className="text-2xl font-black tracking-tight text-[var(--brand-ink)]">
              Knjiga izdatih računa (KIR) & Finansije
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--brand-ink)]/65">
            Zvanična evidencija izdatih faktura, obračun po srednjem kursu NBS, IPS QR nalozi i izvoz za knjigovodstvo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportKirToCsv(filteredInvoices)}
            className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-black/[0.04] transition-colors"
          >
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Eksportuj KIR (Excel / CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-black/[0.04] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Štampaj knjigu</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>Izdaj novu fakturu</span>
          </button>
        </div>
      </div>

      {/* KPI finansijske kartice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500">
            <span>Ukupno fakturisano</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 font-bold">KIR</span>
          </div>
          <div className="mt-2 text-xl font-black text-slate-950 font-mono">
            {formatRsd(stats.totalBilledRsd)}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Ukupno zavedeno: <strong>{stats.count} faktura</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-emerald-800">
            <span>Naplaćeno (Realizacija)</span>
            <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] text-emerald-950 font-bold">IZVOD</span>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-950 font-mono">
            {formatRsd(stats.totalPaidRsd)}
          </div>
          <p className="mt-1 text-xs text-emerald-800 font-semibold">
            Likvidirano u devizama: <strong>{formatEur(stats.totalPaidEur)}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-amber-800">
            <span>Potraživanja na čekanju</span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] text-amber-950 font-bold">ROK 7 DANA</span>
          </div>
          <div className="mt-2 text-xl font-black text-amber-950 font-mono">
            {formatRsd(stats.totalPendingRsd)}
          </div>
          <p className="mt-1 text-xs text-amber-800 font-medium">
            Izdate uplatnice sa IPS QR kodom
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-blue-800">
            <span>PKZ Odloženo (SAD)</span>
            <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] text-blue-950 font-bold">ZARADE</span>
          </div>
          <div className="mt-2 text-xl font-black text-blue-950 font-mono">
            {formatRsd(stats.totalPkzRsd)}
          </div>
          <p className="mt-1 text-xs text-blue-800 font-medium">
            Otplata kroz III ratu tokom leta u SAD
          </p>
        </div>
      </div>

      {/* Filteri i pretraga */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraga po broju računa (FAKT-), kandidatu, JMBG-u, svrsi..."
              className="w-full rounded-xl border border-black/15 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Status:</span>
            {[
              ["ALL", "Sve"],
              ["PAID", "Plaćeno"],
              ["PENDING", "Na čekanju"],
              ["PKZ_DEFERRED", "PKZ Model"],
              ["CANCELLED", "Stornirano"],
            ].map(([st, lbl]) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-black/[0.05]">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Vrsta uplate:</span>
          {[
            ["ALL", "Sve usluge"],
            ["RATE_1", "I Rata"],
            ["RATE_2", "II Rata"],
            ["RATE_3", "III Rata"],
            ["VISA_FEE", "MRV Viza ($185)"],
            ["TRANSLATION", "Prevod"],
          ].map(([sv, lbl]) => (
            <button
              key={sv}
              type="button"
              onClick={() => setServiceFilter(sv)}
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                serviceFilter === sv
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "bg-black/[0.04] text-slate-600 hover:bg-black/[0.07]"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* KIR Tabela izdatih računa */}
      <div className="rounded-2xl border border-black/[0.08] bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-black/[0.08] bg-slate-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-700">
              Zvanični registar KIR (Knjiga izdatih računa)
            </span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              {filteredInvoices.length} računa
            </span>
          </div>
          <span className="text-xs text-slate-500 italic">
            * Stopa PDV: 0% oslobođeno po čl. 24. stav 1. tačka 1. ZPDV
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 bg-slate-100/70 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-3 px-3 text-center w-10">R.br</th>
                <th className="py-3 px-3">Broj računa</th>
                <th className="py-3 px-3">Datum prometa</th>
                <th className="py-3 px-3">Kupac (Student)</th>
                <th className="py-3 px-3">Svrha / Usluga</th>
                <th className="py-3 px-3 text-right">Devizni iznos</th>
                <th className="py-3 px-3 text-right">NBS Kurs</th>
                <th className="py-3 px-3 text-right">Osnovica (RSD)</th>
                <th className="py-3 px-3 text-right font-black">Ukupno RSD</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400">
                    Nema faktura u izabranoj pretrazi.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const st = PAYMENT_STATUSES[inv.status] || { label: inv.status, badgeCls: "bg-gray-100" };
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-slate-900 whitespace-nowrap">
                        <span className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        {inv.deliveryDate}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{inv.candidateName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {inv.candidateJmbg || inv.candidateCity || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate" title={inv.purpose}>
                        <div className="font-semibold text-slate-800 truncate">{inv.purpose}</div>
                        <div className="text-[10px] text-slate-500">
                          {PAYMENT_METHODS[inv.paymentMethod] || inv.paymentMethod}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {inv.currency === "EUR" ? formatEur(inv.originalAmount) : `${inv.originalAmount} USD`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {Number(inv.exchangeRate).toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {formatRsd(inv.vatBaseRsd)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-900 whitespace-nowrap">
                        {formatRsd(inv.totalRsd)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black border ${st.badgeCls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Pregledaj i odštampaj fakturu"
                            onClick={() => setSelectedInvoice(inv)}
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {inv.status === "PENDING" && (
                            <button
                              type="button"
                              title="Proknjiži uplatu"
                              onClick={() => handleStatusChange(inv.id, "PAID")}
                              className="rounded-lg bg-emerald-50 border border-emerald-300 p-1.5 text-emerald-800 hover:bg-emerald-100 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pravna napomena na dnu */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
        <span className="text-base">ℹ️</span>
        <div className="space-y-1">
          <p className="font-bold text-slate-800">
            Pravno-računovodstveni standardi agencije:
          </p>
          <p>
            {AGENCY_INFO.taxNote} Sve devizne uplate preračunavaju se na dan izdavanja računa po zvaničnom srednjem kursu Narodne banke Srbije (NBS) sa 6 decimala u skladu sa Zakonom o deviznom poslovanju Republike Srbije.
          </p>
        </div>
      </div>

      {/* Modali */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        isAdmin={true}
        onStatusChange={handleStatusChange}
      />

      <NewInvoiceModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        candidates={candidates}
        onCreated={handleCreated}
      />
    </div>
  );
}
