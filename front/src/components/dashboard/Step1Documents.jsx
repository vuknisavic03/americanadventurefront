// front/src/components/dashboard/Step1Documents.jsx
import {
  PlayIcon,
  FileIcon,
  CheckIcon,
  ShieldIcon,
  SparklesIcon,
} from "./icons";
import {
  getTranslatedFacultyName,
  getTranslatedStudyYear,
  openPrintableTranslationWindow,
  getDs160Status,
} from "../../data/candidateStore";

import { StepShell } from "./ui";

export default function Step1Documents({
  candidate,
  setShowDs160Modal,
  isRegistrationDone,
  isStep1Done,
  isDocumentsApproved,
  isDocumentsPending,
  isDocumentsRejected,
  handleSimulateDocumentsApprove,
  profileScore,
  setShowProfileBuilderModal,
  setShowVideoModal,
  isYoutubeEditing,
  setIsYoutubeEditing,
  youtubeInput,
  setYoutubeInput,
  handleSaveYoutube,
  embedUrl,
  cvInputRef,
  handleCvUpload,
  setCvFile,
  updateCandidateState,
  certInputRef,
  isUploadingCert,
  facultyFile,
  setFacultyFile,
  aiTranslationReady,
  setAiTranslationReady,
  handleCertUpload,
  runAiTranslation,
  isTranslating,
  setActiveTranslationDoc,
  setShowTranslationModal,
  setUploadToast,
  policeInputRef,
  policeFile,
  setPoliceFile,
  policeTranslationReady,
  setPoliceTranslationReady,
  handlePoliceCertUpload,
  runPoliceTranslation,
  isTranslatingPolice,
  isPastReview,
  applicationSubmitted,
  isRequirementsMet,
  handleSubmitForReview,
  t,
}) {
  return (
    <StepShell
      index="1"
      state={isStep1Done ? "done" : !isRegistrationDone ? "locked" : "current"}
      kicker="Korak 1"
      title="Profil, dokumenta i prevodi"
      description="Kompletiranje dosijea za američkog sponzora i poslodavca. Nakon unosa CV-ja i uverenja, zvanični prevodi se overavaju automatski."
      status={
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${
              isStep1Done
                ? "bg-emerald-100 text-emerald-800"
                : isDocumentsRejected
                ? "bg-red-100 text-red-700"
                : isDocumentsPending
                ? "bg-amber-100 text-amber-800"
                : !isRegistrationDone
                ? "bg-surface-2 text-ink-2"
                : "bg-surface-2 text-ink"
            }`}
          >
            {isStep1Done
              ? "Dosije kompletiran i odobren"
              : isDocumentsRejected
              ? "Zahteva dopunu dosijea"
              : isDocumentsPending
              ? "Čeka se odobrenje koordinatora"
              : !isRegistrationDone
              ? "Zaključano do uplate I rate"
              : "U pripremi"}
          </span>
      }
    >

      {/* Upozorenje ako je dosije vraćen na dopunu od strane koordinatora */}
      {isDocumentsRejected && (
        <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-950">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-semibold text-lg">
              ✕
            </span>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-red-950">
                  Dosije je vraćen na dopunu od strane koordinatora
                </p>
                <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-medium text-red-900 border border-red-300">
                  Zahteva dopunu
                </span>
              </div>
              <p className="text-[13px] text-red-900 font-medium">
                Koordinator agencije je pregledao vašu dokumentaciju i uneo sledeće obrazloženje:
              </p>
              <div className="rounded-lg border border-red-200 bg-white p-3 font-medium text-red-900 text-[13px]">
                <strong>Obrazloženje koordinatora: </strong>
                <span className="italic">
                  "{candidate.documentsRejectionReason || "Molimo priložite ispravan ili dopunjen dokument prema uputstvu."}"
                </span>
                {candidate.documentsRejectedAt && (
                  <span className="block text-[13px] text-red-700/70 mt-1">
                    Datum provere: {new Date(candidate.documentsRejectedAt).toLocaleDateString("sr-RS")}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-red-800/90 font-semibold">
                Molimo zamenite neispravne dokumente u sekcijama ispod, a zatim na dnu stranice pošaljite dopunjeni dosije na ponovni pregled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gate upozorenje ako Korak 0 nije završen */}
      {!isRegistrationDone && (
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3.5 text-[13px] text-amber-900 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-amber-950 text-sm">
                Korak 1 je zaključan: Čeka se završetak Registracije (Ugovor & I Rata)
              </p>
              <p className="text-amber-900/80 mt-0.5">
                Da bi vaš dosije bio prosleđen američkom sponzoru na odobrenje, administrator mora da verifikuje potpisani ugovor i potvrdi prijem uplate I rate (250 €).
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900">
            Potrebna Registracija
          </span>
        </div>
      )}

      {/* Podkorak 1.1: Lični podaci i verifikacija pasoša (Sinhronizovano sa DS-160) */}
      {(() => {
        const d = candidate.ds160 || {};
        const candFirst = candidate.firstName || (candidate.name ? candidate.name.split(" ")[0] : "") || d.firstName || "";
        const candLast = candidate.lastName || (candidate.name ? candidate.name.split(" ").slice(1).join(" ") : "") || d.lastNameAndMaiden || "";
        const pData = {
          firstName: candFirst || "—",
          lastName: candLast || "—",
          gender: candidate.gender || d.gender || "—",
          birthDate: candidate.birthDate || candidate.dateOfBirth || d.dateOfBirth || "—",
          birthPlace: candidate.birthPlace || candidate.city || candidate.studyCity || d.birthPlace || "—",
          citizenship: candidate.citizenship || d.citizenship || "Republika Srbija",
          jmbg: candidate.jmbg || d.jmbg || "—",
          passportNumber: candidate.passportNumber || candidate.idCardNumber || d.passportNumber || "—",
          passportExpiryDate: candidate.passportExpiryDate || candidate.passportExpiry || d.passportExpiryDate || "—",
          phone: candidate.phone || d.mobilePhone || "—",
          email: candidate.email || d.primaryEmail || "—",
          address: candidate.address || d.homeAddress || "—",
        };

        return (
          <div className="rounded-2xl border border-line bg-white p-5 text-[13px] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-base font-semibold leading-snug text-ink">
                  Lični podaci i verifikacija biometrijskog pasoša
                </h4>
                <p className="text-[13px] text-ink-3">
                  Podaci su u potpunosti sinhronizovani sa DS-160 obrascem za vizu SAD.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const dsSt = getDs160Status(candidate.ds160);
                  if (dsSt.isComplete) {
                    return (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                        DS-160 Kompletiran
                      </span>
                    );
                  }
                  if (dsSt.isStarted) {
                    return (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                        DS-160 U izradi ({dsSt.filledCount}/{dsSt.totalCount})
                      </span>
                    );
                  }
                  return (
                    <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-3">
                      DS-160 Nije popunjavan
                    </span>
                  );
                })()}
                {Boolean(setShowDs160Modal) && (
                  <button
                    type="button"
                    onClick={() => setShowDs160Modal(true)}
                    className="rounded-full border border-line-strong bg-white px-3 py-1 text-[13px] font-semibold text-ink hover:bg-surface-2 transition-colors"
                  >
                    Uredi / Proveri u DS-160 obrascu
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Ime</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.firstName}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Prezime</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.lastName}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Pol</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.gender}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Datum rođenja</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.birthDate}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Mesto rođenja</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate" title={pData.birthPlace}>{pData.birthPlace}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Državljanstvo</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.citizenship}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">JMBG</span>
                <span className="tabular-nums font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.jmbg}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Broj pasoša</span>
                <span className="tabular-nums font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.passportNumber}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Važenje pasoša</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.passportExpiryDate}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Mobilni telefon</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate">{pData.phone}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Email adresa</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate" title={pData.email}>{pData.email}</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <span className="text-[13px] font-semibold text-ink-3 block">Adresa prebivališta</span>
                <span className="font-semibold text-ink text-[13px] mt-0.5 block truncate" title={pData.address}>{pData.address}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Podkorak 1.2: Studentski profil, CV Builder & Video prezentacija */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold leading-snug text-ink">
              Studentski profil, CV i video prezentacija
            </h3>
            <p className="text-[13px] text-ink-2 max-w-xl">
              Unesite radno iskustvo, veštine, termine dostupnosti za rad i nivo engleskog jezika. Američki poslodavci na osnovu ovog profila biraju kandidate za intervju.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[13px] font-semibold text-ink-3">
                Status profila
              </div>
              <div className={`text-sm font-semibold ${candidate.profileCompleted ? "text-emerald-700" : "text-ink"}`}>
                {candidate.profileCompleted ? "Kompletiran" : "U pripremi"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowProfileBuilderModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-neutral-950 transition-all"
            >
              <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Uredi profil & CV</span>
            </button>
          </div>
        </div>

        {/* Brzi sažetak profila u bedževima */}
        <div className="mt-4 grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-surface px-4 py-3">
            <span className="text-[13px] font-semibold text-neutral-400 block">Dostupnost za rad</span>
            <span className="font-semibold text-ink mt-0.5 block">
              {candidate.availability?.startDate || "25.05.2026"} – {candidate.availability?.endDate || "25.09.2026"}
            </span>
            <span className="text-[13px] text-ink-3">
              Grace period: do {candidate.availability?.travelUntil || "20.10.2026"}
            </span>
          </div>

          <div className="rounded-xl bg-surface px-4 py-3">
            <span className="text-[13px] font-semibold text-neutral-400 block">Radno iskustvo u CV-ju</span>
            <span className="font-semibold text-ink mt-0.5 block">
              {candidate.workExperience?.length || 0} unetih pozicija
            </span>
            <span className="text-[13px] text-ink-3 truncate block">
              {candidate.cvFileName || "CV još nije otpremljen"}
            </span>
          </div>

          <div className="rounded-xl bg-surface px-4 py-3">
            <span className="text-[13px] font-semibold text-neutral-400 block">Preferencije posla & SAD</span>
            <span className="font-semibold text-ink mt-0.5 block truncate">
              {candidate.preferences?.position || "Nije izabrano"}
            </span>
            <span className="text-[13px] text-ink-3 truncate block">
              {candidate.preferences?.locationType || "Obala i nacionalni parkovi"}
            </span>
          </div>

          <div className="rounded-xl bg-surface px-4 py-3">
            <span className="text-[13px] font-semibold text-neutral-400 block">Video prezentacija (60s)</span>
            <span className="font-semibold text-ink mt-0.5 block flex items-center gap-1.5">
              {candidate.youtubeUrl ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Video je sačuvan ✓</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700">Čeka se link</span>
                </>
              )}
            </span>
            <span className="text-[13px] text-ink-3">
              Nivo engleskog: <strong>{candidate.englishLevel || candidate.preferences?.englishLevel || "B2"}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. YOUTUBE VIDEO */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.youtubeUrl ? "bg-ink text-white" : "bg-surface-2 text-ink-3"
                }`}
              >
                <PlayIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink">
                  1. {t("dash.youtubeTitle")}
                </h3>
                <p className="text-[13px] text-ink-3">
                  {t("dash.youtubeSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/documents/AA_Instrukcija_za_video_CV.pdf"
                download="AA_Instrukcija_za_video_CV.pdf"
                className="rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-surface flex items-center gap-1"
                title="Preuzmite zvanični PDF dokument sa smernicama i primerima"
              >
                PDF Uputstvo
              </a>
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                {t("dash.youtubeInstructionsBtn")}
              </button>
              {candidate.youtubeUrl && !isYoutubeEditing && (
                <button
                  type="button"
                  onClick={() => setIsYoutubeEditing(true)}
                  className="text-[13px] font-semibold text-ink-3 underline hover:text-ink"
                >
                  Izmeni link
                </button>
              )}
            </div>
          </div>

          {isYoutubeEditing ? (
            <form onSubmit={handleSaveYoutube} className="mt-4 flex gap-2">
              <input
                type="url"
                required
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder={t("dash.youtubePlaceholder")}
                className="flex-1 rounded-xl border border-line-strong px-4 py-2.5 text-sm placeholder:text-ink-3/70 focus:border-ink focus:outline-hidden"
              />
              <button
                type="submit"
                className="bg-brand text-ink rounded-full px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-brand-strong"
              >
                Sačuvaj
              </button>
            </form>
          ) : (
            <div className="mt-4">
              {embedUrl ? (
                <div className="overflow-hidden rounded-xl border border-line">
                  <iframe
                    src={embedUrl}
                    title="YouTube video predstavljanje"
                    className="aspect-video w-full max-w-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={candidate.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[13px] font-semibold text-ink underline"
                >
                  {candidate.youtubeUrl}
                </a>
              )}
              <p className="mt-2 text-[13px] font-semibold text-emerald-700">✓ Video link je sačuvan i spreman za poslodavce</p>
            </div>
          )}
        </div>

        {/* 2. CV DOKUMENT */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.cvFileName ? "bg-ink text-white" : "bg-surface-2 text-ink-3"
                }`}
              >
                <FileIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink">
                  2. {t("dash.cvTitle")}
                </h3>
                <p className="text-[13px] text-ink-3">
                  {t("dash.cvSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                className="rounded-full border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                {candidate.cvFileName ? "Zameni CV" : t("dash.cvUploadBtn")}
              </button>
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={handleCvUpload}
              />
            </div>
          </div>

          {candidate.cvFileName ? (
            <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
              <CheckIcon className="h-4 w-4" />
              <span>Otpremljen dokument: <strong>{candidate.cvFileName}</strong></span>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setCvFile("Luka_Jovanovic_CV.pdf");
                  updateCandidateState({ cvFileName: "Luka_Jovanovic_CV.pdf" });
                }}
                className="text-[13px] font-semibold text-ink-3 underline hover:text-ink"
              >
                Ili ubaci primerak CV-ja (demo)
              </button>
            </div>
          )}
        </div>

        {/* PODKORAK 1.3: UVERENJE SA FAKULTETA + ZVANIČNI SUDSKI PREVOD */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.facultyCertFileName || facultyFile ? "bg-ink text-white" : "bg-surface-2 text-ink-3"
                }`}
              >
                <FileIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink">
                  Uverenje sa fakulteta o redovnom studiranju + Zvanični prevod
                </h3>
                <p className="text-[13px] text-ink-3 mt-0.5">
                  Potvrda fakulteta o redovnom statusu studenta + Zvanični sudski prevod na engleski za sponzora (1-klik PDF)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                disabled={isUploadingCert}
                className="rounded-full border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                {isUploadingCert
                  ? "Otpremanje..."
                  : candidate.facultyCertFileName || facultyFile
                  ? "Zameni uverenje"
                  : t("dash.facultyUploadBtn")}
              </button>
              <input
                ref={certInputRef}
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/*"
                className="sr-only"
                onChange={handleCertUpload}
              />
            </div>
          </div>

          {candidate.facultyCertFileName || facultyFile ? (
            <div className="rounded-2xl border border-line bg-white p-5 text-[13px] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[13px]">
                  <p className="font-semibold text-ink">
                    Originalni dokument: {candidate.facultyCertFileName || facultyFile}
                  </p>
                  <p className="text-ink-3">
                    {getTranslatedFacultyName(candidate.faculty || candidate.university || "Fakultet")} • {getTranslatedStudyYear(candidate.studyYear || "YEAR_2")}
                  </p>
                </div>

                {aiTranslationReady ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-700">
                      <CheckIcon className="h-4 w-4" /> Zvanični sudski prevod verifikovan
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTranslationDoc("faculty");
                        setShowTranslationModal(true);
                      }}
                      className="rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-800 hover:bg-emerald-200"
                    >
                      Pogledaj prevod
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrintableTranslationWindow("faculty", candidate)}
                      className="rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-neutral-950 inline-flex items-center gap-1"
                      title="Preuzmite overen prevod u PDF formatu za sponzora"
                    >
                      <span>Preuzmi prevod (PDF)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={runAiTranslation}
                    disabled={isTranslating}
                    className="bg-brand text-ink inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-strong"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {isTranslating ? t("dash.aiTranslating") : t("dash.aiTranslateBtn")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setFacultyFile("Uverenje_Ekonomski_BG.pdf");
                  setAiTranslationReady(true);
                  updateCandidateState({
                    facultyCertFileName: "Uverenje_Ekonomski_BG.pdf",
                    facultyCertAiTranslation: true,
                    facultyCertTranslated: true,
                  });
                  setUploadToast("✓ Dodato primerak uverenja sa sertifikovanim prevodom!");
                  setTimeout(() => setUploadToast(""), 4000);
                }}
                className="text-[13px] font-semibold text-ink-3 underline hover:text-ink"
              >
                Ili ubaci demo primerak uverenja
              </button>
            </div>
          )}
        </div>

        {/* PODKORAK 1.4: UVERENJE O NEKAŽNJAVANJU IZ MUP-A + ZVANIČNI PREVOD */}
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.policeCertificateFileName || policeFile ? "bg-ink text-white" : "bg-surface-2 text-ink-3"
                }`}
              >
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-ink">
                    Uverenje o nekažnjavanju iz MUP-a + Zvanični prevod
                  </h3>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                    Obavezno za sponzora
                  </span>
                </div>
                <p className="text-[13px] text-ink-3 mt-0.5">
                  Potvrda MUP-a RS da niste osuđivani + sertifikovan overen prevod na engleski jezik (Police Clearance)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => policeInputRef.current?.click()}
                className="rounded-full border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                {candidate.policeCertificateFileName || policeFile ? "Zameni uverenje" : "Otpremi MUP uverenje"}
              </button>
              <input
                ref={policeInputRef}
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/*"
                className="sr-only"
                onChange={handlePoliceCertUpload}
              />
            </div>
          </div>

          {candidate.policeCertificateFileName || policeFile ? (
            <div className="rounded-2xl border border-line bg-white p-5 text-[13px] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[13px]">
                  <p className="font-semibold text-ink">
                    Originalni dokument: {candidate.policeCertificateFileName || policeFile}
                  </p>
                  <p className="text-ink-3">Uverenje iz kaznene evidencije (MUP RS)</p>
                </div>

                {policeTranslationReady ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-700">
                      <CheckIcon className="h-4 w-4" /> Sertifikovan prevod verifikovan
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTranslationDoc("police");
                        setShowTranslationModal(true);
                      }}
                      className="rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-800 hover:bg-emerald-200"
                    >
                      Pogledaj prevod
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrintableTranslationWindow("police", candidate)}
                      className="rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-neutral-950 inline-flex items-center gap-1"
                      title="Preuzmite overeni prevod MUP uverenja u PDF formatu"
                    >
                      <span>Preuzmi prevod (PDF)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={runPoliceTranslation}
                    disabled={isTranslatingPolice}
                    className="bg-brand text-ink inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-strong"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {isTranslatingPolice ? "Prevođenje u toku..." : "Prevedi MUP uverenje"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setPoliceFile("Uverenje_o_nekaznjavanju_MUP_RS.pdf");
                  setPoliceTranslationReady(true);
                  updateCandidateState({
                    policeCertificateFileName: "Uverenje_o_nekaznjavanju_MUP_RS.pdf",
                    policeCertificateUploaded: true,
                    policeCertificateTranslated: true,
                  });
                  setUploadToast("✓ Dodato Uverenje o nekažnjavanju iz MUP-a sa sertifikovanim prevodom!");
                  setTimeout(() => setUploadToast(""), 4000);
                }}
                className="text-[13px] font-semibold text-ink-3 underline hover:text-ink"
              >
                Ili ubaci primerak Uverenja iz MUP-a (demo)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AKCIONO DUGME / STATUS VERIFIKACIJE DOSIJEA */}
      <div className="mt-4 border-t border-line pt-3">
        {isDocumentsApproved ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  Dokumentacija i profil su uspešno odobreni od sponzora
                </p>
                <p className="text-[13px] text-emerald-800/80">
                  Tvoj CV, video predstavljanje, uverenje sa fakulteta i MUP potvrda sa overenim prevodom su prihvaćeni i prosleđeni poslodavcima u Koraku 2.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-200 px-3 py-1 text-xs font-medium text-emerald-900">
              Odobreno ✓
            </span>
          </div>
        ) : isDocumentsRejected ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-red-50 p-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-950 flex items-center gap-2">
                Dosije zahteva dopunu pre slanja na odobrenje sponzoru
              </p>
              <p className="text-[13px] text-red-900/80 leading-relaxed">
                Nakon što priložite ispravan dokument u sekcijama iznad, kliknite na dugme desno kako bi koordinator ponovo pregledao vaš dosije.
              </p>
            </div>
            <button
              type="button"
              disabled={!isRequirementsMet || !isRegistrationDone}
              onClick={handleSubmitForReview}
              className="shrink-0 rounded-full bg-red-600 hover:bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pošalji dopunjeni dosije na ponovni pregled
            </button>
          </div>
        ) : isDocumentsPending ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-amber-50 p-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Dosije je poslat na verifikaciju — čeka se odobrenje koordinatora i sponzora
              </p>
              <p className="text-[13px] text-amber-900/80 leading-relaxed">
                Vaš CV, akademsko uverenje i prevod MUP potvrde pregleda tim zadužen za komunikaciju sa američkim sponzorima. Čim administrator odobri dosije, automatski se otključava odabir radnih ponuda u Koraku 2.
              </p>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-sm font-semibold text-ink">
                {isRequirementsMet
                  ? isRegistrationDone
                    ? "Sva dokumenta su spremna za slanje na verifikaciju!"
                    : "Dokumenta su spremna, ali ugovor i I rata još nisu potvrđeni."
                  : "Dopunite nedostajuće stavke pre slanja na obradu."}
              </p>
              <p className="text-[13px] text-ink-3">
                {isRegistrationDone
                  ? "Nakon slanja, koordinatori agencije verifikuju profil i otključavaju prijavu za poslove u Koraku 2."
                  : "Potrebno je da administrator odobri ugovor i potvrdi I ratu u koraku Registracija pre verifikacije dosijea."}
              </p>
            </div>

            <button
              type="button"
              disabled={!isRequirementsMet || !isRegistrationDone}
              onClick={handleSubmitForReview}
              className="bg-brand text-ink w-full shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto transition-colors hover:bg-brand-strong"
             
              title={
                !isRegistrationDone
                  ? "Potrebno je završiti Registraciju (Ugovor i I rata)"
                  : !isRequirementsMet
                  ? "Popunite sve obavezne stavke"
                  : "Pošalji dosije na pregled"
              }
            >
              {t("dash.submitForReview")}
            </button>
          </div>
        )}
      </div>
    </StepShell>
  );
}
