// front/src/components/dashboard/Step0Registration.jsx
// Registracija: ugovor → prva uplata. Program, popusti i uplatnice žive u sekcijama "Uplate" i "Moji podaci".
import { Button } from "../ui";
import { UploadIcon } from "./icons";
import { StepShell, TaskList, Actions, LinkButton, FileLine, StatusPill } from "./ui";
import { downloadContractPdf, downloadResponsibilityStatementPdf } from "../../data/candidateStore";

export function firstPaymentAmount(candidate) {
  return candidate.paymentMethod === "now"
    ? Number(candidate.finalPrice) || Number(candidate.basePrice) || 1750
    : Number(candidate.firstInstallmentAmount) || 250;
}

export function buildRegistrationTasks(ctx) {
  const {
    candidate,
    hasSignedContract,
    isContractApproved,
    isContractPending,
    isFirstInstallmentPaid,
    isFirstInstallmentPending,
    isUploadingSignedContract,
    pickSignedContract,
    setShowSignContractModal,
    handlePaymentSlipClick,
    handleReportFirstInstallment,
  } = ctx;
  const isFull = candidate.paymentMethod === "now";
  const amount = firstPaymentAmount(candidate);
  const contractRejected = candidate.contractVerificationStatus === "rejected";

  return [
    {
      id: "contract",
      waitText: "Ugovor je na overi kod pravnog tima",
      title: "Potpiši i okači ugovor",
      state: isContractApproved ? "done" : contractRejected ? "danger" : isContractPending ? "wait" : "current",
      status: isContractApproved
        ? "Overen"
        : contractRejected
        ? "Vraćen na ispravku"
        : isContractPending
        ? "Na overi kod pravnog tima"
        : "Čeka tvoj potpis",
      desc: isContractApproved
        ? "Pravni tim je overio potpisani ugovor."
        : isContractPending
        ? "Proveravamo potpise i podatke. Uplatnicu za sledeći korak možeš da preuzmeš već sada."
        : "Ugovor i Izjava o odgovornosti stižu popunjeni tvojim podacima. Odštampaj oba, potpiši na liniji za studenta i okači sken ili fotografiju.",
      render: (isNext) => (
        <Actions>
          {hasSignedContract ? (
            <FileLine name={candidate.signedContractFileName || "Potpisani ugovor"}>
              <LinkButton onClick={pickSignedContract} disabled={isUploadingSignedContract} className="ml-1">
                Zameni
              </LinkButton>
            </FileLine>
          ) : (
            <>
              <Button variant={isNext ? "primary" : "dark"} size="sm" onClick={() => setShowSignContractModal(true)}>
                Potpiši ugovor
              </Button>
              <Button variant="outline" size="sm" disabled={isUploadingSignedContract} onClick={pickSignedContract}>
                <UploadIcon className="h-4 w-4" />
                {isUploadingSignedContract ? "Kačenje…" : "Već imam potpisan — okači"}
              </Button>
            </>
          )}
          <span className="flex flex-wrap gap-x-4 gap-y-1 sm:ml-auto">
            <LinkButton onClick={() => downloadContractPdf(candidate.id, candidate.email)}>Ugovor (PDF)</LinkButton>
            <LinkButton onClick={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}>
              Izjava o odgovornosti (PDF)
            </LinkButton>
          </span>
        </Actions>
      ),
    },
    {
      id: "payment1",
      waitText: "Proveravamo tvoju uplatu",
      title: isFull ? `Uplati program — ${amount} €` : `Uplati I ratu — ${amount} €`,
      state: isFirstInstallmentPaid ? "done" : isFirstInstallmentPending ? "wait" : !hasSignedContract ? "locked" : "current",
      status: isFirstInstallmentPaid
        ? "Proknjiženo"
        : isFirstInstallmentPending
        ? "Proveravamo uplatu"
        : !hasSignedContract
        ? "Posle ugovora"
        : "Čeka uplatu",
      desc: isFirstInstallmentPaid
        ? `Uplata od ${amount} € je potvrđena.`
        : isFirstInstallmentPending
        ? "Čim potvrdimo uplatu na izvodu, otključava se Korak 1."
        : !hasSignedContract
        ? "Uplatnica se otključava čim okačiš potpisani ugovor."
        : "Plaća se u dinarima po srednjem kursu NBS na dan uplate. Na uplatnici je IPS QR kod za m-banking. Kad platiš, javi nam ovde.",
      render: (isNext) =>
        isFirstInstallmentPaid ? null : (
          <Actions>
            <Button variant="outline" size="sm" onClick={handlePaymentSlipClick}>
              Preuzmi uplatnicu
            </Button>
            {!isFirstInstallmentPending && (
              <Button variant={isNext ? "primary" : "dark"} size="sm" onClick={handleReportFirstInstallment}>
                Platio sam — prijavi uplatu
              </Button>
            )}
          </Actions>
        ),
    },
  ];
}

export default function Step0Registration({ ctx, quiet, compact }) {
  const { candidate, isRegistrationDone, isFirstInstallmentPending, isContractPending } = ctx;
  const isFull = candidate.paymentMethod === "now";

  return (
    <StepShell
      compact={compact}
      index="0"
      state={isRegistrationDone ? "done" : "current"}
      kicker="Registracija"
      title={isFull ? "Ugovor i uplata programa" : "Ugovor i I rata"}
      description="Dve stvari i otvaraš Korak 1: potpisan ugovor i prva uplata."
      status={
        <StatusPill tone={isRegistrationDone ? "done" : isFirstInstallmentPending || isContractPending ? "wait" : "neutral"}>
          {isRegistrationDone ? "Završeno" : isFirstInstallmentPending || isContractPending ? "Čeka našu potvrdu" : "U toku"}
        </StatusPill>
      }
    >
      <TaskList tasks={buildRegistrationTasks(ctx)} quiet={quiet} />
    </StepShell>
  );
}
