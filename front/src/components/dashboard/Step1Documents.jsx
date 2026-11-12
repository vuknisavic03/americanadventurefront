// front/src/components/dashboard/Step1Documents.jsx
import {
  PlayIcon,
  FileIcon,
  CheckIcon,
  ShieldIcon,
  SparklesIcon,
} from "./icons";
import { BRAND_YELLOW, INK } from "./constants";
import {
  getTranslatedFacultyName,
  getTranslatedStudyYear,
  openPrintableTranslationWindow,
  getDs160Status,
} from "../../data/candidateStore";

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
    <section className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-xs sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm shadow-xs">
            1
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                KORAK 1
              </span>
              <h2 className="text-base sm:text-lg font-black text-[var(--brand-ink)]">
                Profil kandidata, Dokumentacija & Zvanični sudski prevodi
              </h2>
            </div>
            <p className="text-xs text-[var(--brand-ink)]/65 mt-0.5">
              Kompletiranje dosijea za američkog sponzora i poslodavca. Nakon unosa CV-ja i uverenja, zvanični prevodi se overavaju automatski.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3.5 py-1 text-xs font-bold ${
            isStep1Done
              ? "bg-green-100 text-green-900 border border-green-300"
              : isDocumentsRejected
              ? "bg-rose-100 text-rose-950 border border-rose-300 animate-pulse"
              : isDocumentsPending
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : !isRegistrationDone
              ? "bg-slate-100 text-slate-700 border border-slate-300"
              : "bg-blue-100 text-blue-900 border border-blue-300"
          }`}
        >
          {isStep1Done
            ? "✓ Dosije kompletiran i odobren"
            : isDocumentsRejected
            ? "Zahteva dopunu dosijea"
            : isDocumentsPending
            ? "Čeka se odobrenje koordinatora"
            : !isRegistrationDone
            ? "Zaključano do uplate I rate"
            : "U pripremi"}
        </span>
      </div>

      {/* Upozorenje ako je dosije vraćen na dopunu od strane koordinatora */}
      {isDocumentsRejected && (
        <div className="mt-3.5 rounded-xl border-2 border-rose-400 bg-rose-50/95 p-4 text-xs text-rose-950 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white font-bold text-lg shadow-2xs">
              ✕
            </span>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-rose-950">
                  Dosije je vraćen na dopunu od strane koordinatora
                </p>
                <span className="rounded-full bg-rose-200 px-3 py-0.5 text-[11px] font-black uppercase text-rose-900 border border-rose-300">
                  Zahteva dopunu
                </span>
              </div>
              <p className="text-xs text-rose-900 font-medium">
                Koordinator agencije je pregledao vašu dokumentaciju i uneo sledeće obrazloženje:
              </p>
              <div className="rounded-lg border border-rose-200 bg-white p-3 font-medium text-rose-900 text-xs shadow-2xs">
                <strong>Obrazloženje koordinatora: </strong>
                <span className="italic">
                  "{candidate.documentsRejectionReason || "Molimo priložite ispravan ili dopunjen dokument prema uputstvu."}"
                </span>
                {candidate.documentsRejectedAt && (
                  <span className="block text-[11px] text-rose-700/70 mt-1">
                    Datum provere: {new Date(candidate.documentsRejectedAt).toLocaleDateString("sr-RS")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-rose-800/90 font-semibold">
                Molimo zamenite neispravne dokumente u sekcijama ispod, a zatim na dnu stranice pošaljite dopunjeni dosije na ponovni pregled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gate upozorenje ako Korak 0 nije završen */}
      {!isRegistrationDone && (
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-base">
             
            </span>
            <div>
              <p className="font-bold text-amber-950 text-sm">
                Korak 1 je zaključan: Čeka se završetak Registracije (Ugovor & I Rata)
              </p>
              <p className="text-amber-900/80 mt-0.5">
                Da bi vaš dosije bio prosleđen američkom sponzoru na odobrenje, administrator mora da verifikuje potpisani ugovor i potvrdi prijem uplate I rate (250 €).
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-[11px] font-black text-amber-900">
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
          <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-2 mb-2">
              <div>
                <h4 className="font-extrabold text-sm text-[var(--brand-ink)]">
                  Lični podaci i verifikacija biometrijskog pasoša
                </h4>
                <p className="text-[11px] text-[var(--brand-ink)]/60">
                  Podaci su u potpunosti sinhronizovani sa DS-160 obrascem za vizu SAD.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const dsSt = getDs160Status(candidate.ds160);
                  if (dsSt.isComplete) {
                    return (
                      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
                        DS-160 Kompletiran
                      </span>
                    );
                  }
                  if (dsSt.isStarted) {
                    return (
                      <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                        DS-160 U izradi ({dsSt.filledCount}/{dsSt.totalCount})
                      </span>
                    );
                  }
                  return (
                    <span className="rounded-full bg-black/5 border border-black/10 px-2.5 py-0.5 text-[10px] font-bold text-black/60">
                      DS-160 Nije popunjavan
                    </span>
                  );
                })()}
                {Boolean(setShowDs160Modal) && (
                  <button
                    type="button"
                    onClick={() => setShowDs160Modal(true)}
                    className="rounded-lg border border-black/15 bg-white px-3 py-1 text-[11px] font-bold text-[var(--brand-ink)] hover:bg-black/5 shadow-2xs transition-colors"
                  >
                    Uredi / Proveri u DS-160 obrascu
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Ime</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate">{pData.firstName}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Prezime</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate">{pData.lastName}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Pol</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate">{pData.gender}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Datum rođenja</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate">{pData.birthDate}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Mesto rođenja</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate" title={pData.birthPlace}>{pData.birthPlace}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Državljanstvo</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate">{pData.citizenship}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">JMBG</span>
                <span className="font-mono font-bold text-black text-xs mt-0.5 block truncate">{pData.jmbg}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Broj pasoša</span>
                <span className="font-mono font-bold text-black text-xs mt-0.5 block truncate">{pData.passportNumber}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Važenje pasoša</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate">{pData.passportExpiryDate}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Mobilni telefon</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate">{pData.phone}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Email adresa</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate" title={pData.email}>{pData.email}</span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-black/10">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Adresa prebivališta</span>
                <span className="font-bold text-black text-xs mt-0.5 block truncate" title={pData.address}>{pData.address}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Podkorak 1.2: Studentski profil, CV Builder & Video prezentacija */}
      <div className="mt-3 rounded-2xl border-2 border-slate-900 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/40 p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Studentski profil, CV Builder & Video prezentacija
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Unesite radno iskustvo, veštine, termine dostupnosti za rad i nivo engleskog jezika. Američki poslodavci na osnovu ovog profila biraju kandidate za intervju.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status profila
              </div>
              <div className="text-sm font-black text-emerald-800 font-mono">
                {candidate.profileCompleted ? "Kompletiran ✓" : "U pripremi"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowProfileBuilderModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black transition-all"
            >
              <svg className="h-4 w-4 text-[var(--brand-yellow)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Uredi profil & CV</span>
            </button>
          </div>
        </div>

        {/* Brzi sažetak profila u bedževima */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2.5 border-t border-black/[0.08] text-xs">
          <div className="rounded-xl border border-black/10 bg-white/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dostupnost za rad</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              🗓️ {candidate.availability?.startDate || "25.05.2026"} – {candidate.availability?.endDate || "25.09.2026"}
            </span>
            <span className="text-[11px] text-slate-500">
              Grace period: do {candidate.availability?.travelUntil || "20.10.2026"}
            </span>
          </div>

          <div className="rounded-xl border border-black/10 bg-white/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Radno iskustvo u CV-ju</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {candidate.workExperience?.length || 0} unetih pozicija
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {candidate.cvFileName || "CV još nije otpremljen"}
            </span>
          </div>

          <div className="rounded-xl border border-black/10 bg-white/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Preferencije posla & SAD</span>
            <span className="font-bold text-slate-900 mt-0.5 block truncate">
              🎯 {candidate.preferences?.position || "Nije izabrano"}
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {candidate.preferences?.locationType || "Obala i nacionalni parkovi"}
            </span>
          </div>

          <div className="rounded-xl border border-black/10 bg-white/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Video prezentacija (60s)</span>
            <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1.5">
              {candidate.youtubeUrl ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Video je sačuvan ✓</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-700">Čeka se link</span>
                </>
              )}
            </span>
            <span className="text-[11px] text-slate-500">
              Nivo engleskog: <strong>{candidate.englishLevel || candidate.preferences?.englishLevel || "B2"}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {/* 1. YOUTUBE VIDEO */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.youtubeUrl ? "bg-red-600 text-white" : "bg-black/[0.06] text-black/60"
                }`}
              >
                <PlayIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--brand-ink)]">
                  1. {t("dash.youtubeTitle")}
                </h3>
                <p className="text-xs text-[var(--brand-ink)]/60">
                  {t("dash.youtubeSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/documents/AA_Instrukcija_za_video_CV.pdf"
                download="AA_Instrukcija_za_video_CV.pdf"
                className="rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 flex items-center gap-1"
                title="Preuzmite zvanični PDF dokument sa smernicama i primerima"
              >
                PDF Uputstvo
              </a>
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] transition-colors hover:bg-black/[0.04]"
              >
                {t("dash.youtubeInstructionsBtn")}
              </button>
              {candidate.youtubeUrl && !isYoutubeEditing && (
                <button
                  type="button"
                  onClick={() => setIsYoutubeEditing(true)}
                  className="text-xs font-semibold text-[var(--brand-ink)]/60 underline hover:text-[var(--brand-ink)]"
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
                className="flex-1 rounded-xl border border-black/15 px-4 py-2.5 text-sm placeholder:text-black/35 focus:border-[var(--brand-ink)] focus:outline-hidden"
              />
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-xs transition-opacity hover:opacity-90"
                style={{ backgroundColor: BRAND_YELLOW, color: INK }}
              >
                Sačuvaj
              </button>
            </form>
          ) : (
            <div className="mt-4">
              {embedUrl ? (
                <div className="overflow-hidden rounded-xl border border-black/10">
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
                  className="inline-block text-xs font-bold text-blue-700 underline"
                >
                  {candidate.youtubeUrl}
                </a>
              )}
              <p className="mt-2 text-xs font-semibold text-green-700">✓ Video link je sačuvan i spreman za poslodavce</p>
            </div>
          )}
        </div>

        {/* 2. CV DOKUMENT */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.cvFileName ? "bg-blue-600 text-white" : "bg-black/[0.06] text-black/60"
                }`}
              >
                <FileIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--brand-ink)]">
                  2. {t("dash.cvTitle")}
                </h3>
                <p className="text-xs text-[var(--brand-ink)]/60">
                  {t("dash.cvSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] transition-colors hover:bg-black/[0.04]"
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
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-700">
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
                className="text-xs font-semibold text-[var(--brand-ink)]/60 underline hover:text-[var(--brand-ink)]"
              >
                Ili ubaci primerak CV-ja (demo)
              </button>
            </div>
          )}
        </div>

        {/* PODKORAK 1.3: UVERENJE SA FAKULTETA + ZVANIČNI SUDSKI PREVOD */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.facultyCertFileName || facultyFile ? "bg-amber-500 text-white" : "bg-black/[0.06] text-black/60"
                }`}
              >
                <FileIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--brand-ink)]">
                  Uverenje sa fakulteta o redovnom studiranju + Zvanični prevod
                </h3>
                <p className="text-xs text-[var(--brand-ink)]/60 mt-0.5">
                  Potvrda fakulteta o redovnom statusu studenta + Zvanični sudski prevod na engleski za sponzora (1-klik PDF)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                disabled={isUploadingCert}
                className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] transition-colors hover:bg-black/[0.04] disabled:opacity-50"
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
            <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-[var(--brand-ink)]">
                    Originalni dokument: {candidate.facultyCertFileName || facultyFile}
                  </p>
                  <p className="text-[var(--brand-ink)]/60">
                    {getTranslatedFacultyName(candidate.faculty || candidate.university || "Fakultet")} • {getTranslatedStudyYear(candidate.studyYear || "YEAR_2")}
                  </p>
                </div>

                {aiTranslationReady ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700">
                      <CheckIcon className="h-4 w-4" /> Zvanični sudski prevod verifikovan
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTranslationDoc("faculty");
                        setShowTranslationModal(true);
                      }}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-900 hover:bg-green-200"
                    >
                      👁️ Pogledaj prevod
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrintableTranslationWindow("faculty", candidate)}
                      className="rounded-lg bg-[var(--brand-ink)] px-3 py-1.5 text-xs font-bold text-white hover:bg-black inline-flex items-center gap-1"
                      title="Preuzmite overen prevod u PDF formatu za sponzora"
                    >
                      <span>🖨️ Preuzmi prevod (PDF)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={runAiTranslation}
                    disabled={isTranslating}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xs transition-all hover:scale-105"
                    style={{ backgroundColor: BRAND_YELLOW, color: INK }}
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
                className="text-xs font-semibold text-[var(--brand-ink)]/60 underline hover:text-[var(--brand-ink)]"
              >
                Ili ubaci demo primerak uverenja
              </button>
            </div>
          )}
        </div>

        {/* PODKORAK 1.4: UVERENJE O NEKAŽNJAVANJU IZ MUP-A + ZVANIČNI PREVOD */}
        <div className="rounded-xl border border-black/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  candidate.policeCertificateFileName || policeFile ? "bg-blue-600 text-white" : "bg-black/[0.06] text-black/60"
                }`}
              >
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--brand-ink)]">
                    Uverenje o nekažnjavanju iz MUP-a + Zvanični prevod
                  </h3>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800">
                    OBAVEZNO ZA SPONZORA
                  </span>
                </div>
                <p className="text-xs text-[var(--brand-ink)]/60 mt-0.5">
                  Potvrda MUP-a RS da niste osuđivani + sertifikovan overen prevod na engleski jezik (Police Clearance)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => policeInputRef.current?.click()}
                className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] transition-colors hover:bg-black/[0.04]"
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
            <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-[var(--brand-ink)]">
                    Originalni dokument: {candidate.policeCertificateFileName || policeFile}
                  </p>
                  <p className="text-[var(--brand-ink)]/60">Uverenje iz kaznene evidencije (MUP RS)</p>
                </div>

                {policeTranslationReady ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700">
                      <CheckIcon className="h-4 w-4" /> Sertifikovan prevod verifikovan
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTranslationDoc("police");
                        setShowTranslationModal(true);
                      }}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-900 hover:bg-green-200"
                    >
                      👁️ Pogledaj prevod
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrintableTranslationWindow("police", candidate)}
                      className="rounded-lg bg-[var(--brand-ink)] px-3 py-1.5 text-xs font-bold text-white hover:bg-black inline-flex items-center gap-1"
                      title="Preuzmite overeni prevod MUP uverenja u PDF formatu"
                    >
                      <span>🖨️ Preuzmi prevod (PDF)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={runPoliceTranslation}
                    disabled={isTranslatingPolice}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xs transition-all hover:scale-105"
                    style={{ backgroundColor: BRAND_YELLOW, color: INK }}
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
                className="text-xs font-semibold text-[var(--brand-ink)]/60 underline hover:text-[var(--brand-ink)]"
              >
                Ili ubaci primerak Uverenja iz MUP-a (demo)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AKCIONO DUGME / STATUS VERIFIKACIJE DOSIJEA */}
      <div className="mt-4 border-t border-black/[0.08] pt-3">
        {isDocumentsApproved ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-green-300 bg-green-50 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
                <CheckIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-green-950">
                  Dokumentacija i profil su uspešno odobreni od sponzora
                </p>
                <p className="text-xs text-green-800/80">
                  Tvoj CV, video predstavljanje, uverenje sa fakulteta i MUP potvrda sa overenim prevodom su prihvaćeni i prosleđeni poslodavcima u Koraku 2.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-green-200 px-3.5 py-1 text-xs font-extrabold text-green-900">
              Odobreno ✓
            </span>
          </div>
        ) : isDocumentsRejected ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border-2 border-rose-400 bg-rose-50/90 p-4">
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-rose-950 flex items-center gap-2">
                <span></span> Dosije zahteva dopunu pre slanja na odobrenje sponzoru
              </p>
              <p className="text-xs text-rose-900/80 leading-relaxed">
                Nakon što priložite ispravan dokument u sekcijama iznad, kliknite na dugme desno kako bi koordinator ponovo pregledao vaš dosije.
              </p>
            </div>
            <button
              type="button"
              disabled={!isRequirementsMet || !isRegistrationDone}
              onClick={handleSubmitForReview}
              className="shrink-0 rounded-full bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pošalji dopunjeni dosije na ponovni pregled
            </button>
          </div>
        ) : isDocumentsPending ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50/90 p-4">
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                <span></span> Dosije je poslat na verifikaciju — čeka se odobrenje koordinatora i sponzora
              </p>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Vaš CV, akademsko uverenje i prevod MUP potvrde pregleda tim zadužen za komunikaciju sa američkim sponzorima. Čim administrator odobri dosije, automatski se otključava odabir radnih ponuda u Koraku 2.
              </p>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-sm font-bold text-[var(--brand-ink)]">
                {isRequirementsMet
                  ? isRegistrationDone
                    ? "Sva dokumenta su spremna za slanje na verifikaciju!"
                    : "Dokumenta su spremna, ali ugovor i I rata još nisu potvrđeni."
                  : "Dopunite nedostajuće stavke pre slanja na obradu."}
              </p>
              <p className="text-xs text-[var(--brand-ink)]/55">
                {isRegistrationDone
                  ? "Nakon slanja, koordinatori agencije verifikuju profil i otključavaju prijavu za poslove u Koraku 2."
                  : "Potrebno je da administrator odobri ugovor i potvrdi I ratu u koraku Registracija pre verifikacije dosijea."}
              </p>
            </div>

            <button
              type="button"
              disabled={!isRequirementsMet || !isRegistrationDone}
              onClick={handleSubmitForReview}
              className="w-full shrink-0 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              style={{ backgroundColor: BRAND_YELLOW, color: INK }}
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
    </section>
  );
}
