// front/src/components/dashboard/modals/SignContractModal.jsx
import { useState, useRef } from "react";
import {
  downloadContractPdf,
  downloadResponsibilityStatementPdf,
} from "../../../data/candidateStore";
import { CheckIcon, UploadIcon, BRAND_YELLOW } from "../icons";

export default function SignContractModal({
  candidate,
  onClose,
  onUploadSignedContract,
  onUpdateCandidate,
  isUploading,
}) {
  const [passport, setPassport] = useState(candidate.passportNumber || candidate.idCardNumber || "");
  const [jmbg, setJmbg] = useState(candidate.jmbg || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const hasExisting = Boolean(candidate.signedContractFileName || candidate.contractSigned);

  const isSelf =
    String(candidate.packageId || "").toLowerCase().includes("self") ||
    String(candidate.packageName || "").toLowerCase().includes("self");

  const handleDownloadBoth = () => {
    if (jmbg || passport) {
      onUpdateCandidate?.({ jmbg: jmbg.trim(), passportNumber: passport.trim() });
    }
    downloadContractPdf(candidate.id, candidate.email, "all", {
      jmbg: jmbg.trim(),
      passportNumber: passport.trim(),
      package: isSelf ? "self" : "full",
    });
  };

  const handleDownloadStatement = () => {
    if (jmbg || passport) {
      onUpdateCandidate?.({ jmbg: jmbg.trim(), passportNumber: passport.trim() });
    }
    downloadResponsibilityStatementPdf(candidate.id, candidate.email, {
      jmbg: jmbg.trim(),
      passportNumber: passport.trim(),
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Molimo priložite skeniran ili fotografisan fajl potpisanog ugovora (.pdf, .jpg, .png).");
      return;
    }
    if (jmbg.trim() || passport.trim()) {
      onUpdateCandidate?.({ jmbg: jmbg.trim(), passportNumber: passport.trim() });
    }
    await onUploadSignedContract(selectedFile);
  };

  const handleQuickDemoSubmit = async () => {
    if (jmbg.trim() || passport.trim()) {
      onUpdateCandidate?.({ jmbg: jmbg.trim(), passportNumber: passport.trim() });
    }
    const docUrl = isSelf ? "/documents/SELF_UGOVOR_2027.pdf" : "/documents/FULL_Lifeguard_UGOVOR_2027.pdf";
    let realFile;
    try {
      const resp = await fetch(docUrl);
      const blob = await resp.blob();
      const safeName = (candidate.lastName || "Kandidat").replace(/[^a-zA-Z0-9_-]/g, "_");
      realFile = new File([blob], `Potpisan_Ugovor_${safeName}_2027.pdf`, {
        type: "application/pdf",
      });
    } catch {
      const safeName = (candidate.lastName || "Kandidat").replace(/[^a-zA-Z0-9_-]/g, "_");
      realFile = new File([new Uint8Array([37, 80, 68, 70])], `Potpisan_Ugovor_${safeName}_2027.pdf`, {
        type: "application/pdf",
      });
    }
    await onUploadSignedContract(realFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-black/50 hover:bg-black/5 hover:text-black"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-yellow)] text-xl font-bold text-[var(--brand-ink)] shadow-xs">
            ✍️
          </span>
          <div>
            <h3 className="text-xl font-extrabold text-[var(--brand-ink)]">
              Preuzimanje i kačenje potpisanog ugovora
            </h3>
            <p className="text-xs text-[var(--brand-ink)]/60">
              Obavezan korak pre bilo kakve uplate troškova programa Work & Travel USA 2026.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-950">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span> Pravilo agencije o uplatama:
          </p>
          <p className="mt-1 leading-relaxed">
            Pre bilo kakve uplate troškova programa ili generisanja uplatnice sa IPS QR kodom, obavezno je da <strong>preuzmete</strong> popunjenu dokumentaciju, <strong>odštampate</strong> je, <strong>svojeručno potpišete</strong>, te <strong>skenirate ili uslikate</strong> i okačite nazad u portal.
          </p>
        </div>

        {hasExisting && (
          <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-3.5 text-xs text-green-900 flex items-start gap-2.5">
            <CheckIcon className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Potpisani ugovor je već evidentiran:</p>
              <p className="font-mono text-[0.75rem] text-green-800 mt-0.5">
                {candidate.signedContractFileName || "Potpisani_Ugovor.pdf"}
                {candidate.signedContractUploadedAt && ` (okačeno: ${new Date(candidate.signedContractUploadedAt).toLocaleString("sr-RS")})`}
              </p>
              <p className="mt-1 text-green-800/80 text-[0.7rem]">
                Ako želite da zamenite fajl novom verzijom, izaberite novi fajl ispod.
              </p>
            </div>
          </div>
        )}

        {/* Podaci kandidata za popunjavanje */}
        <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.02] p-4 space-y-3">
          <p className="text-xs font-bold text-[var(--brand-ink)]">
            Podaci kandidata za automatsko popunjavanje ugovora:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[0.7rem] font-bold text-[var(--brand-ink)]/70 mb-1">
                Ime i prezime kandidata
              </label>
              <input
                type="text"
                disabled
                value={`${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || candidate.name || ""}
                className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-2 text-xs font-semibold text-black/70 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold text-[var(--brand-ink)]/70 mb-1">
                E-mail adresa
              </label>
              <input
                type="email"
                disabled
                value={candidate.email}
                className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-2 text-xs font-semibold text-black/70 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold text-[var(--brand-ink)]/70 mb-1">
                JMBG (13 cifara) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={13}
                value={jmbg}
                onChange={(e) => setJmbg(e.target.value.replace(/\D/g, ""))}
                placeholder="Unesite 13 cifara JMBG-a"
                className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs font-mono font-bold focus:border-[var(--brand-ink)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold text-[var(--brand-ink)]/70 mb-1">
                Broj pasoša <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                placeholder="npr. 010948212"
                className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs font-mono font-bold focus:border-[var(--brand-ink)] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 4 koraka */}
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-yellow)] text-xs font-black text-[var(--brand-ink)]">
                1
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--brand-ink)]">
                  Preuzmite zvaničnu ugovornu dokumentaciju (PDF)
                </p>
                <p className="text-[0.7rem] text-black/60">
                  Preuzmite originalna pravna dokumenta agencije American Adventure sa svim članovima i 16 tačaka Izjave o odgovornosti:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <a
                    href={isSelf ? "/documents/SELF_UGOVOR_2027.pdf" : "/documents/FULL_Lifeguard_UGOVOR_2027.pdf"}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-ink)] shadow-2xs hover:bg-black/5"
                  >
                    📄 Originalni Ugovor agencije (PDF)
                  </a>
                  <a
                    href="/documents/Izjava_o_odgovornosti_2027.pdf"
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-ink)] shadow-2xs hover:bg-black/5"
                  >
                    📄 Izjava o odgovornosti (PDF)
                  </a>
                  <a
                    href="/documents/Saglasnost_Vazne_informacije_SWT_USA_2027.pdf"
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-ink)] shadow-2xs hover:bg-black/5"
                  >
                    📄 Saglasnost & Važne info (PDF)
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadBoth}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-2xs hover:bg-amber-100"
                  >
                    🖨️ Popunjeni ugovorni obrazac sa JMBG (Print/PDF)
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-black/5 my-2" />

            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/10 text-xs font-black text-[var(--brand-ink)]">
                2
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--brand-ink)]">
                  Odštampajte na papir i svojeručno potpišite olovkom
                </p>
                <p className="text-[0.7rem] text-black/60">
                  Odštampajte dokumente na A4 formatu i plavom ili crnom hemijskom olovkom potpišite na polju „Potpis kandidata / davaoca izjave”.
                </p>
              </div>
            </div>

            <hr className="border-black/5 my-2" />

            {/* Korak 3: Upload */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink)] text-xs font-black text-white">
                3
              </span>
              <div className="w-full">
                <p className="text-xs font-bold text-[var(--brand-ink)]">
                  Skenirajte ili uslikajte telefonom i okačite ovde
                </p>
                <p className="text-[0.7rem] text-black/60 mb-2">
                  Format: PDF, JPG, PNG ili slika visoke rezolucije sa jasnim potpisom.
                </p>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                    dragOver
                      ? "border-[var(--brand-ink)] bg-amber-50/50"
                      : selectedFile
                      ? "border-green-500 bg-green-50/40"
                      : "border-black/20 hover:border-black/40 bg-black/[0.01]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-900">
                      <CheckIcon className="h-4 w-4 text-green-700" />
                      <span>Izabran fajl: {selectedFile.name}</span>
                      <span className="text-[0.7rem] text-black/50">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black/60">
                        <UploadIcon className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-[var(--brand-ink)]">
                        Kliknite ovde za izbor fajla ili ga prevucite
                      </p>
                      <p className="text-[0.68rem] text-black/50">
                        Podržano: PDF, JPG, PNG do 25 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-900 animate-in fade-in">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/[0.08] pt-4">
            <button
              type="button"
              onClick={handleQuickDemoSubmit}
              disabled={isUploading}
              title="Automatski generiše i okači primerak potpisanog ugovora radi trenutnog testiranja"
              className="text-[0.72rem] font-bold text-black/60 underline hover:text-black transition-colors"
            >
              ⚡ Ubaci demo primerak (test bez štampača)
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-xs font-bold text-black/70 hover:bg-black/5"
              >
                Zatvori
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading || !selectedFile}
                className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] shadow-md hover:brightness-105 disabled:opacity-50 transition-all flex items-center gap-2"
                style={{ backgroundColor: BRAND_YELLOW }}
              >
                {isUploading ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Kačenje u toku...
                  </>
                ) : (
                  "Okači potpisani ugovor ✓"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
