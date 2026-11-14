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
import { PageHeader, PrimaryButton, SecondaryButton, PlusIcon } from "./admin/ui";

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
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl flex items-center gap-2 border border-neutral-700">
          <span>{toast}</span>
        </div>
      )}

      {/* Header sekcije */}
      <PageHeader
        title="Finansije i KIR"
        subtitle="Knjiga izdatih računa: evidencija faktura, obračun po srednjem kursu NBS, IPS QR nalozi i izvoz za knjigovodstvo."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton onClick={() => exportKirToCsv(filteredInvoices)}>Izvezi KIR (CSV)</SecondaryButton>
            <SecondaryButton onClick={() => window.print()}>Štampaj knjigu</SecondaryButton>
            <PrimaryButton onClick={() => setShowNewModal(true)}>
              <PlusIcon />
              Izdaj novu fakturu
            </PrimaryButton>
          </div>
        }
      />

      {/* KPI finansijske kartice */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ukupno fakturisano", value: formatRsd(stats.totalBilledRsd), note: `${stats.count} faktura u knjizi` },
          { label: "Naplaćeno", value: formatRsd(stats.totalPaidRsd), note: `U devizama: ${formatEur(stats.totalPaidEur)}`, dot: "bg-ink" },
          { label: "Potraživanja na čekanju", value: formatRsd(stats.totalPendingRsd), note: "Izdate uplatnice, rok 7 dana", dot: "bg-brand" },
          { label: "PKZ — odloženo (SAD)", value: formatRsd(stats.totalPkzRsd), note: "Otplata kroz III ratu tokom leta" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-white px-5 py-4">
            <p className="flex items-center gap-2 text-[13px] text-ink-3">
              {k.dot && <span className={`h-2 w-2 rounded-full ${k.dot}`} aria-hidden="true" />}
              {k.label}
            </p>
            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-ink">{k.value}</p>
            <p className="mt-1 text-xs text-ink-3">{k.note}</p>
          </div>
        ))}
      </div>

      {/* Filteri i pretraga */}
      <div className="rounded-2xl border border-line bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
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
              className="w-full rounded-xl border border-line-strong bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-3/70 focus:bg-white focus:border-ink focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-ink-3 mr-1">Status:</span>
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
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? "bg-ink text-white"
                    : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line">
          <span className="text-xs font-semibold text-ink-3 mr-1">Vrsta uplate:</span>
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
              className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                serviceFilter === sv
                  ? "bg-ink text-ink font-semibold"
                  : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* KIR Tabela izdatih računa */}
      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="border-b border-line bg-surface px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-[13px] font-bold text-ink-2">
              Zvanični registar KIR (Knjiga izdatih računa)
            </span>
            <span className="rounded-lg bg-neutral-200 px-3 py-1 text-xs font-medium text-ink-2">
              {filteredInvoices.length} računa
            </span>
          </div>
          <span className="text-xs text-ink-3 italic">
            * Stopa PDV: 0% oslobođeno po čl. 24. stav 1. tačka 1. ZPDV
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-line bg-neutral-100/70 text-xs font-bold text-ink-2">
                <th className="py-3 px-3 text-center w-10">R.br</th>
                <th className="py-3 px-3">Broj računa</th>
                <th className="py-3 px-3">Datum prometa</th>
                <th className="py-3 px-3">Kupac (Student)</th>
                <th className="py-3 px-3">Svrha / Usluga</th>
                <th className="py-3 px-3 text-right">Devizni iznos</th>
                <th className="py-3 px-3 text-right">NBS Kurs</th>
                <th className="py-3 px-3 text-right">Osnovica (RSD)</th>
                <th className="py-3 px-3 text-right font-bold">Ukupno RSD</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-neutral-400">
                    Nema faktura u izabranoj pretrazi.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const st = PAYMENT_STATUSES[inv.status] || { label: inv.status, badgeCls: "bg-surface-2" };
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="py-3 px-3 text-center tabular-nums font-semibold text-neutral-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 tabular-nums font-bold text-ink whitespace-nowrap">
                        <span className="underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap tabular-nums text-ink-2">
                        {inv.deliveryDate}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-ink">{inv.candidateName}</div>
                        <div className="text-2xs text-ink-3 tabular-nums">
                          {inv.candidateJmbg || inv.candidateCity || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate" title={inv.purpose}>
                        <div className="font-semibold text-ink truncate">{inv.purpose}</div>
                        <div className="text-2xs text-ink-3">
                          {PAYMENT_METHODS[inv.paymentMethod] || inv.paymentMethod}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold text-ink whitespace-nowrap">
                        {inv.currency === "EUR" ? formatEur(inv.originalAmount) : `${inv.originalAmount} USD`}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-ink-2 whitespace-nowrap">
                        {Number(inv.exchangeRate).toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-ink-2 whitespace-nowrap">
                        {formatRsd(inv.vatBaseRsd)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-700 whitespace-nowrap">
                        {formatRsd(inv.totalRsd)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block rounded-lg px-3 py-1 text-xs font-medium border ${st.badgeCls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Pregledaj i odštampaj fakturu"
                            onClick={() => setSelectedInvoice(inv)}
                            className="rounded-lg bg-surface-2 p-1.5 text-ink-2 hover:bg-neutral-200 transition-colors"
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
                              className="rounded-lg border border-line bg-white p-1.5 text-emerald-700 hover:bg-surface transition-colors"
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
      <div className="rounded-xl border border-line bg-surface p-4 text-xs text-ink-2 flex items-start gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-ink">
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
