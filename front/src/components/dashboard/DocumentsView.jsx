// front/src/components/dashboard/DocumentsView.jsx
// Svi dokumenti na jednom mestu: šta preuzimaš, šta si okačio i šta stiže od nas.
import { Panel, StatusPill, LinkButton } from "./ui";
import {
  downloadContractPdf,
  downloadResponsibilityStatementPdf,
  openPrintableTranslationWindow,
  getDs160Status,
} from "../../data/candidateStore";

const linkCls = "text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink";

function DocRow({ name, sub, tone, status, children }) {
  return (
    <li className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{name}</p>
        {sub && <p className="truncate text-[13px] text-ink-3">{sub}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
        {children}
        {status && <StatusPill tone={tone}>{status}</StatusPill>}
      </div>
    </li>
  );
}

function Group({ title, description, children }) {
  return (
    <Panel title={title} description={description}>
      <ul className="divide-y divide-line">{children}</ul>
    </Panel>
  );
}

export default function DocumentsView({ ctx }) {
  const {
    candidate,
    hasSignedContract,
    isContractApproved,
    isContractPending,
    setShowSignContractModal,
    pickSignedContract,
    pickCv,
    pickFacultyCert,
    pickPoliceCert,
    facultyFile,
    policeFile,
    aiTranslationReady,
    policeTranslationReady,
    openTranslation,
    hasConfirmedJob,
    setShowJobOfferModal,
    setShowDs160Modal,
    isDeparture,
    isReady,
    status,
    goTo,
  } = ctx;
  const ds = getDs160Status(candidate.ds160);
  const faculty = candidate.facultyCertFileName || facultyFile;
  const police = candidate.policeCertificateFileName || policeFile;
  const offerSigned = Boolean(candidate.jobOfferSignedAt || candidate.jobOfferAccepted);

  return (
    <div className="space-y-4">
      <Group title="Ugovor" description="Ugovor i izjava stižu popunjeni tvojim podacima.">
        <DocRow name="Ugovor o posredovanju" sub="PDF za štampu">
          <LinkButton onClick={() => downloadContractPdf(candidate.id, candidate.email)}>Preuzmi</LinkButton>
        </DocRow>
        <DocRow name="Izjava o odgovornosti" sub="PDF za štampu">
          <LinkButton onClick={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}>Preuzmi</LinkButton>
        </DocRow>
        <DocRow
          name="Potpisani ugovor"
          sub={hasSignedContract ? candidate.signedContractFileName || "Okačen" : "Još nije okačen"}
          tone={isContractApproved ? "done" : isContractPending ? "wait" : "neutral"}
          status={isContractApproved ? "Overen" : isContractPending ? "Na overi" : "Nedostaje"}
        >
          {hasSignedContract ? (
            <LinkButton onClick={pickSignedContract}>Zameni</LinkButton>
          ) : (
            <LinkButton onClick={() => setShowSignContractModal(true)}>Potpiši i okači</LinkButton>
          )}
        </DocRow>
      </Group>

      <Group title="Tvoj dosije" description="Ovo šaljemo sponzoru i poslodavcima. Prevode na engleski pravimo mi.">
        <DocRow
          name="Video predstavljanje"
          sub={candidate.youtubeUrl || "Link još nije dodat"}
          tone={candidate.youtubeUrl ? "done" : "neutral"}
          status={candidate.youtubeUrl ? "Sačuvan" : "Nedostaje"}
        >
          {candidate.youtubeUrl ? (
            <a href={candidate.youtubeUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
              Pogledaj
            </a>
          ) : (
            <LinkButton onClick={() => goTo("put", "task-video", "step1")}>Dodaj link</LinkButton>
          )}
        </DocRow>
        <DocRow
          name="CV"
          sub={candidate.cvFileName || "Fajl još nije okačen"}
          tone={candidate.cvFileName ? "done" : "neutral"}
          status={candidate.cvFileName ? "Okačen" : "Nedostaje"}
        >
          <LinkButton onClick={pickCv}>{candidate.cvFileName ? "Zameni" : "Okači"}</LinkButton>
        </DocRow>
        <DocRow
          name="Uverenje o redovnom studiranju"
          sub={faculty || "Fajl još nije okačen"}
          tone={faculty && aiTranslationReady ? "done" : faculty ? "wait" : "neutral"}
          status={faculty ? (aiTranslationReady ? "Prevedeno" : "Treba prevod") : "Nedostaje"}
        >
          {faculty && aiTranslationReady && (
            <>
              <LinkButton onClick={() => openTranslation("faculty")}>Prevod</LinkButton>
              <LinkButton onClick={() => openPrintableTranslationWindow("faculty", candidate)}>PDF prevoda</LinkButton>
            </>
          )}
          <LinkButton onClick={pickFacultyCert}>{faculty ? "Zameni" : "Okači"}</LinkButton>
        </DocRow>
        <DocRow
          name="Uverenje o nekažnjavanju (MUP)"
          sub={police || "Fajl još nije okačen"}
          tone={police && policeTranslationReady ? "done" : police ? "wait" : "neutral"}
          status={police ? (policeTranslationReady ? "Prevedeno" : "Treba prevod") : "Nedostaje"}
        >
          {police && policeTranslationReady && (
            <>
              <LinkButton onClick={() => openTranslation("police")}>Prevod</LinkButton>
              <LinkButton onClick={() => openPrintableTranslationWindow("police", candidate)}>PDF prevoda</LinkButton>
            </>
          )}
          <LinkButton onClick={pickPoliceCert}>{police ? "Zameni" : "Okači"}</LinkButton>
        </DocRow>
        <DocRow name="Pasoš" sub={candidate.passportNumber ? `Broj ${candidate.passportNumber}` : "Sken iz registracije"} tone="done" status="Priložen" />
      </Group>

      <Group title="Posao i viza">
        <DocRow
          name="Job Offer"
          sub={candidate.selectedJobEmployer ? `${candidate.selectedJobTitle} — ${candidate.selectedJobEmployer}` : "Stiže kad te poslodavac izabere"}
          tone={offerSigned ? "done" : hasConfirmedJob ? "wait" : "neutral"}
          status={offerSigned ? "Potpisan" : hasConfirmedJob ? "Čeka potpis" : "Kasnije"}
        >
          {hasConfirmedJob && <LinkButton onClick={() => setShowJobOfferModal(true)}>{offerSigned ? "Pogledaj" : "Potpiši"}</LinkButton>}
        </DocRow>
        <DocRow
          name="DS-160 upitnik"
          sub={ds.isComplete ? "Popunjen" : ds.isStarted ? `${ds.filledCount} od ${ds.totalCount} polja` : "Nije počet"}
          tone={ds.isComplete ? "done" : ds.isStarted ? "wait" : "neutral"}
          status={ds.isComplete ? "Popunjen" : ds.isStarted ? "U izradi" : "Nije počet"}
        >
          <LinkButton onClick={() => setShowDs160Modal(true)}>Otvori</LinkButton>
          <a href="/documents/UPITNIK_za_izradu_DS160_J1.docx" download="UPITNIK_za_izradu_DS160_J1.docx" className={linkCls}>
            Word
          </a>
        </DocRow>
        <DocRow
          name="DS-2019"
          sub="Izdaje sponzor"
          tone={isDeparture ? "done" : status === "job" ? "wait" : "neutral"}
          status={isDeparture ? "Izdat" : status === "job" ? "U pripremi" : "Kasnije"}
        />
        <DocRow
          name="J-1 viza"
          sub="U pasošu, posle razgovora u ambasadi"
          tone={isReady ? "done" : status === "departure" ? "wait" : "neutral"}
          status={isReady ? "Odobrena" : status === "departure" ? "Ambasada" : "Kasnije"}
        />
      </Group>

      <Group title="Uputstva">
        <DocRow name="Kako da snimiš video predstavljanje" sub="PDF sa primerima">
          <a href="/documents/AA_Instrukcija_za_video_CV.pdf" download="AA_Instrukcija_za_video_CV.pdf" className={linkCls}>
            Preuzmi
          </a>
        </DocRow>
        <DocRow name="Uplatnice i računi" sub="Sve uplate su u sekciji Uplate">
          <LinkButton onClick={() => goTo("uplate")}>Otvori Uplate</LinkButton>
        </DocRow>
      </Group>
    </div>
  );
}
