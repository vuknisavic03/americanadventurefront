// front/src/components/dashboard/DocumentsView.jsx
// Svi dokumenti na jednom mestu: šta preuzimaš, šta si okačio i šta stiže od nas.
import { Panel, LinkButton, TaskIcon } from "./ui";
import {
  downloadContractPdf,
  downloadResponsibilityStatementPdf,
  openPrintableTranslationWindow,
  getDs160Status,
} from "../../data/candidateStore";

const linkCls = "text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink";

const STATUS_TEXT = {
  done: "text-emerald-700",
  wait: "text-amber-700",
  current: "text-ink-3",
  locked: "text-ink-3",
};
const TONE_STATE = { done: "done", wait: "wait", neutral: "current", later: "locked" };

function DocRow({ name, sub, tone = "neutral", status, children }) {
  const state = status === "Kasnije" ? "locked" : TONE_STATE[tone] || "current";
  return (
    <li className="flex gap-3.5 py-3.5 first:pt-0 last:pb-0">
      {status ? (
        <TaskIcon state={state} className="mt-0.5" />
      ) : (
        <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true">
          <path d="M11.5 2.75H6A1.75 1.75 0 0 0 4.25 4.5v11A1.75 1.75 0 0 0 6 17.25h8a1.75 1.75 0 0 0 1.75-1.75V7z M11.5 2.75V7h4.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={state === "locked" ? "text-[15px] font-medium text-ink-3" : "text-[15px] font-medium text-ink"}>{name}</p>
          {status && <span className={"shrink-0 text-[13px] " + STATUS_TEXT[state]}>{status}</span>}
        </div>
        {sub && <p className="mt-0.5 truncate text-[13px] text-ink-3">{sub}</p>}
        {children && <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">{children}</div>}
      </div>
    </li>
  );
}

function Group({ title, children }) {
  return (
    <Panel title={title}>
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
      <Group title="Ugovor">
        <DocRow name="Ugovor o posredovanju" sub="Popunjen tvojim podacima">
          <LinkButton onClick={() => downloadContractPdf(candidate.id, candidate.email)}>Preuzmi</LinkButton>
        </DocRow>
        <DocRow name="Izjava o odgovornosti" sub="Popunjena tvojim podacima">
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

      <Group title="Tvoj dosije">
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
      </Group>
    </div>
  );
}
