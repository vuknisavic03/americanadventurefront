// front/src/components/dashboard/Step3VisaDeparture.jsx
import { PlaneIcon, BuildingIcon, UploadIcon } from "./icons";
import { downloadPaymentSlipPdf, getDs160Status } from "../../data/candidateStore";

export default function Step3VisaDeparture({
  candidate,
  status,
  isStep3Done,
  isDeparture,
  isReady,
  isSecondInstallmentPaid,
  isThirdInstallmentPaid,
  isThirdInstallmentPending,
  handleReportThirdInstallment,
  handleConfirmThirdInstallment,
  setShowDs160Modal,
  updateCandidateState,
  setUploadToast,
}) {
  const isFullPaid = candidate.paymentMethod === "now" || candidate.isFullPaymentPaid;
  const isStepGateLocked = !isSecondInstallmentPaid && !isFullPaid;
  const rate3EurAmount = candidate.thirdInstallmentAmount !== undefined
    ? candidate.thirdInstallmentAmount
    : Math.max(0, (candidate.finalPrice || 1750) - (candidate.firstInstallmentAmount || 250) - (candidate.secondInstallmentAmount || 400));

  return (
    <section className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-xs sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-sm shadow-xs">
            3
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                KORAK 3
              </span>
              <h2 className="text-base sm:text-lg font-black text-[var(--brand-ink)]">
                {isFullPaid
                  ? "Ambasada SAD, Viza & Polazak"
                  : "Ambasada SAD, Viza, III Rata / PKZ & Polazak"}
              </h2>
            </div>
            <p className="text-xs text-[var(--brand-ink)]/65 mt-0.5">
              Izdavanje sponzorskog DS-2019 obrasca, viziranje u Ambasadi SAD{isFullPaid ? "" : ", završna rata (ili PKZ podsetnik)"} i priprema za let.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3.5 py-1 text-xs font-bold ${
            isStep3Done
              ? "bg-green-100 text-green-900 border border-green-300"
              : isThirdInstallmentPending
              ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
              : status === "departure"
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : isStepGateLocked
              ? "bg-slate-100 text-slate-700 border border-slate-300"
              : "bg-black/[0.05] text-black/50"
          }`}
        >
          {isStep3Done
            ? "Viza odobrena — Spreman za polazak!"
            : isThirdInstallmentPending
            ? "Čeka potvrdu III rate pre preuzimanja vize"
            : status === "departure"
            ? "Termin u ambasadi SAD zakazan"
            : isStepGateLocked
            ? "Zaključano do uplate II rate"
            : "Čeka DS-2019 i viziranje"}
        </span>
      </div>

      {/* Gate upozorenje ako II rata nije uplaćena u Koraku 2 (samo ako kandidat ne plaća odjednom) */}
      {isStepGateLocked && (
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-base">
              !
            </span>
            <div>
              <p className="font-bold text-amber-950 text-sm">
                Korak 3 je zaključan: Čeka se potvrda uplate II rate programa
              </p>
              <p className="text-amber-900/80 mt-0.5">
                Američki State Department sponzor izdaje i šalje originalni DS-2019 formular tek nakon što administrator potvrdi knjiženje II rate programa.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-[11px] font-black text-amber-900">
            Potreban Korak 2
          </span>
        </div>
      )}

      {/* Status banners */}
      {status === "ready" && (
        <div className="mt-3.5 rounded-2xl border-2 border-green-500 bg-gradient-to-br from-green-50 via-white to-green-50/50 p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white shadow-md">
                <PlaneIcon className="h-6 w-6" />
              </span>
              <div>
                <span className="inline-block rounded-full bg-green-200 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide text-green-900">
                  ZAVRŠENO — VIZA ODOBRENA / SPREMAN ZA POLAZAK
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-green-950 sm:text-xl">
                  Čestitamo! Tvoja J-1 viza je zvanično odobrena
                </h3>
              </div>
            </div>
            <span className="rounded-full bg-green-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs">
              Polazak u SAD potvrđen
            </span>
          </div>
          <p className="mt-3 text-sm text-green-900/80 leading-relaxed">
            Tvoj dosije, sponzorski DS-2019 ugovor i razgovor u ambasadi SAD su uspešno završeni. Tvoj pasoš sa odobrenom J-1 vizom je spreman za preuzimanje u agenciji.
          </p>
        </div>
      )}

      {status === "departure" && (
        <div className="mt-3.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <BuildingIcon className="h-6 w-6" />
              </span>
              <div>
                <span className="inline-block rounded-full bg-amber-200 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide text-amber-900">
                  DS-2019 IZDAT & TERMIN U AMBASADI
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-amber-950 sm:text-xl">
                  Priprema za razgovor u ambasadi SAD
                </h3>
              </div>
            </div>
            <span className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs">
              Čekanje na vizu
            </span>
          </div>
          <p className="mt-3 text-sm text-amber-950/80 leading-relaxed">
            Tvoj posao u SAD je zvanično potvrđen i sponzor je izdao tvoj originalni DS-2019 obrazac. Agencija je uplatila SEVIS taksu i popunila DS-160 aplikaciju.
          </p>
        </div>
      )}

      {/* Podkoraci 3.1 - 3.5 */}
      <div className="mt-3.5 space-y-2.5">
        {/* Podkorak 3.1: DS-2019 & SEVIS */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              DS-2019 Obrazac (Certificate of Eligibility) & SEVIS Taksa
            </h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                isDeparture
                  ? "bg-green-100 text-green-900 border border-green-300"
                  : "bg-black/10 text-black/50"
              }`}
            >
              {isDeparture ? "DS-2019 Izdat" : "U obradi kod sponzora"}
            </span>
          </div>
          <p className="text-xs text-[var(--brand-ink)]/70">
            Američki State Department ovlašćeni sponzor izdaje vaš originalni DS-2019 formular koji je pravni preduslov za zakazivanje intervjua u Ambasadi SAD.
          </p>
        </div>

        {/* Podkorak 3.2: DS-160 viza upitnik */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              DS-160 Viza upitnik & Zakazivanje termina u Ambasadi SAD
            </h4>
            {(() => {
              const dsSt = getDs160Status(candidate.ds160);
              if (dsSt.isComplete) {
                return (
                  <span className="rounded-full bg-green-100 text-green-900 border border-green-300 px-2.5 py-0.5 text-[10px] font-bold">
                    DS-160 Kompletiran
                  </span>
                );
              }
              if (dsSt.isStarted) {
                return (
                  <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold">
                    DS-160 U izradi ({dsSt.filledCount}/{dsSt.totalCount})
                  </span>
                );
              }
              return (
                <span className="rounded-full bg-black/10 text-black/60 border border-black/10 px-2.5 py-0.5 text-[10px] font-bold">
                  Potrebno popuniti upitnik
                </span>
              );
            })()}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <p className="text-[var(--brand-ink)]/70">
              Elektronski upitnik za vizu. Koordinatori agencije pregledaju podatke i zakazuju termin u Ambasadi SAD (Kneza Miloša 50, Beograd).
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/documents/UPITNIK_za_izradu_DS160_J1.docx"
                download="UPITNIK_za_izradu_DS160_J1.docx"
                className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 shrink-0"
                title="Preuzmite zvanični formular u Word formatu"
              >
                Preuzmi Word (.docx)
              </a>
              <button
                type="button"
                onClick={() => setShowDs160Modal(true)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black shrink-0 shadow-xs"
              >
                Otvori DS-160 Upitnik
              </button>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-slate-500">
              Zvanični nalog za uplatu troškova viziranja ($185 USD u dinarskoj protivvrednosti po kursu NBS):
            </span>
            <a
              href="/documents/Uplatnica_viziranje.docx"
              download="Uplatnica_viziranje.docx"
              className="inline-flex items-center gap-1 text-blue-700 hover:underline font-bold text-xs"
            >
              Preuzmi uplatnicu za viziranje ($185) ↗
            </a>
          </div>
        </div>

        {/* Podkorak 3.3: Vizni intervju */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              Priprema i razgovor u Ambasadi SAD (Kneza Miloša 50, Beograd)
            </h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                isReady
                  ? "bg-green-100 text-green-900 border border-green-300"
                  : status === "departure"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-black/10 text-black/50"
              }`}
            >
              {isReady
                ? "J-1 Viza odobrena"
                : status === "departure"
                ? "Termin u pripremi"
                : "Čeka DS-160"}
            </span>
          </div>
          <div className="text-xs text-[var(--brand-ink)]/70 space-y-1">
            <p>
              Pre odlaska u ambasadu, agencija organizuje obaveznu <strong>simulaciju viznog razgovora</strong> sa koordinatorom.
            </p>
            <p className="text-[11px] text-[var(--brand-ink)]/55">
              Sa sobom nosite: Pasoš, DS-2019, SEVIS potvrdu, overeno uverenje sa fakulteta sa sudskim prevodom i indeks.
            </p>
          </div>
        </div>

        {/* Podkorak 3.4: III Rata / PKZ Podsetnik */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              {isFullPaid
                ? "Finansijski status: Program uplaćen u celosti"
                : "Nakon viziranja: III Rata Programa / PKZ Dospeće (Kroz zaradu)"}
            </h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                isFullPaid || isThirdInstallmentPaid
                  ? "bg-green-100 text-green-900 border border-green-300"
                  : candidate.packageId?.includes("pkz") ||
                    candidate.pkzReminderActive ||
                    candidate.discountNote?.includes("PKZ")
                  ? "bg-amber-100 text-amber-950 border border-amber-300"
                  : isThirdInstallmentPending
                  ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                  : "bg-blue-100 text-blue-900 border border-blue-300"
              }`}
            >
              {isFullPaid || isThirdInstallmentPaid
                ? "Plaćeno u celosti"
                : candidate.packageId?.includes("pkz") ||
                  candidate.pkzReminderActive ||
                  candidate.discountNote?.includes("PKZ")
                ? "Aktivan PKZ Model"
                : isThirdInstallmentPending
                ? "Čeka potvrdu administratora"
                : `Čeka III ratu (${rate3EurAmount} €)`}
            </span>
          </div>

          {isFullPaid ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1">
              <p className="font-bold text-emerald-900">
                Program uplaćen u celosti — Sve finansijske obaveze prema agenciji su izmirene
              </p>
              <p className="text-emerald-950/80 leading-relaxed">
                Uplatili ste program u celosti prilikom registracije. Nemate obavezu uplate III rate niti obavezu po osnovu PKZ modela. Vaša viza i dokumentacija su slobodni za preuzimanje po završetku razgovora u ambasadi.
              </p>
            </div>
          ) : candidate.packageId?.includes("pkz") ||
            candidate.pkzReminderActive ||
            candidate.discountNote?.includes("PKZ") ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-amber-800">[PKZ]</span>
                <div>
                  <p className="font-bold text-amber-900">
                    Podsetnik za III ratu programa kroz zaradu (PKZ model):
                  </p>
                  <p className="mt-1 text-amber-950/80 leading-relaxed">
                    Prema ugovoru o programu sa PKZ opcijom (Plaćanje Kroz Zaradu), preostali iznos programa (treća rata) dospeva tokom vašeg boravka i rada u SAD. Iznos rate se otplaćuje direktno iz prvih plata kod američkog poslodavca po dolasku u Ameriku.
                  </p>
                </div>
              </div>
            </div>
          ) : !isThirdInstallmentPaid ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-[var(--brand-ink)]">
                    Iznos III rate: {rate3EurAmount} € (U dinarskoj protivvrednosti po srednjem kursu NBS)
                  </p>
                  <p className="text-[var(--brand-ink)]/60 mt-0.5">
                    Uplata se vrši preko agencije pre preuzimanja pasoša sa odobrenom vizom ili pre poletanja za SAD.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadPaymentSlipPdf(candidate.id, candidate.email)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-xs font-bold text-white hover:bg-black"
                  >
                    <UploadIcon className="h-3.5 w-3.5 rotate-180" />
                    <span>Preuzmi nalog (IPS QR)</span>
                  </button>

                  {!isThirdInstallmentPending && (
                    <button
                      type="button"
                      onClick={handleReportThirdInstallment}
                      className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                    >
                      Prijavi uplatu III rate &rarr;
                    </button>
                  )}
                </div>
              </div>

              {isThirdInstallmentPending && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
                  <div>
                    <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                      Uplata III rate prijavljena — čeka se knjiženje administratora
                    </p>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      Administrator vrši proveru uplate pre izdavanja originalnog pasoša sa vizom i overene avio karte.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs font-semibold text-green-800 bg-green-50 p-3 rounded-lg border border-green-200">
              Sve finansijske obaveze prema agenciji su izmirene u celosti. Pasoš i avio karta su slobodni za preuzimanje!
            </div>
          )}
        </div>

        {/* Podkorak 3.5: Orijentacija pred put & Karta */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2 mb-2">
            <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
              Orijentacija pred put (Pre-Departure Orientation) & Avio karta
            </h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                isReady
                  ? "bg-green-100 text-green-900 border border-green-300"
                  : "bg-black/10 text-black/50"
              }`}
            >
              {isReady ? "Spremno za polazak" : "Nakon dobijanja vize"}
            </span>
          </div>
          <p className="text-xs text-[var(--brand-ink)]/70">
            Pre poletanja, obavezno je prisustvo PDO sesiji (orijentacija o pravima i obavezama učesnika, aktivacija zdravstvenog osiguranja, apliciranje za Social Security Number - SSN i uputstva za putovanje).
          </p>
        </div>
      </div>
    </section>
  );
}
