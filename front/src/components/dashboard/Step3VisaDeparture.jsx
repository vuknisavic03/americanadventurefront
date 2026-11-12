// front/src/components/dashboard/Step3VisaDeparture.jsx
import { PlaneIcon, BuildingIcon, UploadIcon } from "./icons";
import { downloadPaymentSlipPdf, getDs160Status } from "../../data/candidateStore";

import { StepShell } from "./ui";

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
    <StepShell
      index="3"
      state={isStep3Done ? "done" : isStepGateLocked ? "locked" : "current"}
      kicker="Korak 3"
      title={isFullPaid ? "Ambasada SAD, viza i polazak" : "Ambasada SAD, viza, III rata i polazak"}
      description={`Izdavanje sponzorskog DS-2019 obrasca, viziranje u Ambasadi SAD${isFullPaid ? "" : ", završna rata (ili PKZ podsetnik)"} i priprema za let.`}
      status={
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${
              isStep3Done
                ? "bg-emerald-100 text-emerald-800"
                : isThirdInstallmentPending
                ? "bg-amber-100 text-amber-800"
                : status === "departure"
                ? "bg-amber-100 text-amber-800"
                : isStepGateLocked
                ? "bg-surface-2 text-ink-2"
                : "bg-surface-2 text-ink-3"
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
      }
    >

      {/* Gate upozorenje ako II rata nije uplaćena u Koraku 2 (samo ako kandidat ne plaća odjednom) */}
      {isStepGateLocked && (
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3.5 text-[13px] text-amber-900 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-amber-950 text-sm">
                Korak 3 je zaključan: Čeka se potvrda uplate II rate programa
              </p>
              <p className="text-amber-900/80 mt-0.5">
                Američki State Department sponzor izdaje i šalje originalni DS-2019 formular tek nakon što administrator potvrdi knjiženje II rate programa.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900">
            Potreban Korak 2
          </span>
        </div>
      )}

      {/* Poruke o stanju */}
      {status === "ready" && (
        <div className="flex items-start gap-4 rounded-2xl bg-emerald-50 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <PlaneIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-emerald-950">Čestitamo! Tvoja J-1 viza je odobrena</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-emerald-900">
              Tvoj dosije, sponzorski DS-2019 ugovor i razgovor u Ambasadi SAD su uspešno završeni. Pasoš sa odobrenom J-1 vizom je spreman za preuzimanje u agenciji.
            </p>
          </div>
        </div>
      )}

      {status === "departure" && (
        <div className="flex items-start gap-4 rounded-2xl bg-amber-50 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
            <BuildingIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-ink">Priprema za razgovor u Ambasadi SAD</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-2">
              Tvoj posao u SAD je potvrđen i sponzor je izdao originalni DS-2019 obrazac. Agencija je uplatila SEVIS taksu i popunila DS-160 aplikaciju.
            </p>
          </div>
        </div>
      )}

      {/* Podkoraci 3.1 - 3.5 */}
      <div className="space-y-4">
        {/* Podkorak 3.1: DS-2019 & SEVIS */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-base font-semibold leading-snug text-ink">
              DS-2019 Obrazac (Certificate of Eligibility) & SEVIS Taksa
            </h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isDeparture
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-surface-2 text-ink-3"
              }`}
            >
              {isDeparture ? "DS-2019 Izdat" : "U obradi kod sponzora"}
            </span>
          </div>
          <p className="text-[13px] text-ink-2">
            Američki State Department ovlašćeni sponzor izdaje vaš originalni DS-2019 formular koji je pravni preduslov za zakazivanje intervjua u Ambasadi SAD.
          </p>
        </div>

        {/* Podkorak 3.2: DS-160 viza upitnik */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-base font-semibold leading-snug text-ink">
              DS-160 Viza upitnik & Zakazivanje termina u Ambasadi SAD
            </h4>
            {(() => {
              const dsSt = getDs160Status(candidate.ds160);
              if (dsSt.isComplete) {
                return (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-medium">
                    DS-160 Kompletiran
                  </span>
                );
              }
              if (dsSt.isStarted) {
                return (
                  <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-medium">
                    DS-160 U izradi ({dsSt.filledCount}/{dsSt.totalCount})
                  </span>
                );
              }
              return (
                <span className="rounded-full bg-neutral-200 text-ink-3 px-3 py-1 text-xs font-medium">
                  Potrebno popuniti upitnik
                </span>
              );
            })()}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
            <p className="text-ink-2">
              Elektronski upitnik za vizu. Koordinatori agencije pregledaju podatke i zakazuju termin u Ambasadi SAD (Kneza Miloša 50, Beograd).
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/documents/UPITNIK_za_izradu_DS160_J1.docx"
                download="UPITNIK_za_izradu_DS160_J1.docx"
                className="rounded-full border border-line-strong bg-white px-3 py-2 text-[13px] font-semibold text-ink hover:bg-surface shrink-0"
                title="Preuzmite zvanični formular u Word formatu"
              >
                Preuzmi Word (.docx)
              </a>
              <button
                type="button"
                onClick={() => setShowDs160Modal(true)}
                className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-neutral-950 shrink-0"
              >
                Otvori DS-160 Upitnik
              </button>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <span className="text-[13px] text-ink-3">
              Zvanični nalog za uplatu troškova viziranja ($185 USD u dinarskoj protivvrednosti po kursu NBS):
            </span>
            <a
              href="/documents/Uplatnica_viziranje.docx"
              download="Uplatnica_viziranje.docx"
              className="inline-flex items-center gap-1 text-ink hover:underline font-semibold text-[13px]"
            >
              Preuzmi uplatnicu za viziranje ($185) ↗
            </a>
          </div>
        </div>

        {/* Podkorak 3.3: Vizni intervju */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-base font-semibold leading-snug text-ink">
              Priprema i razgovor u Ambasadi SAD (Kneza Miloša 50, Beograd)
            </h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isReady
                  ? "bg-emerald-100 text-emerald-800"
                  : status === "departure"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-surface-2 text-ink-3"
              }`}
            >
              {isReady
                ? "J-1 Viza odobrena"
                : status === "departure"
                ? "Termin u pripremi"
                : "Čeka DS-160"}
            </span>
          </div>
          <div className="text-[13px] text-ink-2 space-y-1">
            <p>
              Pre odlaska u ambasadu, agencija organizuje obaveznu <strong>simulaciju viznog razgovora</strong> sa koordinatorom.
            </p>
            <p className="text-[13px] text-ink-3">
              Sa sobom nosite: Pasoš, DS-2019, SEVIS potvrdu, overeno uverenje sa fakulteta sa sudskim prevodom i indeks.
            </p>
          </div>
        </div>

        {/* Podkorak 3.4: III Rata / PKZ Podsetnik */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-base font-semibold leading-snug text-ink">
              {isFullPaid
                ? "Finansijski status: Program uplaćen u celosti"
                : "Nakon viziranja: III Rata Programa / PKZ Dospeće (Kroz zaradu)"}
            </h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isFullPaid || isThirdInstallmentPaid
                  ? "bg-emerald-100 text-emerald-800"
                  : candidate.packageId?.includes("pkz") ||
                    candidate.pkzReminderActive ||
                    candidate.discountNote?.includes("PKZ")
                  ? "bg-amber-100 text-amber-800"
                  : isThirdInstallmentPending
                  ? "bg-amber-100 text-amber-800"
                  : "bg-surface-2 text-ink"
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
            <div className="rounded-xl bg-emerald-50 p-3.5 text-[13px] text-emerald-950 space-y-1">
              <p className="font-semibold text-emerald-900">
                Program uplaćen u celosti — Sve finansijske obaveze prema agenciji su izmirene
              </p>
              <p className="text-emerald-950/80 leading-relaxed">
                Uplatili ste program u celosti prilikom registracije. Nemate obavezu uplate III rate niti obavezu po osnovu PKZ modela. Vaša viza i dokumentacija su slobodni za preuzimanje po završetku razgovora u ambasadi.
              </p>
            </div>
          ) : candidate.packageId?.includes("pkz") ||
            candidate.pkzReminderActive ||
            candidate.discountNote?.includes("PKZ") ? (
            <div className="rounded-xl bg-amber-50 p-3 text-[13px] text-amber-950">
              <div className="flex items-start gap-2.5">
                <span className="font-semibold text-amber-800">[PKZ]</span>
                <div>
                  <p className="font-semibold text-amber-900">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
                <div>
                  <p className="font-semibold text-ink">
                    Iznos III rate: {rate3EurAmount} € (U dinarskoj protivvrednosti po srednjem kursu NBS)
                  </p>
                  <p className="text-ink-3 mt-0.5">
                    Uplata se vrši preko agencije pre preuzimanja pasoša sa odobrenom vizom ili pre poletanja za SAD.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadPaymentSlipPdf(candidate.id, candidate.email)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-neutral-950"
                  >
                    <UploadIcon className="h-3.5 w-3.5 rotate-180" />
                    <span>Preuzmi nalog (IPS QR)</span>
                  </button>

                  {!isThirdInstallmentPending && (
                    <button
                      type="button"
                      onClick={handleReportThirdInstallment}
                      className="rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-neutral-950 transition-colors"
                    >
                      Prijavi uplatu III rate &rarr;
                    </button>
                  )}
                </div>
              </div>

              {isThirdInstallmentPending && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-950">
                  <div>
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      Uplata III rate prijavljena — čeka se knjiženje administratora
                    </p>
                    <p className="text-[13px] text-amber-900/80 mt-0.5">
                      Administrator vrši proveru uplate pre izdavanja originalnog pasoša sa vizom i overene avio karte.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[13px] font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-lg">
              Sve finansijske obaveze prema agenciji su izmirene u celosti. Pasoš i avio karta su slobodni za preuzimanje!
            </div>
          )}
        </div>

        {/* Podkorak 3.5: Orijentacija pred put & Karta */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-base font-semibold leading-snug text-ink">
              Orijentacija pred put (Pre-Departure Orientation) & Avio karta
            </h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isReady
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-surface-2 text-ink-3"
              }`}
            >
              {isReady ? "Spremno za polazak" : "Nakon dobijanja vize"}
            </span>
          </div>
          <p className="text-[13px] text-ink-2">
            Pre poletanja, obavezno je prisustvo PDO sesiji (orijentacija o pravima i obavezama učesnika, aktivacija zdravstvenog osiguranja, apliciranje za Social Security Number - SSN i uputstva za putovanje).
          </p>
        </div>
      </div>
    </StepShell>
  );
}
