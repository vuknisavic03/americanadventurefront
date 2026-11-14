// front/src/components/dashboard/PaymentsView.jsx
// Sve što ima veze sa novcem, na jednom mestu: plan uplata, uplatnice, računi i popusti.
import { useState } from "react";
import { Button, cx } from "../ui";
import { ReceiptIcon } from "./icons";
import { Panel, StatusPill, LinkButton, DataList } from "./ui";
import { formatRsdAmount, generateNbsIpsString } from "../../data/invoicesStore";
import { openPrintablePaymentSlipWindow, downloadPaymentSlipPdf } from "../../data/candidateStore";
import { firstPaymentAmount } from "./Step0Registration";
import { isPkz, thirdInstallmentAmount } from "./Step3VisaDeparture";

function PaymentRow({ id, title, note, amount, tone, statusLabel, children }) {
  return (
    <li id={id} className="scroll-mt-28 py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">{title}</p>
          {note && <p className="mt-0.5 text-sm text-ink-3">{note}</p>}
        </div>
        <div className="flex items-center gap-3">
          {amount && <span className="text-[15px] font-semibold tabular-nums text-ink">{amount}</span>}
          <StatusPill tone={tone}>{statusLabel}</StatusPill>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </li>
  );
}

/** Uplatnica za II ratu sa automatskim dinarskim iznosom i NBS IPS QR kodom. */
function Rate2Slip({ candidate, nbsRate }) {
  const rate2EurAmount = Number(candidate.secondInstallmentAmount) || 400;
  const rate2RsdAmount = candidate.secondInstallmentPaidRsd
    ? candidate.secondInstallmentPaidRsd.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : formatRsdAmount(rate2EurAmount, nbsRate, "EUR");
  const candShortId = String(candidate.id || "1042").replace(/[^0-9]/g, "").slice(-4) || "1042";
  const payer = candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || "Student Kandidat";
  const ipsPayload = generateNbsIpsString({
    account: "160600000072871784",
    recipient: "American Adventure d.o.o. Beograd",
    amountRsd: rate2RsdAmount,
    payer,
    code: "289",
    purpose: `Uplata II rate SWT ${candidate.selectedJobEmployer || ""}`.trim().slice(0, 35),
    model: "97",
    reference: `AA2026R2${candShortId}`,
  });

  const box = "rounded-lg border border-line-strong bg-white px-3 py-2";
  const label = "mb-1 block text-xs text-ink-3";

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-3 text-sm">
          <div>
            <span className={label}>Uplatilac</span>
            <div className={box}>
              <p className="font-medium text-ink">{payer}</p>
              <p className="text-ink-3">{candidate.address || candidate.homeAddress || candidate.studyCity || "Srbija"}</p>
            </div>
          </div>
          <div>
            <span className={label}>Svrha uplate</span>
            <div className={box}>
              <p className="font-medium text-ink">Uplata II rate programa — Work & Travel USA 2026</p>
              <p className="text-ink-3">
                {candidate.selectedJobTitle || "Radna ponuda"} ({candidate.selectedJobEmployer || "poslodavac u SAD"})
              </p>
            </div>
          </div>
          <div>
            <span className={label}>Primalac</span>
            <div className={box}>
              <p className="font-medium text-ink">American Adventure d.o.o.</p>
              <p className="text-ink-3">Gospodar Jevremova 59/4, 11000 Beograd</p>
              <p className="text-xs tabular-nums text-ink-3">PIB 105311717 · MB 20356090</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className={label}>Šifra pl.</span>
              <div className={cx(box, "text-center tabular-nums font-medium")}>189</div>
            </div>
            <div>
              <span className={label}>Valuta</span>
              <div className={cx(box, "text-center font-medium")}>RSD</div>
            </div>
            <div>
              <span className={label}>Iznos</span>
              <div className={cx(box, "text-right font-semibold tabular-nums text-ink")}>{rate2RsdAmount}</div>
            </div>
          </div>
          <div>
            <span className={label}>Račun primaoca</span>
            <div className={cx(box, "text-center font-semibold tabular-nums tracking-wide")}>160-6000000728717-84</div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <span className={label}>Model</span>
              <div className={cx(box, "text-center tabular-nums font-medium")}>97</div>
            </div>
            <div className="col-span-3">
              <span className={label}>Poziv na broj</span>
              <div className={cx(box, "text-center tabular-nums font-medium")}>AA-2026-R2-{candShortId}</div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-ink-3">
            {rate2EurAmount},00 € × {Number(nbsRate).toFixed(4)} (srednji kurs NBS) = {rate2RsdAmount} RSD
          </p>
        </div>

        <div className="flex flex-row items-center gap-4 md:flex-col md:items-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=2&data=${encodeURIComponent(ipsPayload)}`}
            alt="NBS IPS QR kod za uplatu II rate"
            className="h-28 w-28 rounded-lg border border-line bg-white"
            loading="lazy"
          />
          <p className="max-w-40 text-xs leading-relaxed text-ink-3 md:text-center">
            U m-bankingu izaberi „IPS skeniraj“ — podaci se popune sami.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsView({ ctx }) {
  const {
    candidate,
    hasSignedContract,
    isFirstInstallmentPaid,
    isFirstInstallmentPending,
    hasConfirmedJob,
    isSecondInstallmentPaid,
    isSecondInstallmentPending,
    isThirdInstallmentPaid,
    isThirdInstallmentPending,
    isReady,
    handlePaymentSlipClick,
    handleReportFirstInstallment,
    handleReportSecondInstallment,
    handleReportThirdInstallment,
    setShowInvoicesModal,
    candidateInvoices,
    setShowChangeDiscountModal,
    nbsRate,
  } = ctx;
  const [copied, setCopied] = useState(false);
  const [showSlip2, setShowSlip2] = useState(false);

  const isFull = candidate.paymentMethod === "now";
  const fullyPaid = isFull || candidate.isFullPaymentPaid;
  const pkz = isPkz(candidate);
  const total = candidate.finalPrice || candidate.basePrice || 1850;
  const first = firstPaymentAmount(candidate);
  const rate2 = Number(candidate.secondInstallmentAmount) || 400;
  const rate3 = thirdInstallmentAmount(candidate);

  const st = (paid, pending, open) =>
    paid
      ? { tone: "done", statusLabel: "Plaćeno" }
      : pending
      ? { tone: "wait", statusLabel: "Proveravamo" }
      : open
      ? { tone: "neutral", statusLabel: "Za uplatu" }
      : { tone: "neutral", statusLabel: "Kasnije" };

  const modelLabel =
    candidate.paymentMethod === "later"
      ? "Plati kad se vratiš (uz jemca)"
      : candidate.paymentMethod === "pkz"
      ? "PKZ — treća rata iz zarade u SAD"
      : candidate.paymentMethod === "installments"
      ? "U tri rate"
      : "U celosti";

  return (
    <div className="space-y-4">
      <Panel
        title="Plan uplata"
        description="Sve uplate idu u dinarima po srednjem kursu NBS na dan uplate. Posle svake uplate klikni „Prijavi uplatu“ da bismo je brže proknjižili."
        aside={
          <Button variant="outline" size="sm" onClick={() => setShowInvoicesModal(true)}>
            <ReceiptIcon className="h-4 w-4 text-ink-3" />
            Moji računi
            {candidateInvoices.length > 0 && (
              <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular-nums text-ink-2">{candidateInvoices.length}</span>
            )}
          </Button>
        }
      >
        <ul className="divide-y divide-line">
          <PaymentRow
            id="pay-rate1"
            title={isFull ? "Program u celosti" : "I rata"}
            note="Uz potpisan ugovor"
            amount={`${first} €`}
            {...st(isFirstInstallmentPaid, isFirstInstallmentPending, hasSignedContract)}
          >
            {!isFirstInstallmentPaid && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <LinkButton onClick={handlePaymentSlipClick}>Uplatnica sa IPS QR kodom</LinkButton>
                {hasSignedContract && !isFirstInstallmentPending && (
                  <LinkButton onClick={handleReportFirstInstallment}>Prijavi uplatu</LinkButton>
                )}
              </div>
            )}
          </PaymentRow>

          {!fullyPaid && (
            <PaymentRow
              id="pay-rate2"
              title="II rata"
              note="Kad potvrdiš posao (Job Offer)"
              amount={`${rate2} €`}
              {...st(isSecondInstallmentPaid, isSecondInstallmentPending, hasConfirmedJob)}
            >
              {!isSecondInstallmentPaid && !hasConfirmedJob && !showSlip2 && (
                <LinkButton onClick={() => setShowSlip2(true)}>Prikaži uplatnicu</LinkButton>
              )}
              {!isSecondInstallmentPaid && (hasConfirmedJob || showSlip2) && (
                <div className="space-y-3">
                  <Rate2Slip candidate={candidate} nbsRate={nbsRate} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <LinkButton
                      onClick={() =>
                        openPrintablePaymentSlipWindow({ id: candidate.id, email: candidate.email, type: "rate2", customRate: nbsRate })
                      }
                    >
                      Odštampaj uplatnicu / PDF
                    </LinkButton>
                    {hasConfirmedJob && !isSecondInstallmentPending && (
                      <LinkButton onClick={handleReportSecondInstallment}>Prijavi uplatu</LinkButton>
                    )}
                  </div>
                </div>
              )}
            </PaymentRow>
          )}

          {!fullyPaid && (
            <PaymentRow
              id="pay-rate3"
              title={pkz ? "III rata — iz zarade u SAD" : "III rata"}
              note={pkz ? "Plaća se iz prvih plata kod poslodavca" : "Pre preuzimanja pasoša sa vizom"}
              amount={`${rate3} €`}
              {...(pkz
                ? { tone: "neutral", statusLabel: "PKZ" }
                : st(isThirdInstallmentPaid, isThirdInstallmentPending, isSecondInstallmentPaid))}
            >
              {!pkz && !isThirdInstallmentPaid && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <LinkButton onClick={() => downloadPaymentSlipPdf(candidate.id, candidate.email)}>Uplatnica sa IPS QR kodom</LinkButton>
                  {isSecondInstallmentPaid && !isThirdInstallmentPending && (
                    <LinkButton onClick={handleReportThirdInstallment}>Prijavi uplatu</LinkButton>
                  )}
                </div>
              )}
            </PaymentRow>
          )}

          <PaymentRow
            id="pay-visa"
            title="Vizna taksa"
            note="Plaća se Ambasadi SAD, pre razgovora"
            amount="185 $"
            {...(isReady ? { tone: "done", statusLabel: "Plaćeno" } : { tone: "neutral", statusLabel: "U Koraku 3" })}
          >
            {!isReady && (
              <a
                href="/documents/Uplatnica_viziranje.docx"
                download="Uplatnica_viziranje.docx"
                className="text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                Uplatnica za viznu taksu
              </a>
            )}
          </PaymentRow>
        </ul>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Ugovorena cena">
          <DataList
            cols={1}
            items={[
              ["Ukupno", <span className="tabular-nums">{total} €</span>],
              ["Način plaćanja", modelLabel],
              ...(candidate.discount > 0 ? [["Uračunat popust", `${candidate.discount} $`]] : []),
              ...(candidate.guarantor
                ? [["Jemac", `${candidate.guarantor.name} (${candidate.guarantor.promissoryNotesCount} menice)`]]
                : []),
            ]}
          />
        </Panel>

        <Panel
          title="Popusti i preporuke"
          aside={<LinkButton onClick={() => setShowChangeDiscountModal(true)}>Promeni popust</LinkButton>}
        >
          <DataList
            cols={1}
            items={[
              ["Aktivna promocija", candidate.discountNote || "Nema"],
              [
                "Obračun",
                candidate.discountTiming === "end" ? "Na poslednjoj rati" : "Odmah umanjuje cenu",
              ],
              [
                "Dovedi prijatelja — 100 $",
                <span className="flex items-center justify-end gap-3">
                  <span className="tabular-nums">{candidate.referralCode || "WT-REF"}</span>
                  <LinkButton
                    onClick={() => {
                      navigator.clipboard?.writeText(candidate.referralCode || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "Kopirano" : "Kopiraj"}
                  </LinkButton>
                </span>,
              ],
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
