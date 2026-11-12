import React, { useState } from "react";
import { NBS_RATES, PAYMENT_METHODS, createInvoice } from "../data/invoicesStore";

export default function NewInvoiceModal({ isOpen, onClose, candidates = [], onCreated = () => {} }) {
  if (!isOpen) return null;

  const [candidateId, setCandidateId] = useState(candidates[0]?.id || "");
  const [candidateName, setCandidateName] = useState(candidates[0]?.name || "");
  const [candidateEmail, setCandidateEmail] = useState(candidates[0]?.email || "");
  const [candidateJmbg, setCandidateJmbg] = useState(candidates[0]?.jmbg || "");
  const [candidateAddress, setCandidateAddress] = useState(candidates[0]?.address || "Beograd");
  const [candidateCity, setCandidateCity] = useState(candidates[0]?.studyCity || "Beograd");

  const [serviceType, setServiceType] = useState("RATE_1");
  const [purpose, setPurpose] = useState("Uplata I rate programa — Work & Travel USA 2026");
  const [currency, setCurrency] = useState("EUR");
  const [originalAmount, setOriginalAmount] = useState(450);
  const [exchangeRate, setExchangeRate] = useState(NBS_RATES.EUR);
  const [paymentMethod, setPaymentMethod] = useState("IPS_QR");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");

  const handleCandidateChange = (cId) => {
    setCandidateId(cId);
    const cand = candidates.find((c) => String(c.id) === String(cId));
    if (cand) {
      setCandidateName(cand.name || `${cand.firstName || ""} ${cand.lastName || ""}`.trim());
      setCandidateEmail(cand.email || "");
      setCandidateJmbg(cand.jmbg || "");
      setCandidateAddress(cand.address || "Beograd");
      setCandidateCity(cand.studyCity || "Beograd");
    }
  };

  const handleServiceChange = (type) => {
    setServiceType(type);
    if (type === "RATE_1") {
      setPurpose("Uplata I rate programa — Work & Travel USA 2026 (Potpisivanje ugovora)");
      setCurrency("EUR");
      setOriginalAmount(450);
      setExchangeRate(NBS_RATES.EUR);
    } else if (type === "RATE_2") {
      setPurpose("Uplata II rate programa — Potvrđen Job Offer");
      setCurrency("EUR");
      setOriginalAmount(850);
      setExchangeRate(NBS_RATES.EUR);
    } else if (type === "RATE_3") {
      setPurpose("Uplata III rate programa — Nakon odobrene vize");
      setCurrency("EUR");
      setOriginalAmount(450);
      setExchangeRate(NBS_RATES.EUR);
    } else if (type === "VISA_FEE") {
      setPurpose("Taksa za obradu vize i zakazivanje termina u Ambasadi SAD (MRV taksa)");
      setCurrency("USD");
      setOriginalAmount(185);
      setExchangeRate(NBS_RATES.USD);
    } else if (type === "TRANSLATION") {
      setPurpose("Prevod i overa dokumenata (Fakultet i MUP) na engleski jezik");
      setCurrency("EUR");
      setOriginalAmount(40);
      setExchangeRate(NBS_RATES.EUR);
    }
  };

  const calculatedRsd = (Number(originalAmount || 0) * Number(exchangeRate || 0)).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newInv = createInvoice({
      candidateId,
      candidateName,
      candidateEmail,
      candidateJmbg,
      candidateAddress,
      candidateCity,
      serviceType,
      purpose,
      currency,
      originalAmount: Number(originalAmount),
      exchangeRate: Number(exchangeRate),
      paymentMethod,
      dueDate,
      notes,
    });
    onCreated(newInv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-black/10">
        <div className="flex shrink-0 items-center justify-between border-b border-black/[0.08] bg-[#fcfcfd] px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-sm font-black text-[var(--brand-ink)]">
              +
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-[var(--brand-ink)]">Izdavanje nove fakture</h3>
              <p className="text-xs text-black/55">Knjiga izdatih računa (KIR) • Obračun po NBS kursu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-black/40 hover:bg-black/[0.05] hover:text-black"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-xs">
          {/* Odabir kandidata */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kandidat iz baze:</label>
            <select
              value={candidateId}
              onChange={(e) => handleCandidateChange(e.target.value)}
              className="w-full rounded-lg border border-black/15 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden"
            >
              <option value="">-- Odaberite kandidata ili unesite ručno --</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim()} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">Ime i prezime kupca:</label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">JMBG / Broj pasoša:</label>
              <input
                type="text"
                value={candidateJmbg}
                onChange={(e) => setCandidateJmbg(e.target.value)}
                placeholder="13 cifara JMBG"
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>

          {/* Tip usluge */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tip usluge / Svrha fakturisanja:</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                ["RATE_1", "I Rata (450 €)"],
                ["RATE_2", "II Rata (850 €)"],
                ["RATE_3", "III Rata (450 €)"],
                ["VISA_FEE", "MRV Viza ($185)"],
                ["TRANSLATION", "Prevod (40 €)"],
              ].map(([t, lbl]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleServiceChange(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    serviceType === t
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          {/* Iznos, Valuta i NBS Kurs */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Iznos devizni:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-bold font-mono"
                />
                <select
                  value={currency}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCurrency(c);
                    setExchangeRate(NBS_RATES[c] || 117.1524);
                  }}
                  className="rounded-lg border border-black/15 bg-white px-2 py-1.5 text-xs font-bold"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">NBS Srednji kurs:</label>
              <input
                type="number"
                step="0.0001"
                required
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-mono"
              />
              <span className="text-[10px] text-slate-500">6 decimala po NBS</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ukupno u RSD:</label>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-black font-mono text-emerald-900">
                {Number(calculatedRsd).toLocaleString("sr-RS", { minimumFractionDigits: 2 })} RSD
              </div>
              <span className="text-[10px] text-emerald-700">Osnovica (PDV 0%)</span>
            </div>
          </div>

          {/* Način plaćanja i dospeće */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Način plaćanja:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs"
              >
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rok dospeća:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-black/[0.08] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-black/[0.05] px-4 py-2 text-xs font-bold text-slate-700 hover:bg-black/[0.1]"
            >
              Odustani
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--brand-ink)] px-5 py-2 text-xs font-bold text-white hover:bg-black shadow-xs"
            >
              Kreiraj fakturu i zavedi u KIR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
