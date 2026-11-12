import React, { useState } from "react";

export default function JobOfferModal({
  isOpen,
  onClose,
  candidate,
  jobOfferDetails,
  onAccept,
  onAcceptOffer,
}) {
  if (!isOpen) return null;

  const defaultOffer = {
    offerNumber: candidate?.selectedJobOfferNumber || "JO-2026-CA-0842",
    companyName: candidate?.selectedJobEmployer || "Tahoe Pines Lodge & Resort LLC",
    ein: candidate?.selectedJobEin || "88-4298103",
    companyAddress: candidate?.selectedJobCity ? `${candidate.selectedJobCity}, USA` : "4082 Lake Tahoe Blvd, South Lake Tahoe, CA 96150",
    supervisor: "Mark Stevens, General Manager",
    phone: "+1 (530) 542-8800",
    email: "hr@tahoepineslodge.com",
    position: candidate?.selectedJobTitle || candidate?.preferences?.position || "Sobarica / Housekeeping Staff",
    wage: candidate?.selectedJobWage || "$17.50 / hour",
    overtimeWage: "$26.25 / hour (after 40 hours)",
    hoursPerWeek: "35–40 hours per week",
    payFrequency: "Bi-weekly (svake 2 nedelje direct deposit)",
    startDate: "2026-06-05",
    endDate: "2026-09-30",
    housingAddress: "Pines Employee Village, 112 Pines Way, South Lake Tahoe",
    housingCost: "$110.00 / week (odbitak od zarade)",
    housingDeposit: "$150.00 (povratan depozit)",
    mealPlan: "1 besplatan topli obrok po smeni u restoranu hotela",
    transportation: "Besplatan autobuski prevoz za zaposlene do radnog mesta (10 min)",
    uniformRequired: "Obezbeđuje poslodavac (2 majice i pregača)",
    signedAt: candidate?.jobOfferSignedAt || null,
    signature: candidate?.jobOfferSignature || "",
  };

  const offer = { ...defaultOffer, ...(jobOfferDetails || {}) };
  const isAlreadySigned = Boolean(candidate?.hasJob || offer.signedAt);

  const [signatureText, setSignatureText] = useState(
    isAlreadySigned ? offer.signature || candidate?.name || "" : candidate?.name || ""
  );
  const [agreedTerms, setAgreedTerms] = useState(isAlreadySigned);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSign = (e) => {
    e.preventDefault();
    if (!agreedTerms || !signatureText.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const acceptFn = onAccept || onAcceptOffer || (() => {});
      acceptFn({
        ...offer,
        signedAt: new Date().toISOString(),
        signature: signatureText.trim(),
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-4 flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-line overflow-hidden">
        {/* Top bar (print: hidden) */}
        <div className="flex flex-wrap items-center justify-between border-b border-line bg-ink px-6 py-3.5 text-white print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-ink">
              2.5
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Zvanični Job Offer & Ugovor o radu (SAD)</span>
                {isAlreadySigned ? (
                  <span className="rounded-full bg-white/10 text-white/85 px-3 py-1 text-xs font-medium">
                    Potpisano i prihvaćeno
                  </span>
                ) : (
                  <span className="rounded-full bg-brand text-ink px-3 py-1 text-xs font-medium">
                    Čeka digitalni potpis
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300">
                Broj ponude: {offer.offerNumber} • Poslodavac: {offer.companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Štampaj / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 p-1.5 text-neutral-300 hover:bg-white/20 hover:text-white transition-colors"
            >
              x
            </button>
          </div>
        </div>

        {/* Telo ugovora o radu (A4 format) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-ink font-sans text-xs sm:text-sm space-y-6">
          {/* Zaglavlje ugovora */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-ink pb-5 gap-4">
            <div>
              <span className="tabular-nums text-xs font-bold text-ink-3 block">
                U.S. DEPARTMENT OF STATE • J-1 SUMMER WORK TRAVEL
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-0.5">
                JOB OFFER & PLACEMENT AGREEMENT
              </h2>
              <p className="text-xs text-ink-2 mt-1 font-medium">
                Sponzorski obrazac za izdavanje DS-2019 sertifikata o radnoj podobnosti
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="rounded-md bg-surface-2 px-2.5 py-1 tabular-nums text-xs font-bold text-ink">
                {offer.offerNumber}
              </span>
              <p className="text-xs text-ink-3 mt-1">Datum izdavanja: <strong>{new Date().toLocaleDateString("sr-RS")}</strong></p>
            </div>
          </div>

          {/* Podaci o poslodavcu i učesniku */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-line bg-neutral-50/70 p-4 space-y-1">
              <span className="text-xs font-semibold text-ink-3">
                1. HOST EMPLOYER (POSLODAVAC U SAD)
              </span>
              <h3 className="font-bold text-base text-ink">{offer.companyName}</h3>
              <p className="text-xs text-ink-2">{offer.companyAddress}</p>
              <div className="mt-2 text-xs text-ink-2 space-y-0.5">
                <div>Federal EIN: <strong className="tabular-nums text-ink">{offer.ein}</strong></div>
                <div>Kontakt: <strong>{offer.supervisor}</strong> ({offer.phone})</div>
                <div>Email: <strong className="text-ink">{offer.email}</strong></div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-neutral-50/70 p-4 space-y-1">
              <span className="text-xs font-semibold text-ink-3">
                2. J-1 PARTICIPANT (STUDENT KANDIDAT)
              </span>
              <h3 className="font-bold text-base text-ink">{candidate?.name || "Kandidat"}</h3>
              <p className="text-xs text-ink-2">{candidate?.faculty || "Univerzitet u Beogradu"}</p>
              <div className="mt-2 text-xs text-ink-2 space-y-0.5">
                <div>Pasoš: <strong className="tabular-nums text-ink">{candidate?.passportNumber || "014298751"}</strong></div>
                <div>Email: <strong className="text-ink">{candidate?.email}</strong></div>
                <div>Telefon: <strong className="text-ink">{candidate?.phone || "+381 61 234 5678"}</strong></div>
              </div>
            </div>
          </div>

          {/* Tabela uslova radnog mesta */}
          <div>
            <h4 className="font-bold text-[13px] text-ink-2 mb-2">
              3. SPECIFIKACIJA RADNOG MESTA I NAKNADE:
            </h4>
            <div className="rounded-xl border border-line overflow-hidden">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-line">
                  <tr className="bg-neutral-50/70">
                    <td className="py-2.5 px-4 font-semibold text-ink-2 w-1/3">Radna pozicija (Job Title):</td>
                    <td className="py-2.5 px-4 font-bold text-ink text-sm">{offer.position}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-ink-2">Osnovna satnica (Hourly Wage):</td>
                    <td className="py-2.5 px-4 tabular-nums font-bold text-emerald-800 text-sm">{offer.wage}</td>
                  </tr>
                  <tr className="bg-neutral-50/70">
                    <td className="py-2.5 px-4 font-semibold text-ink-2">Prekovremeni rad (Overtime):</td>
                    <td className="py-2.5 px-4 tabular-nums font-semibold text-ink">{offer.overtimeWage}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-ink-2">Nedeljni fond radnih sati:</td>
                    <td className="py-2.5 px-4 font-semibold text-ink">{offer.hoursPerWeek}</td>
                  </tr>
                  <tr className="bg-neutral-50/70">
                    <td className="py-2.5 px-4 font-semibold text-ink-2">Datumi rada (Employment Dates):</td>
                    <td className="py-2.5 px-4 font-semibold text-ink tabular-nums">
                      {offer.startDate} – {offer.endDate}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-ink-2">Isplata zarade:</td>
                    <td className="py-2.5 px-4 text-ink-2">{offer.payFrequency}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela uslova smeštaja */}
          <div>
            <h4 className="font-bold text-[13px] text-ink-2 mb-2">
              4. DETALJI SMEŠTAJA I DODATNE POGODNOSTI:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-line bg-white p-5 space-y-1 sm:p-6">
                <span className="font-semibold text-ink block">Lokacija i cena smeštaja:</span>
                <p className="text-ink-2">{offer.housingAddress}</p>
                <div className="mt-1 tabular-nums text-xs text-ink">
                  Cena: <strong>{offer.housingCost}</strong> • Depozit: <strong>{offer.housingDeposit}</strong>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-5 space-y-1 sm:p-6">
                <span className="font-semibold text-ink block"> Hrana i transport:</span>
                <p className="text-ink-2">{offer.mealPlan}</p>
                <p className="text-ink-2">{offer.transportation}</p>
              </div>
            </div>
          </div>

          {/* Pravne odredbe */}
          <div className="rounded-2xl border border-line bg-white p-5 text-xs text-ink-2 space-y-1.5 leading-relaxed sm:p-6">
            <span className="font-semibold text-ink uppercase tracking-wide block">
              5. J-1 SUMMER WORK TRAVEL REGULATIVE I OBAVEZE:
            </span>
            <p>
              Kandidat se obavezuje da će se javiti poslodavcu na navedeni datum početka rada, savesno obavljati poverena radna zaduženja u skladu sa internim pravilnikom kompanije i poštovati sve zakone savezne države i SAD.
            </p>
            <p>
              Prihvatanjem ove radne ponude stiču se uslovi za prelazak na sledeći korak programa — <strong>Uplatu II rate programa</strong> i pokretanje izrade zvaničnog <strong>DS-2019</strong> sertifikata kod američkog sponzora.
            </p>
          </div>

          {/* DIGITALNI POTPIS */}
          <div className="rounded-2xl border-2 border-ink bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[13px] text-ink">
                6. DIGITALNI POTPIS UČESNIKA
              </span>
              {isAlreadySigned && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  Potpisano: {new Date(offer.signedAt || Date.now()).toLocaleDateString("sr-RS")}
                </span>
              )}
            </div>

            {!isAlreadySigned ? (
              <form onSubmit={handleSign} className="space-y-3">
                <label className="flex items-start gap-2.5 text-xs text-ink-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 accent-neutral-900"
                  />
                  <span>
                    Izjavljujem da sam detaljno pročitao/la uslove radne ponude, satnicu, cenu smeštaja i zaduženja, te ih u celosti i dobrovoljno prihvatam.
                  </span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Upišite vaše puno ime i prezime kao digitalni potpis:
                  </label>
                  <input
                    type="text"
                    required
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="npr. Nemanja Stojadinović"
                    className="w-full sm:max-w-md rounded-xl border border-line-strong bg-white px-3.5 py-2 font-serif text-base italic text-ink focus:border-ink focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !agreedTerms || !signatureText.trim()}
                    className="rounded-full bg-emerald-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Verifikacija...
                      </>
                    ) : (
                      "Digitalno potpiši i prihvati Job Offer"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-emerald-50 p-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-800">Digitalni potpis:</span>
                  <div className="font-serif italic font-bold text-lg text-emerald-950 mt-0.5">
                    {offer.signature || candidate?.name}
                  </div>
                  <span className="text-xs text-emerald-800 tabular-nums">
                    ID verifikacije: SHA256-JO-{candidate?.id?.slice(-6) || "928174"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                    Job Offer prihvaćen
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
