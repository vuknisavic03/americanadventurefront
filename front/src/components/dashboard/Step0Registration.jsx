// front/src/components/dashboard/Step0Registration.jsx
// Registracija: izbor programa → ugovor → prva uplata → popusti.
import { useRef } from "react";
import { UploadIcon } from "./icons";
import { Button, buttonCls } from "../ui";
import { StepShell, Panel, Field, Notice, StatusPill } from "./ui";
import { downloadContractPdf, downloadResponsibilityStatementPdf } from "../../data/candidateStore";

const linkCls = "text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink";

export default function Step0Registration({
  candidate,
  hasSignedContract,
  isContractApproved,
  isContractPending,
  isFirstInstallmentPaid,
  isFirstInstallmentPending,
  isRegistrationDone,
  handleReportFirstInstallment,
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

  const isFull = candidate.paymentMethod === "now";
  const paymentAmount = isFull
    ? Number(candidate.finalPrice) || Number(candidate.basePrice) || 1750
    : Number(candidate.firstInstallmentAmount) || 250;

  const stepStatus = isRegistrationDone
    ? { tone: "done", label: "Registracija završena" }
    : isFirstInstallmentPending
    ? { tone: "wait", label: isFull ? "Čeka se potvrda uplate programa" : "Čeka se potvrda uplate I rate" }
    : isContractPending
    ? { tone: "wait", label: "Ugovor čeka overu administratora" }
    : hasSignedContract
    ? { tone: "neutral", label: isFull ? "Čeka uplatu programa" : "Čeka uplatu I rate" }
    : { tone: "neutral", label: "Čeka potpisani ugovor" };

  const paymentStatus = isFirstInstallmentPaid
    ? { tone: "done", label: isFull ? "Program plaćen u celosti" : "I rata plaćena" }
    : isFirstInstallmentPending
    ? { tone: "wait", label: "Čeka potvrdu administratora" }
    : hasSignedContract
    ? { tone: "neutral", label: "Čeka uplatu" }
    : { tone: "neutral", label: "Zaključano do ugovora" };

  const procedure = [
    { n: 1, title: "Preuzmi", text: "Ugovor i Izjava o odgovornosti stižu popunjeni tvojim podacima." },
    { n: 2, title: "Odštampaj", text: "Oba dokumenta na A4 formatu." },
    { n: 3, title: "Potpiši", text: "Svojeručno, na liniji za potpis studenta." },
    { n: 4, title: "Skeniraj i okači", text: "PDF ili fotografija potpisanog ugovora." },
  ];

  return (
    <StepShell
      index="0"
      state={isRegistrationDone ? "done" : "current"}
      kicker="Registracija"
      title={isFull ? "Program, ugovor i uplata u celosti" : "Program, ugovor i I rata"}
      description={
        isFull
          ? "Pravni i finansijski osnov učešća. Potpisan ugovor i uplata programa otključavaju Korak 1."
          : "Pravni i finansijski osnov učešća. Potpisan ugovor i uplata prve rate otključavaju Korak 1."
      }
      status={<StatusPill tone={stepStatus.tone}>{stepStatus.label}</StatusPill>}
    >
      {/* 0.1 Izabrani program i način plaćanja */}
      <Panel
        title="Izabrani program"
        aside={
          <span className="text-sm tabular-nums text-ink-3">
            Šifra prijave WT-{String(candidate.id || "2576").replace(/[^0-9]/g, "").slice(-4) || "2576"}
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Program i paket" hint="Smeštaj, američki poslodavac i DS-2019">
            {candidate.programName || "Work & Travel USA 2026 — Full Placement"}
          </Field>
          <Field
            label="Način plaćanja"
            hint={
              candidate.paymentMethod === "pkz"
                ? "Treća rata dospeva u SAD, iz prvih plata"
                : "Prva uplata ide uz potpisivanje ugovora"
            }
          >
            {candidate.paymentMethod === "pkz"
              ? "PKZ model (plaćanje kroz zaradu u SAD)"
              : candidate.paymentMethod === "installments"
              ? "Na rate (I, II i III rata)"
              : "U celosti (sa popustom)"}
          </Field>
          <Field
            label="Ukupna ugovorena cena"
            hint={candidate.discount > 0 ? `Uračunat popust od ${candidate.discount} $` : undefined}
          >
            <span className="text-lg tabular-nums">{candidate.finalPrice || candidate.basePrice || 1850} €</span>
          </Field>
        </div>
      </Panel>

      {/* 0.2 Ugovor o posredovanju i Izjava o odgovornosti */}
      <Panel
        title="Ugovor o posredovanju i Izjava o odgovornosti"
        description="Ugovor mora biti potpisan i okačen pre bilo kakve uplate."
        aside={
          <StatusPill tone={isContractApproved ? "done" : hasSignedContract ? "wait" : "neutral"}>
            {isContractApproved ? "Ugovor overen" : hasSignedContract ? "Okačen — čeka overu" : "Čeka potpis"}
          </StatusPill>
        }
      >
        <ol className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {procedure.map((s) => (
            <li key={s.n} className="border-t border-line-strong pt-3">
              <p className="text-xs tabular-nums text-ink-3">{s.n}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => downloadContractPdf(candidate.id, candidate.email)}>
            Ugovor (PDF)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}
          >
            Izjava o odgovornosti (PDF)
          </Button>

          {hasSignedContract ? (
            <span className="ml-auto flex min-w-0 items-center gap-3">
              <span className="truncate text-sm text-ink-2">
                {candidate.signedContractFileName || "Potpisani_Ugovor.pdf"}
              </span>
              <button type="button" onClick={() => inputRef.current?.click()} className={linkCls}>
                Zameni
              </button>
            </span>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="ml-auto"
              disabled={isUploadingSignedContract}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon className="h-4 w-4" />
              {isUploadingSignedContract ? "Kačenje…" : "Okači potpisani ugovor"}
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          className="sr-only"
          onChange={(e) => handleUploadSignedContract(e.target.files?.[0])}
        />

        {hasSignedContract && isContractApproved && (
          <Notice tone="done" className="mt-4">
            Pravni tim agencije je verifikovao i odobrio potpisani ugovor.
          </Notice>
        )}
        {hasSignedContract && isContractPending && (
          <Notice tone="wait" className="mt-4" title="Ugovor je okačen — čeka se verifikacija">
            Pravni tim proverava potpise i unete podatke. U međuvremenu možeš da preuzmeš uplatnicu.
          </Notice>
        )}
      </Panel>

      {/* 0.3 Prva uplata */}
      <Panel
        title={isFull ? `Uplata programa u celosti — ${paymentAmount} €` : `Uplata I rate — ${paymentAmount} €`}
        description={
          isFull
            ? "Jednokratna uplata na račun agencije, u dinarskoj protivvrednosti po srednjem kursu NBS na dan uplate. IPS QR kod je na uplatnici."
            : "Uplata na račun agencije, u dinarskoj protivvrednosti po srednjem kursu NBS na dan uplate. IPS QR kod je na uplatnici."
        }
        aside={<StatusPill tone={paymentStatus.tone}>{paymentStatus.label}</StatusPill>}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePaymentSlipClick}
            aria-disabled={!hasSignedContract}
            title={hasSignedContract ? undefined : "Ugovor mora biti okačen pre uplate"}
            className={buttonCls({
              variant: "outline",
              size: "sm",
              className: hasSignedContract ? "" : "cursor-not-allowed opacity-50",
            })}
          >
            <UploadIcon className="h-4 w-4 rotate-180" />
            Preuzmi uplatnicu (PDF)
          </button>

          {hasSignedContract && !isFirstInstallmentPaid && !isFirstInstallmentPending && (
            <Button variant="primary" size="sm" onClick={handleReportFirstInstallment}>
              {isFull ? "Prijavi uplatu programa" : "Prijavi uplatu I rate"}
            </Button>
          )}
        </div>

        {isFirstInstallmentPending && (
          <Notice
            tone="wait"
            className="mt-4"
            title={isFull ? "Uplata programa je prijavljena" : "Uplata I rate je prijavljena"}
          >
            Čim administrator potvrdi prijem uplate ({paymentAmount} €), otključava se Korak 1.
          </Notice>
        )}
        {isFirstInstallmentPaid && (
          <Notice tone="done" className="mt-4">
            {isFull
              ? `Uplata programa (${paymentAmount} €) je potvrđena i proknjižena.`
              : `Uplata prve rate (${paymentAmount} €) je potvrđena i proknjižena.`}
          </Notice>
        )}
      </Panel>

      {/* 0.4 Popusti i preporuke */}
      <Panel
        title="Popusti i preporuke"
        aside={
          <Button variant="outline" size="sm" onClick={() => setShowChangeDiscountModal(true)}>
            Promeni popust
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Aktivna promocija"
            hint={candidate.discount > 0 ? `Ušteda ${candidate.discount} $` : undefined}
          >
            {candidate.discountNote || "Nema aktivnog popusta"}
          </Field>
          <Field label="Obračun popusta">
            {candidate.discountTiming === "end" ? "Na poslednjoj rati (nakon vize i posla)" : "Odmah umanjuje osnovnu cenu"}
          </Field>
          <Field label="Dovedi prijatelja — 100 $ po osobi">
            <span className="flex items-center justify-between gap-3">
              <span className="tabular-nums">{candidate.referralCode || "WT-REF"}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(candidate.referralCode || "");
                  setCopiedRefCode(true);
                  setTimeout(() => setCopiedRefCode(false), 2000);
                }}
                className="text-xs font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                {copiedRefCode ? "Kopirano" : "Kopiraj kod"}
              </button>
            </span>
          </Field>
        </div>
      </Panel>
    </StepShell>
  );
}
