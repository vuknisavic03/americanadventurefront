// front/src/components/dashboard/Step1Documents.jsx
// Korak 1: profil → video → CV → uverenje sa fakulteta → MUP uverenje → slanje dosijea.
// Lični podaci su u "Moji podaci", a svi fajlovi i prevodi i u sekciji "Dokumenta".
import { Button } from "../ui";
import { UploadIcon, SparklesIcon } from "./icons";
import { StepShell, TaskList, Actions, LinkButton, FileLine, Notice, StatusPill } from "./ui";
import { getTranslatedFacultyName, getTranslatedStudyYear, openPrintableTranslationWindow } from "../../data/candidateStore";
import { inputCls } from "../ui";

export function buildDocumentTasks(ctx) {
  const {
    candidate,
    t,
    isRegistrationDone,
    isDocumentsApproved,
    isDocumentsPending,
    isDocumentsRejected,
    isRequirementsMet,
    handleSubmitForReview,
    setShowProfileBuilderModal,
    setShowVideoModal,
    isYoutubeEditing,
    setIsYoutubeEditing,
    youtubeInput,
    setYoutubeInput,
    handleSaveYoutube,
    embedUrl,
    pickCv,
    isUploadingCv,
    setCvFile,
    updateCandidateState,
    pickFacultyCert,
    pickPoliceCert,
    isUploadingCert,
    facultyFile,
    setFacultyFile,
    aiTranslationReady,
    setAiTranslationReady,
    runAiTranslation,
    isTranslating,
    policeFile,
    setPoliceFile,
    policeTranslationReady,
    setPoliceTranslationReady,
    runPoliceTranslation,
    isTranslatingPolice,
    openTranslation,
    flash,
  } = ctx;

  const locked = isDocumentsApproved || isDocumentsPending; // dosije je predat — fajlovi se ne menjaju dok traje provera
  const open = (done) => (done ? "done" : locked ? "wait" : "current");
  const faculty = candidate.facultyCertFileName || facultyFile;
  const police = candidate.policeCertificateFileName || policeFile;
  const av = candidate.availability || {};

  const translationActions = (doc, ready, translating, run, isNext) =>
    ready ? (
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-[13px] font-medium text-emerald-700">Prevod na engleski je spreman</span>
        <LinkButton onClick={() => openTranslation(doc)}>Pogledaj prevod</LinkButton>
        <LinkButton onClick={() => openPrintableTranslationWindow(doc, candidate)}>Preuzmi prevod (PDF)</LinkButton>
      </span>
    ) : (
      <Button variant={isNext ? "primary" : "dark"} size="sm" onClick={run} disabled={translating}>
        <SparklesIcon className="h-4 w-4" />
        {translating ? "Prevodim…" : "Napravi prevod"}
      </Button>
    );

  return [
    {
      id: "profile",
      title: "Popuni profil za poslodavce",
      state: open(candidate.profileCompleted),
      status: candidate.profileCompleted ? "Popunjen" : "Nije popunjen",
      desc: candidate.profileCompleted
        ? `${candidate.workExperience?.length || 0} radnih iskustava · dostupnost ${av.startDate || "25.05.2026"} – ${av.endDate || "25.09.2026"} · engleski ${candidate.englishLevel || candidate.preferences?.englishLevel || "B2"}`
        : "Iskustvo, dostupnost i engleski — po ovome te poslodavci biraju. Oko 10 minuta.",
      render: (isNext) => (
        <Actions>
          {candidate.profileCompleted ? (
            <LinkButton onClick={() => setShowProfileBuilderModal(true)}>Izmeni profil</LinkButton>
          ) : (
            <Button variant={isNext ? "primary" : "dark"} size="sm" onClick={() => setShowProfileBuilderModal(true)}>
              Popuni profil
            </Button>
          )}
        </Actions>
      ),
    },
    {
      id: "video",
      title: t("dash.youtubeTitle"),
      state: open(candidate.youtubeUrl),
      status: candidate.youtubeUrl ? "Sačuvan" : "Nema linka",
      desc: candidate.youtubeUrl
        ? null
        : "60–90 sekundi na engleskom, postavljeno na YouTube.",
      render: (isNext) =>
        isYoutubeEditing ? (
          <div className="space-y-3">
            <form onSubmit={handleSaveYoutube} className="flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                type="url"
                required
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="https://youtu.be/…"
                aria-label="YouTube link"
                className={inputCls + " sm:flex-1"}
              />
              <Button type="submit" variant={isNext ? "primary" : "dark"}>
                Sačuvaj link
              </Button>
            </form>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <LinkButton onClick={() => setShowVideoModal(true)}>Kako da snimim video</LinkButton>
              <a
                href="/documents/AA_Instrukcija_za_video_CV.pdf"
                download="AA_Instrukcija_za_video_CV.pdf"
                className="text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                Uputstvo (PDF)
              </a>
              {candidate.youtubeUrl && <LinkButton onClick={() => setIsYoutubeEditing(false)}>Otkaži</LinkButton>}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Video predstavljanje"
                className="aspect-video w-full max-w-xs rounded-xl border border-line"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a href={candidate.youtubeUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-ink underline">
                {candidate.youtubeUrl}
              </a>
            )}
            {!locked && <LinkButton onClick={() => setIsYoutubeEditing(true)}>Promeni link</LinkButton>}
          </div>
        ),
    },
    {
      id: "cv",
      title: "Okači CV",
      state: open(candidate.cvFileName),
      status: candidate.cvFileName ? "Okačen" : "Nema fajla",
      desc: candidate.cvFileName ? null : "PDF ili Word.",
      render: (isNext) =>
        candidate.cvFileName ? (
          <FileLine name={candidate.cvFileName}>
            {!locked && (
              <LinkButton onClick={pickCv} disabled={isUploadingCv} className="ml-1">
                Zameni
              </LinkButton>
            )}
          </FileLine>
        ) : (
          <Actions>
            <Button variant={isNext ? "primary" : "dark"} size="sm" onClick={pickCv} disabled={isUploadingCv}>
              <UploadIcon className="h-4 w-4" />
              {isUploadingCv ? "Kačenje…" : "Izaberi CV"}
            </Button>
            <LinkButton
              onClick={() => {
                setCvFile("Luka_Jovanovic_CV.pdf");
                updateCandidateState({ cvFileName: "Luka_Jovanovic_CV.pdf" });
              }}
            >
              Ubaci primer (demo)
            </LinkButton>
          </Actions>
        ),
    },
    {
      id: "faculty",
      title: "Uverenje o redovnom studiranju",
      state: open(faculty && aiTranslationReady),
      status: faculty ? (aiTranslationReady ? "Okačeno i prevedeno" : "Treba prevod") : "Nema fajla",
      desc: faculty
        ? `${getTranslatedFacultyName(candidate.faculty || candidate.university || "Fakultet")} · ${getTranslatedStudyYear(candidate.studyYear || "YEAR_2")}`
        : "Iz studentske službe. Prevod pravimo mi.",
      render: (isNext) =>
        faculty ? (
          <div className="space-y-3">
            <FileLine name={faculty}>
              {!locked && (
                <LinkButton onClick={pickFacultyCert} disabled={isUploadingCert} className="ml-1">
                  Zameni
                </LinkButton>
              )}
            </FileLine>
            {translationActions("faculty", aiTranslationReady, isTranslating, runAiTranslation, isNext)}
          </div>
        ) : (
          <Actions>
            <Button variant={isNext ? "primary" : "dark"} size="sm" onClick={pickFacultyCert} disabled={isUploadingCert}>
              <UploadIcon className="h-4 w-4" />
              {isUploadingCert ? "Kačenje…" : "Izaberi uverenje"}
            </Button>
            <LinkButton
              onClick={() => {
                setFacultyFile("Uverenje_Ekonomski_BG.pdf");
                setAiTranslationReady(true);
                updateCandidateState({
                  facultyCertFileName: "Uverenje_Ekonomski_BG.pdf",
                  facultyCertAiTranslation: true,
                  facultyCertTranslated: true,
                });
                flash("Dodat je primer uverenja sa prevodom.");
              }}
            >
              Ubaci primer (demo)
            </LinkButton>
          </Actions>
        ),
    },
    {
      id: "police",
      title: "Uverenje o nekažnjavanju (MUP)",
      state: open(police && policeTranslationReady),
      status: police ? (policeTranslationReady ? "Okačeno i prevedeno" : "Treba prevod") : "Nema fajla",
      desc: police
        ? null
        : "Iz policijske uprave po prebivalištu. Prevod pravimo mi.",
      render: (isNext) =>
        police ? (
          <div className="space-y-3">
            <FileLine name={police}>
              {!locked && (
                <LinkButton onClick={pickPoliceCert} className="ml-1">
                  Zameni
                </LinkButton>
              )}
            </FileLine>
            {translationActions("police", policeTranslationReady, isTranslatingPolice, runPoliceTranslation, isNext)}
          </div>
        ) : (
          <Actions>
            <Button variant={isNext ? "primary" : "dark"} size="sm" onClick={pickPoliceCert}>
              <UploadIcon className="h-4 w-4" />
              Izaberi uverenje
            </Button>
            <LinkButton
              onClick={() => {
                setPoliceFile("Uverenje_o_nekaznjavanju_MUP_RS.pdf");
                setPoliceTranslationReady(true);
                updateCandidateState({
                  policeCertificateFileName: "Uverenje_o_nekaznjavanju_MUP_RS.pdf",
                  policeCertificateUploaded: true,
                  policeCertificateTranslated: true,
                });
                flash("Dodat je primer MUP uverenja sa prevodom.");
              }}
            >
              Ubaci primer (demo)
            </LinkButton>
          </Actions>
        ),
    },
    {
      id: "submit",
      waitText: "Dosije je na pregledu kod koordinatora",
      title: isDocumentsRejected ? "Pošalji dopunjen dosije" : "Pošalji dosije na pregled",
      state: isDocumentsApproved
        ? "done"
        : isDocumentsPending
        ? "wait"
        : isDocumentsRejected
        ? "danger"
        : isRequirementsMet && isRegistrationDone
        ? "current"
        : "locked",
      status: isDocumentsApproved
        ? "Odobren"
        : isDocumentsPending
        ? "Na pregledu"
        : isDocumentsRejected
        ? "Vraćen na dopunu"
        : !isRegistrationDone
        ? "Posle registracije"
        : "Posle stavki 2–5",
      desc: isDocumentsApproved
        ? null
        : isDocumentsPending
        ? "Kad ga odobrimo, otvara se izbor posla."
        : isDocumentsRejected
        ? "Zameni dokument iz napomene, pa pošalji ponovo."
        : !isRegistrationDone
        ? "Dokumenta možeš da spremaš već sada."
        : null,
      render: (isNext) =>
        isDocumentsApproved || isDocumentsPending ? null : (
          <Button
            variant={isDocumentsRejected ? "danger" : isNext ? "primary" : "dark"}
            disabled={!isRequirementsMet || !isRegistrationDone}
            onClick={handleSubmitForReview}
          >
            {isDocumentsRejected ? "Pošalji ponovo na pregled" : "Pošalji dosije"}
          </Button>
        ),
    },
  ];
}

export default function Step1Documents({ ctx, quiet, compact }) {
  const { candidate, isRegistrationDone, isStep1Done, isDocumentsPending, isDocumentsRejected } = ctx;

  return (
    <StepShell
      compact={compact}
      index="1"
      state={isStep1Done ? "done" : !isRegistrationDone ? "locked" : "current"}
      kicker="Korak 1"
      title="Profil i dokumenta"
      description="Sve što sponzor i poslodavac traže, redom. Prevode na engleski pravimo mi."
      status={
        <StatusPill tone={isStep1Done ? "done" : isDocumentsRejected ? "danger" : isDocumentsPending ? "wait" : "neutral"}>
          {isStep1Done
            ? "Odobreno"
            : isDocumentsRejected
            ? "Treba dopuna"
            : isDocumentsPending
            ? "Na pregledu"
            : !isRegistrationDone
            ? "Otvara se posle registracije"
            : "U toku"}
        </StatusPill>
      }
    >
      {isDocumentsRejected && (
        <Notice tone="danger" title="Koordinator je vratio dosije na dopunu">
          „{candidate.documentsRejectionReason || "Priloži ispravan ili dopunjen dokument prema uputstvu."}“
          {candidate.documentsRejectedAt && (
            <span className="ml-1 opacity-75">— {new Date(candidate.documentsRejectedAt).toLocaleDateString("sr-RS")}</span>
          )}
        </Notice>
      )}
      <TaskList tasks={buildDocumentTasks(ctx)} quiet={quiet} />
    </StepShell>
  );
}
