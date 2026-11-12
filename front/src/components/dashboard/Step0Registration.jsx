// front/src/components/dashboard/Step0Registration.jsx
import { useRef } from "react";
import { UploadIcon } from "./icons";
import {
  downloadContractPdf,
  downloadResponsibilityStatementPdf,
} from "../../data/candidateStore";

export default function Step0Registration({
  candidate,
  hasSignedContract,
  isContractApproved,
  isContractPending,
  isFirstInstallmentPaid,
  isFirstInstallmentPending,
  isRegistrationDone,
  handleReportFirstInstallment,
  handleSimulateFirstPaymentConfirm,
  handleSimulateContractApprove,
  signedContractInputRef,
  isUploadingSignedContract,
  handleUploadSignedContract,
  handlePaymentSlipClick,
  setShowChangeDiscountModal,
  copiedRefCode,
  setCopiedRefCode,
}) {
  const localInputRef = useRef(null);
  const inputRef = signedContractInputRef || localInputRef;

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-[var(--brand-ink)] font-black text-sm shadow-xs">
              REG
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  REGISTRACIJA
                </span>
                <h2 className="text-base sm:text-lg font-black text-[var(--brand-ink)]">
                  {candidate.paymentMethod === "now"
                    ? "Izbor programa, Potpisivanje ugovora & Uplata u celosti"
                    : "Izbor programa, Potpisivanje ugovora & I Rata"}
                </h2>
              </div>
              <p className="text-xs text-[var(--brand-ink)]/65 mt-0.5">
                {candidate.paymentMethod === "now"
                  ? "Pravni i finansijski osnov učešća. Potpisivanje ugovora o posredovanju i uplata programa u celosti otključavaju prelazak na Korak 1."
                  : "Pravni i finansijski osnov učešća. Potpisivanje ugovora o posredovanju i uplata prve rate otključavaju prelazak na Korak 1."}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isRegistrationDone
                ? "bg-green-100 text-green-900 border border-green-300"
                : isFirstInstallmentPending || isContractPending
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : hasSignedContract
                ? "bg-blue-100 text-blue-900 border border-blue-300"
                : "bg-slate-100 text-slate-800 border border-slate-300"
            }`}
          >
            {isRegistrationDone
              ? candidate.paymentMethod === "now"
                ? "Registracija završena (Ugovor odobren & Program uplaćen u celosti)"
                : "Registracija završena (Ugovor odobren & I rata plaćena)"
              : isFirstInstallmentPending
              ? candidate.paymentMethod === "now"
                ? "Čeka se potvrda uplate programa od administratora"
                : "Čeka se potvrda uplate I rate od administratora"
              : isContractPending
              ? "Ugovor okačen — čeka overu administratora"
              : hasSignedContract
              ? candidate.paymentMethod === "now"
                ? "Ugovor okačen • Čeka uplatu programa u celosti"
                : "Ugovor okačen • Čeka uplatu I rate"
              : "Čeka kačenje ugovora"}
          </span>
        </div>

        {/* Podkorak 0.1: Izbor programa i opcije plaćanja */}
        <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-2 mb-2.5">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              Izabrani program i opcija plaćanja
            </h4>
            <span className="font-mono text-[11px] font-bold text-slate-600">
              Šifra prijave: WT-{String(candidate.id || "2576").replace(/[^0-9]/g, "").slice(-4) || "2576"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-lg bg-white p-2.5 border border-black/10">
              <span className="text-[10px] uppercase font-bold text-black/50 block">Program i paket</span>
              <span className="font-bold text-black text-xs mt-0.5 block">
                {candidate.programName || "Work & Travel USA 2026 — Full Placement"}
              </span>
              <span className="text-[11px] text-black/60">Smeštaj + Američki poslodavac + DS-2019</span>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-black/10">
              <span className="text-[10px] uppercase font-bold text-black/50 block">Način plaćanja</span>
              <span className="font-bold text-black text-xs mt-0.5 block">
                {candidate.paymentMethod === "pkz"
                  ? "PKZ Model (Plaćanje kroz zaradu u SAD)"
                  : candidate.paymentMethod === "installments"
                  ? "Plaćanje na rate (I, II i III rata)"
                  : "Plaćanje u celosti (sa popustom)"}
              </span>
              <span className="text-[11px] text-black/60">
                {candidate.paymentMethod === "pkz"
                  ? "Treća rata dospeva u SAD iz prvih plata"
                  : "I rata ide uz potpisivanje ugovora"}
              </span>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-black/10">
              <span className="text-[10px] uppercase font-bold text-black/50 block">Ukupna ugovorena cena</span>
              <span className="font-black text-base text-[var(--brand-ink)] mt-0.5 block">
                {candidate.finalPrice || candidate.basePrice || 1850} €
              </span>
              {candidate.discount > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 block">
                  Popust uračunat: -{candidate.discount} $
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Podkorak 0.2: Ugovor o posredovanju & Izjava o odgovornosti */}
        <div className="mt-3 rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2.5">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              Preuzimanje i potpisivanje Ugovora o posredovanju & Izjave o odgovornosti
            </h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                hasSignedContract
                  ? "bg-green-100 text-green-900 border border-green-300"
                  : "bg-amber-100 text-amber-900 border border-amber-300"
              }`}
            >
              {hasSignedContract ? "Potpisan ugovor okačen" : "Obavezan potpis pre uplate"}
            </span>
          </div>

          <p className="text-xs text-[var(--brand-ink)]/70 mb-2.5">
            Procedura: Preuzmite zvanični ugovor i Izjavu o odgovornosti popunjene vašim podacima (Ime, JMBG, Broj pasoša), odštampajte, svojeručno potpišite, skenirajte i okačite nazad na profil.
          </p>

          {/* 4 koraka procedura */}
          <div className="grid gap-2.5 sm:grid-cols-4">
            {/* Korak 1: Skini */}
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-2.5 shadow-2xs">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                1. Skini (Preuzmi)
              </span>
              <p className="mt-1 text-xs font-bold text-[var(--brand-ink)]">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-[10px] font-mono text-[var(--brand-ink)]/65 truncate">
                JMBG: {candidate.jmbg || "Popunjen"} • Pasoš: {candidate.passportNumber || candidate.idCardNumber || "Popunjen"}
              </p>
              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => downloadContractPdf(candidate.id, candidate.email)}
                  className="rounded-md bg-white border border-black/10 px-2 py-1 text-[10px] font-bold text-black/80 hover:bg-black/[0.04]"
                >
                  Ugovor (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}
                  className="rounded-md bg-white border border-black/10 px-2 py-1 text-[10px] font-bold text-black/80 hover:bg-black/[0.04]"
                >
                  Izjava (PDF)
                </button>
              </div>
            </div>

            {/* Korak 2: Odštampaj */}
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-2.5 shadow-2xs">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                2. Odštampaj
              </span>
              <p className="mt-1 text-xs font-bold text-[var(--brand-ink)]">
                Štampa na papiru
              </p>
              <p className="text-[10px] text-[var(--brand-ink)]/65 mt-0.5">
                Odštampajte popunjeni primerak ugovora i Izjave o odgovornosti na A4 formatu.
              </p>
            </div>

            {/* Korak 3: Potpiši */}
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-2.5 shadow-2xs">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                3. Svojeručno potpiši
              </span>
              <p className="mt-1 text-xs font-bold text-[var(--brand-ink)]">
                Potpis olovkom
              </p>
              <p className="text-[10px] text-[var(--brand-ink)]/65 mt-0.5">
                Potpišite dokument svojeručno na označenoj liniji za potpis studenta.
              </p>
            </div>

            {/* Korak 4: Skeniraj i okači */}
            <div
              className={`rounded-xl border p-2.5 shadow-2xs ${
                hasSignedContract
                  ? "border-green-300 bg-green-50/70"
                  : "border-amber-300 bg-amber-50/70"
              }`}
            >
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
                4. Skeniraj i okači
              </span>
              {hasSignedContract ? (
                <>
                  <p className="mt-1 text-xs font-extrabold text-green-900 truncate">
                    {candidate.signedContractFileName || "Potpisani_Ugovor.pdf"}
                  </p>
                  <p className="text-[10px] text-green-800/80">
                    Okačeno • Uplate otključane
                  </p>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-2 text-[10px] font-bold text-green-900 underline hover:opacity-80"
                  >
                    Zameni okačeni ugovor
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs font-extrabold text-amber-950">
                    Čeka kačenje ugovora
                  </p>
                  <p className="text-[10px] text-amber-900/80">
                    Uplata je zaključana
                  </p>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploadingSignedContract}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-[var(--brand-ink)] px-2.5 py-1 text-[10px] font-bold text-white hover:opacity-90"
                  >
                    {isUploadingSignedContract ? "Kačenje..." : "Okači potpisani fajl ↑"}
                  </button>
                </>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="sr-only"
            onChange={(e) => handleUploadSignedContract(e.target.files?.[0])}
          />

          {/* Baneri stanja verifikacije ugovora */}
          {hasSignedContract && isContractApproved && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-green-300 bg-green-50/80 p-2.5 text-xs text-green-950">
              <span className="flex items-center gap-2 font-bold">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-[10px] font-bold">•</span>
                Potpisani ugovor o posredovanju je zvanično verifikovan i odobren od strane pravnog tima agencije.
              </span>
              <span className="rounded-md bg-green-200 px-2 py-0.5 text-[10px] font-black text-green-900">Overeno</span>
            </div>
          )}

          {hasSignedContract && isContractPending && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
              <div className="space-y-0.5">
                <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <span></span> Ugovor okačen — čeka se administrativna verifikacija
                </p>
                <p className="text-[11px] text-amber-950/80">
                  Naš pravni tim proverava svojeručne potpise i unete podatke. U međuvremenu možete preuzeti uplatnicu i pripremiti I ratu.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Podkorak 0.3: Uplata rate programa ili uplate u celosti (sa ugovorom) */}
        {(() => {
          const isFull = candidate.paymentMethod === "now";
          const paymentAmount = isFull
            ? Number(candidate.finalPrice) || Number(candidate.basePrice) || 1750
            : Number(candidate.firstInstallmentAmount) || 250;

          return (
            <div className="mt-3 rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2.5">
                <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
                  {isFull
                    ? `Uplata programa u celosti (${paymentAmount} €) & IPS QR nalog`
                    : `Uplata I rate programa (${paymentAmount} €) & IPS QR nalog`}
                </h4>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    isFirstInstallmentPaid
                      ? "bg-green-100 text-green-900 border border-green-300"
                      : isFirstInstallmentPending
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : hasSignedContract
                      ? "bg-blue-100 text-blue-900 border border-blue-300"
                      : "bg-black/10 text-black/50"
                  }`}
                >
                  {isFirstInstallmentPaid
                    ? isFull
                      ? "Program plaćen u celosti"
                      : "I Rata plaćena i odobrena"
                    : isFirstInstallmentPending
                    ? "Čeka potvrdu administratora"
                    : hasSignedContract
                    ? "Uplatnica aktivna (Čeka uplatu)"
                    : "Zaključano pre ugovora"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-[var(--brand-ink)]/75">
                  <p>
                    <strong>{isFull ? "Iznos programa u celosti:" : "Iznos prve rate:"}</strong>{" "}
                    {paymentAmount} € (U dinarskoj protivvrednosti po srednjem kursu NBS na dan uplate).
                  </p>
                  <p className="text-[11px] text-[var(--brand-ink)]/60">
                    {isFull
                      ? "Jednokratna uplata celog iznosa programa na tekući račun agencije putem mobilnog bankarstva (IPS QR) ili na šalteru."
                      : "Uplata se vrši na tekući račun agencije putem mobilnog bankarstva (skeniranjem IPS QR koda na uplatnici) ili na šalteru pošte/banke."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePaymentSlipClick}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition-all ${
                      hasSignedContract
                        ? "bg-[var(--brand-ink)] text-white hover:opacity-90"
                        : "bg-black/10 text-black/50 cursor-not-allowed"
                    }`}
                    title={
                      hasSignedContract
                        ? isFull
                          ? "Preuzmi zvanični nalog za uplatu u celosti u PDF-u"
                          : "Preuzmi zvanični nalog za uplatu prve rate u PDF-u"
                        : "Ugovor mora biti okačen pre uplate"
                    }
                  >
                    <UploadIcon className="h-4 w-4 rotate-180" />
                    <span>Preuzmi uplatnicu (PDF sa IPS QR)</span>
                    {!hasSignedContract && <span className="ml-1 text-[10px] font-bold">(Zaključano)</span>}
                  </button>

                  {hasSignedContract && !isFirstInstallmentPaid && !isFirstInstallmentPending && (
                    <button
                      type="button"
                      onClick={handleReportFirstInstallment}
                      className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                    >
                      {isFull ? "Prijavi uplatu programa u celosti &rarr;" : "Prijavi izvršenu uplatu I rate &rarr;"}
                    </button>
                  )}
                </div>
              </div>

              {/* Baneri stanja uplate */}
              {isFirstInstallmentPending && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
                  <div>
                    <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                      <span></span> {isFull ? "Uplata programa u celosti prijavljena — čeka se knjiženje i potvrda" : "Uplata I rate prijavljena — čeka se knjiženje i potvrda administratora"}
                    </p>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      {isFull
                        ? `Nakon što administrator u banci potvrdi uplatu celog programa (${paymentAmount} €), sistem automatski otključava sve naredne korake.`
                        : `Nakon što administrator u banci proveri izvod i potvrdi prijem uplate (${paymentAmount} €), sistem automatski potvrđuje vaš prelazak na Korak 1.`}
                    </p>
                  </div>
                </div>
              )}

              {isFirstInstallmentPaid && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-green-300 bg-green-50/80 p-2.5 text-xs text-green-950">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-[10px] font-bold">•</span>
                    {isFull
                      ? `Uplata programa u celosti (${paymentAmount} €) je zvanično potvrđena i proknjižena. Registracioni preduslovi su ispunjeni!`
                      : `Uplata prve rate programa (${paymentAmount} €) je zvanično potvrđena i proknjižena. Registracioni preduslovi su ispunjeni!`}
                  </span>
                  <span className="rounded-md bg-green-200 px-2 py-0.5 text-[10px] font-black text-green-900">Plaćeno</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Podkorak 0.4: Promocije, Popusti, Afilijate & Grupni popust */}
        <div className="mt-3 rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2.5">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              Promocije, Ugovoreni popusti & Afilijate (Dovedi prijatelja)
            </h4>
            <button
              type="button"
              onClick={() => setShowChangeDiscountModal(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-ink)] hover:bg-black/[0.04]"
            >
              <span>Promeni popust ▾</span>
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/50 block">Aktivna promocija</span>
              <p className="mt-1 font-black text-sm text-[var(--brand-ink)]">{candidate.discountNote || "Nema aktivnog popusta"}</p>
              {candidate.discount > 0 && (
                <p className="text-[11px] font-black text-emerald-700 mt-0.5">Ušteda: -{candidate.discount} $</p>
              )}
            </div>
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/50 block">Način obračuna popusta</span>
              <p className="mt-1 font-bold text-xs text-[var(--brand-ink)]">
                {candidate.discountTiming === "end" ? "Obračun na poslednjoj rati (nakon vize i posla)" : "Umanjuje osnovnu cenu odmah"}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/50 block">Dovedi prijatelja ($100 po osobi)</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-xs font-bold">{candidate.referralCode || "WT-REF"}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(candidate.referralCode || "");
                    setCopiedRefCode(true);
                    setTimeout(() => setCopiedRefCode(false), 2000);
                  }}
                  className="text-[10px] font-bold text-blue-700 underline"
                >
                  {copiedRefCode ? "Kopirano" : "Kopiraj kod"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
