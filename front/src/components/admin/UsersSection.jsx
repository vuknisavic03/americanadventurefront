import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  getInvitations,
  createInvitation,
  getCandidates,
  saveCandidate,
  deleteCandidate,
  syncFromBackend,
  downloadEmbassyExport,
  resetInvitation,
  recordContactAttempt,
  sendQualificationMaterials,
  scheduleConsultation,
  recordConsultationAttendance,
  qualifyCandidateAndIssueCode,
  rejectPreApplication,
  createManualPreApplication,
  activateCandidateAccount,
  markCandidateSelection,
  approveProfileReadiness,
  downloadPreApplicationsExcel,
  getCandidateStepInfo,
} from "../../data/candidateStore";
import {
  STATUS,
  STATUS_FLOW,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  PhoneIcon,
  CalendarIcon,
  MailIcon,
  UserCheckIcon,
  UserXIcon,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Card,
  EmptyState,
  StatCard,
  Badge,
  GhostIconButton,
} from "./ui";
import {
  RecordCallModal,
  ScheduleConsultationModal,
  CandidateSelectionModal,
  ProfileReadinessModal,
  RejectPreAppModal,
  NewPreAppModal,
  GenerateCodeModal,
} from "./modals/PreAppModals";
import CandidateApplicationModal from "./modals/CandidateApplicationModal";

export default function UsersSection() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("preApplications"); // preApplications | candidates | invitations
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [invitations, setInvitations] = useState(getInvitations);
  const [successToast, setSuccessToast] = useState("");

  // Faza 0: Stanja modala i filtera
  const [selectedCallCandidate, setSelectedCallCandidate] = useState(null);
  const [selectedConsultationCandidate, setSelectedConsultationCandidate] = useState(null);
  const [selectedQualifyCandidate, setSelectedQualifyCandidate] = useState(null);
  const [selectedReadinessCandidate, setSelectedReadinessCandidate] = useState(null);
  const [selectedRejectCandidate, setSelectedRejectCandidate] = useState(null);
  const [showNewPreAppModal, setShowNewPreAppModal] = useState(false);
  const [preAppFilter, setPreAppFilter] = useState("all");

  // Učitaj kandidate iz store-a
  const mapCandidatesToRows = (list) =>
    list.map((c) => ({
      ...c,
      name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.name || "Kandidat",
      program: c.packageName || c.program || "Work & Travel USA",
      status: c.status || "review",
      progress: c.progress ?? 30,
      isNew: Boolean(c.isNew),
    }));

  const [students, setStudents] = useState(() => mapCandidatesToRows(getCandidates()));

  useEffect(() => {
    syncFromBackend().then((data) => {
      if (data) {
        if (Array.isArray(data.candidates)) {
          setStudents(mapCandidatesToRows(data.candidates));
        }
        if (Array.isArray(data.invitations)) {
          setInvitations(data.invitations);
        }
      }
    });

    const refreshFromStore = () => {
      setStudents(mapCandidatesToRows(getCandidates()));
      setInvitations(getInvitations());
    };

    window.addEventListener("aa_candidate_updated", refreshFromStore);
    window.addEventListener("storage", refreshFromStore);
    window.addEventListener("focus", refreshFromStore);

    return () => {
      window.removeEventListener("aa_candidate_updated", refreshFromStore);
      window.removeEventListener("storage", refreshFromStore);
      window.removeEventListener("focus", refreshFromStore);
    };
  }, []);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");

  const inputCls =
    "w-full rounded-lg border border-line-strong bg-white py-2.5 pl-9 pr-3.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-3/70 focus:border-ink focus:outline-hidden focus:ring-2 focus:ring-ink/10";

  // Čuvanje izmena aplikacije kandidata (pun dosije)
  const handleSaveCandidate = (updatedCandidate, options = {}) => {
    const saved = saveCandidate(updatedCandidate);
    setStudents((prev) => {
      const remaining = prev.filter(
        (s) =>
          s.id !== updatedCandidate.id &&
          s.id !== saved.id &&
          (!updatedCandidate.email || s.email.toLowerCase() !== updatedCandidate.email.toLowerCase())
      );
      const mapped = mapCandidatesToRows([saved])[0];
      return [mapped, ...remaining];
    });
    setInvitations(getInvitations());
    if (options.keepOpen) {
      setSelectedCandidate(saved);
    } else {
      setSelectedCandidate(null);
      setSuccessToast(`Uspešno sačuvani podaci za: ${saved.firstName} ${saved.lastName}!`);
      setTimeout(() => setSuccessToast(""), 4500);
    }
  };

  const handleDeleteCandidate = (candidateId, candidateName) => {
    if (!window.confirm(`Da li ste sigurni da želite da obrišete kandidata ${candidateName}?`)) return;
    deleteCandidate(candidateId);
    setStudents((prev) => prev.filter((s) => s.id !== candidateId));
    setSuccessToast(`Kandidat ${candidateName} je uklonjen.`);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const handleCodeCreated = (newInv) => {
    setInvitations(getInvitations());
    if (newInv?.email) {
      const normMail = newInv.email.toLowerCase();
      const match = students.find((s) => s.email?.toLowerCase() === normMail && s.status === "applying");
      if (match) {
        const noteEntry = `[${new Date().toLocaleDateString("sr-RS")}]: Generisana pozivnica sa kodom ${newInv.code}. Čeka se aktivacija naloga na portalu od strane kandidata.`;
        const updated = {
          ...match,
          status: "applying",
          progress: 25,
          packageId: newInv.packageId || match.packageId,
          packageName: newInv.packageName || match.packageName,
          discount: newInv.discount ?? match.discount,
          discountNote: newInv.discountNote || match.discountNote,
          finalPrice: newInv.finalPrice ?? match.finalPrice,
          activationCode: newInv.code,
          selectionDecision: "QUALIFIED",
          notes: match.notes ? `${match.notes}\n${noteEntry}` : noteEntry,
        };
        saveCandidate(updated);
        setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
        setSuccessToast(`Kreiran kod ${newInv.code} za kandidata ${match.name}! Kod je spreman za aktivaciju naloga.`);
        setTimeout(() => setSuccessToast(""), 5000);
      }
    }
  };

  const handleResetInvitation = (invCode) => {
    resetInvitation(invCode);
    setInvitations(getInvitations());
    setStudents(mapCandidatesToRows(getCandidates()));
    setSuccessToast(`Kod ${invCode} je uspešno resetovan na 'Čeka registraciju'! Kandidat sada može da aktivira nalog.`);
    setTimeout(() => setSuccessToast(""), 5000);
  };

  // --- Handleri za Fazu 0 (Trijaža, pozivi, konsultacije, selekcioni gate) ---
  const handleSaveCall = ({ outcome, note, nextContactAt, sendMaterials }) => {
    if (!selectedCallCandidate) return;
    const updated = recordContactAttempt(selectedCallCandidate.id, { outcome, note, nextContactAt, sendMaterials });
    if (updated) {
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSuccessToast(`Evidentiran ishod poziva za: ${updated.firstName || updated.name}`);
      setTimeout(() => setSuccessToast(""), 4500);
    }
    setSelectedCallCandidate(null);
  };

  const handleSendMaterials = (cand) => {
    const updated = sendQualificationMaterials(cand.id);
    if (updated) {
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSuccessToast(`Informativni paket i brošura uspešno poslati na: ${cand.email}`);
      setTimeout(() => setSuccessToast(""), 4500);
    }
  };

  const handleSaveConsultation = ({ scheduledAt, consultationType, attendanceStatus, notes }) => {
    if (!selectedConsultationCandidate) return;
    let updated = null;
    if (scheduledAt) {
      updated = scheduleConsultation(selectedConsultationCandidate.id, { scheduledAt, consultationType, notes });
    }
    if (attendanceStatus && attendanceStatus !== "NOT_SCHEDULED") {
      updated = recordConsultationAttendance(selectedConsultationCandidate.id, { attendanceStatus, notes });
    }
    if (updated) {
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSuccessToast(`Konsultacije ažurirane za: ${updated.firstName || updated.name}`);
      setTimeout(() => setSuccessToast(""), 4500);
    }
    setSelectedConsultationCandidate(null);
  };

  // Selekcija kandidata (Kvalifikovan / Odbijen + Slanje dokumentacije i Calendly termina)
  const handleSaveSelection = ({ eligible, rejectionReason, rejectionNote, sendDocuments, inviteConsultations }) => {
    if (!selectedQualifyCandidate) return;
    const updated = markCandidateSelection(selectedQualifyCandidate.id, {
      decision: eligible ? "QUALIFIED" : "REJECTED",
      reason: rejectionReason,
      notes: rejectionNote,
      sendDocumentation: sendDocuments,
      sendCalendly: inviteConsultations,
    });
    if (updated) {
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      const msg = eligible
        ? `✓ Kandidat ${updated.firstName || updated.name} je označen kao ISPUNJAVA USLOVE. Dokumentacija poslata.`
        : `✕ Kandidat ${updated.firstName || updated.name} je označen kao NE ISPUNJAVA USLOVE.`;
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(""), 5000);
    }
    setSelectedQualifyCandidate(null);
  };

  // FR-015 & Selekcioni Readiness Gate pre kreiranja profila i izdavanja koda
  const handleApproveReadiness = ({ packageId, discount, discountNote, bypassPrerequisites }) => {
    if (!selectedReadinessCandidate) return null;
    const res = approveProfileReadiness(selectedReadinessCandidate.id, {
      packageId,
      discount,
      discountNote,
      overridePrerequisites: bypassPrerequisites,
    });
    if (res?.candidate) {
      setStudents(mapCandidatesToRows(getCandidates()));
      setInvitations(getInvitations());
      setSuccessToast(`✓ Preduslovi odobreni! Generisan verifikacioni kod ${res.invitation.code} za ${res.candidate.name}`);
      setTimeout(() => setSuccessToast(""), 6000);
      return res;
    }
    return null;
  };

  const handleQualifyCandidate = ({ packageId, discount, discountNote }) => {
    if (!selectedQualifyCandidate) return;
    const res = qualifyCandidateAndIssueCode(selectedQualifyCandidate.id, { packageId, discount, discountNote });
    if (res) {
      setStudents((prev) => prev.map((s) => (s.id === res.candidate.id ? { ...s, ...res.candidate } : s)));
      setInvitations(getInvitations());
      setSuccessToast(`Kandidat ${res.candidate.firstName} ${res.candidate.lastName} je KVALIFIKOVAN! Generisan je kod: ${res.invitation.code}`);
      setTimeout(() => setSuccessToast(""), 6000);
      return res;
    }
  };

  const handleRejectPreApp = ({ reason, note }) => {
    if (!selectedRejectCandidate) return;
    const updated = rejectPreApplication(selectedRejectCandidate.id, { reason, note });
    if (updated) {
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSuccessToast(`Prijava za ${updated.firstName || updated.name} je odbijena.`);
      setTimeout(() => setSuccessToast(""), 4500);
    }
    setSelectedRejectCandidate(null);
  };

  const handleCreateManualPreApp = (formData) => {
    const newLead = createManualPreApplication(formData);
    if (newLead) {
      const mapped = mapCandidatesToRows([newLead])[0];
      setStudents((prev) => [mapped, ...prev]);
      setShowNewPreAppModal(false);
      setSuccessToast(`Nova prijava uspešno kreirana za: ${newLead.firstName} ${newLead.lastName}`);
      setTimeout(() => setSuccessToast(""), 5000);
    }
  };

  // 1-klik direktna aktivacija naloga iz Faze 0 (Prijava & Selekcija) u Fazu 1 (Aktivni kandidati)
  const handleActivateCandidate = (candidate) => {
    const updated = activateCandidateAccount(candidate.id || candidate.email);
    if (updated) {
      setStudents(mapCandidatesToRows(getCandidates()));
      setInvitations(getInvitations());
      setSuccessToast(`✓ Nalog za ${updated.firstName} ${updated.lastName} je uspešno aktiviran i prebačen u aktivne kandidate (Faze 1-3)!`);
      setTimeout(() => setSuccessToast(""), 5000);
    }
  };

  // 1-klik brzo unapređenje kandidata u sledeću fazu direktno iz tabele (Faze 1-3)
  const handleQuickAdvance = (candidate) => {
    const currentStatus = candidate.status || "applying";
    const flow = STATUS_FLOW[currentStatus] || STATUS_FLOW.applying;
    const nextStatusId = flow.nextId;
    if (!nextStatusId) return;

    let createdInvCode = null;
    if (currentStatus === "applying") {
      const existingInv = invitations.find((i) => i.email.toLowerCase() === candidate.email.toLowerCase());
      if (!existingInv) {
        const newInv = createInvitation({
          email: candidate.email,
          candidateName: candidate.name,
          packageId: candidate.packageId || "swt-full",
          discount: candidate.discount || 0,
          discountNote: candidate.discountNote || "Odobrena prijava",
        });
        createdInvCode = newInv.code;
        setInvitations(getInvitations());
      } else {
        createdInvCode = existingInv.code;
      }
    }

    const nextConfig = STATUS[nextStatusId];
    const actionNote = createdInvCode
      ? `[${new Date().toLocaleDateString("sr-RS")}]: Prijava odobrena. Kreiran verifikacioni kod za registraciju: ${createdInvCode} (Korak: Registracija).`
      : `[${new Date().toLocaleDateString("sr-RS")}]: Prebačen na korak: ${nextConfig?.defaultLabel || nextStatusId}.`;

    const updatedNotes = candidate.notes ? `${candidate.notes}\n${actionNote}` : actionNote;

    const updatedCandidate = {
      ...candidate,
      status: nextStatusId,
      ...(nextStatusId === "ready" ? { hasVisa: true } : {}),
      notes: updatedNotes,
    };

    const saved = saveCandidate(updatedCandidate, { explicitStatus: true });

    setStudents((prev) => {
      const remaining = prev.filter(
        (s) =>
          s.id !== candidate.id &&
          s.id !== saved.id &&
          (!candidate.email || s.email.toLowerCase() !== candidate.email.toLowerCase())
      );
      const mapped = mapCandidatesToRows([saved])[0];
      return [mapped, ...remaining];
    });

    const msg = createdInvCode
      ? `Kandidat ${candidate.name} je odobren! Generisan je kod ${createdInvCode} (Korak: Registracija).`
      : `Kandidat ${candidate.name} je uspešno prebačen na korak: ${nextConfig?.defaultLabel || nextStatusId}!`;

    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 5000);
  };

  const handleQuickStatusChange = (candidate, newStatusId) => {
    const nextConfig = STATUS[newStatusId];
    const noteEntry = `[${new Date().toLocaleDateString("sr-RS")}]: Korak ručno promenjen u: ${nextConfig?.defaultLabel || newStatusId}.`;
    const updatedNotes = candidate.notes ? `${candidate.notes}\n${noteEntry}` : noteEntry;

    const updatedCandidate = {
      ...candidate,
      status: newStatusId,
      ...(newStatusId === "ready" ? { hasVisa: true } : {}),
      notes: updatedNotes,
    };

    const saved = saveCandidate(updatedCandidate, { explicitStatus: true });

    setStudents((prev) => {
      const remaining = prev.filter(
        (s) =>
          s.id !== candidate.id &&
          s.id !== saved.id &&
          (!candidate.email || s.email.toLowerCase() !== candidate.email.toLowerCase())
      );
      const mapped = mapCandidatesToRows([saved])[0];
      return [mapped, ...remaining];
    });

    setSuccessToast(`Korak za ${candidate.name} je promenjen u: ${nextConfig?.defaultLabel || newStatusId}.`);
    setTimeout(() => setSuccessToast(""), 4500);
  };

  const copyInvitationCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const q = query.trim().toLowerCase();

  // Set registrovanih / aktivnih email adresa za eliminaciju duplikata
  const registeredEmails = new Set(
    students
      .filter((c) => Boolean(c.isRegistered || c.registeredAt || ["review", "docs", "job", "departure", "ready"].includes(c.status)))
      .map((c) => (c.email || "").toLowerCase().trim())
      .filter(Boolean)
  );

  // Razdvajanje: Faza 0 (Prijave i selekcija) vs Aktivni kandidati u programu (Faze 1-3)
  const isPreApp = (s) => {
    const emailNorm = (s.email || "").toLowerCase().trim();
    // 1. Ako je nalog aktiviran/registrovan ili je u aktivnim fazama programa -> NIJE Faza 0
    if (s.isRegistered || s.registeredAt) return false;
    if (["review", "docs", "job", "departure", "ready"].includes(s.status)) return false;
    // 2. Ako bilo gde u bazi postoji aktivan zapis za ovaj email, a ovaj zapis je stari preapp -> NIJE Faza 0
    if (emailNorm && registeredEmails.has(emailNorm) && !String(s.id).startsWith("cand-")) return false;

    // 3. Ako je status applying ili rejected bez registracije -> pripada Fazi 0
    return (
      s.status === "applying" ||
      s.status === "rejected" ||
      s.selectionDecision === "REJECTED" ||
      String(s.id).startsWith("preapp-")
    );
  };

  // Deduplikacija prijava po emailu (isključi one koji već imaju aktivan profil)
  const preAppsMap = new Map();
  students.filter(isPreApp).forEach((s) => {
    const key = (s.email || "").toLowerCase().trim() || s.id;
    if (!registeredEmails.has(key) && !preAppsMap.has(key)) {
      preAppsMap.set(key, s);
    }
  });
  const preAppsList = Array.from(preAppsMap.values());

  const preAppRows = preAppsList.filter((s) => {
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.faculty && s.faculty.toLowerCase().includes(q)) ||
      (s.program && s.program.toLowerCase().includes(q));

    let matchF = true;
    if (preAppFilter === "not_attempted") {
      matchF = !s.contactStatus || s.contactStatus === "NOT_ATTEMPTED";
    } else if (preAppFilter === "reached") {
      matchF = s.contactStatus === "REACHED" || s.latestContactOutcome === "REACHED";
    } else if (preAppFilter === "consultation_scheduled") {
      matchF = s.consultationStatus === "SCHEDULED";
    } else if (preAppFilter === "consultation_attended") {
      matchF = s.consultationStatus === "ATTENDED";
    } else if (preAppFilter === "qualified") {
      matchF = s.selectionDecision === "QUALIFIED" || Boolean(s.activationCode);
    } else if (preAppFilter === "rejected") {
      matchF = s.status === "rejected" || s.selectionDecision === "REJECTED";
    }
    return matchQ && matchF;
  });

  // Deduplikacija aktivnih kandidata po emailu (preferiraj registrovanog i novijeg)
  const activeCandidatesMap = new Map();
  students.filter((s) => !isPreApp(s)).forEach((s) => {
    const key = (s.email || "").toLowerCase().trim() || s.id;
    if (!activeCandidatesMap.has(key)) {
      activeCandidatesMap.set(key, s);
    } else {
      const existing = activeCandidatesMap.get(key);
      if (!existing.isRegistered && s.isRegistered) {
        activeCandidatesMap.set(key, s);
      }
    }
  });
  const activeProgramCandidates = Array.from(activeCandidatesMap.values());

  const rows = activeProgramCandidates.filter((s) => {
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.program && s.program.toLowerCase().includes(q));
    const matchF =
      filter === "all" ||
      s.status === filter ||
      (filter === "review" && s.status === "registered") ||
      (filter === "docs" && s.status === "in_review");
    return matchQ && matchF;
  });

  // KPI kartice
  const preAppKpis = [
    { label: "Prijave u Fazi 0", value: preAppsList.length },
    {
      label: "Čeka prvi kontakt (Trijaža)",
      value: preAppsList.filter((s) => !s.contactStatus || s.contactStatus === "NOT_ATTEMPTED").length,
      accent: true,
    },
    {
      label: "Konsultacije (Zakazane / Održane)",
      value: preAppsList.filter((s) => s.consultationStatus === "SCHEDULED" || s.consultationStatus === "ATTENDED").length,
    },
    {
      label: "Kvalifikovano za Fazu 1 (Izdat kod)",
      value: preAppsList.filter((s) => s.selectionDecision === "QUALIFIED" || Boolean(s.activationCode)).length,
      accent: true,
    },
  ];

  const candidateKpis = [
    { label: t("admin.usersKpiTotal"), value: activeProgramCandidates.length },
    { label: t("admin.usersKpiActive"), value: activeProgramCandidates.filter((s) => s.status !== "ready").length },
    { label: "Aktivne pozivnice", value: invitations.filter((i) => i.status === "pending").length, accent: true },
    { label: "Spremni / Viza", value: activeProgramCandidates.filter((s) => s.status === "ready").length, accent: true },
  ];

  const preAppFilters = [
    ["all", "Sve prijave"],
    ["not_attempted", "Neobrađene (bez poziva)"],
    ["reached", "Ostvaren kontakt"],
    ["consultation_scheduled", "Zakazane konsultacije"],
    ["consultation_attended", "Održane konsultacije"],
    ["qualified", "Kvalifikovani (Faza 1)"],
    ["rejected", "Odbijeni"],
  ];

  const filters = [
    ["all", t("admin.usersAll")],
    ["review", "Registracija"],
    ["docs", "Korak 1: Dokumenta"],
    ["job", "Korak 2: Posao"],
    ["departure", "Čekanje na vizu"],
    ["ready", "Viza odobrena"],
  ];

  return (
    <>
      <PageHeader
        title={t("admin.usersTitle")}
        subtitle="Upravljanje celokupnim putem kandidata — od početne trijaže, konsultacija i selekcije (Faza 0), do ugovora, posla i vize (Faze 1-3)."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "preApplications" ? (
              <>
                <button
                  type="button"
                  onClick={() => downloadPreApplicationsExcel(preAppsList)}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                  title="Preuzmi sve prijave, trijažne i selekcione podatke u Excel (.xlsx / UTF-8 CSV) tabeli"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-700">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Izvezi prijave u Excel (.xlsx)</span>
                </button>
                <SecondaryButton
                  onClick={() => setShowNewPreAppModal(true)}
                  className="inline-flex items-center gap-2"
                >
                  <PlusIcon /> Ručni unos nove prijave
                </SecondaryButton>
                <PrimaryButton onClick={() => setShowCodeModal(true)}>
                  <PlusIcon /> {t("admin.generateCodeBtn")}
                </PrimaryButton>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={downloadEmbassyExport}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                  title="Preuzmi zvaničnu tabelu kandidata za Ambasadu SAD i US sponzore (Tabela za Ambasadu.xlsx)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-700">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Izvezi tabelu za Ambasadu (.xlsx)</span>
                </button>
                <PrimaryButton onClick={() => setShowCodeModal(true)}>
                  <PlusIcon /> {t("admin.generateCodeBtn")}
                </PrimaryButton>
              </>
            )}
          </div>
        }
      />

      {successToast && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
          <span>✓ {successToast}</span>
          <button type="button" onClick={() => setSuccessToast("")} className="text-emerald-800 hover:text-emerald-950 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Kartice */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(activeTab === "preApplications" ? preAppKpis : candidateKpis).map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} accent={k.accent} />
        ))}
      </div>

      {/* Tabovi: Faza 0 (Prijave & Selekcija) vs Faze 1-3 (Aktivni kandidati) vs Pozivnice */}
      <div className="mb-5 flex flex-wrap gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("preApplications")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "preApplications"
              ? "bg-ink text-white"
              : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
          }`}
        >
          <span>Prijave i Selekcija</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            activeTab === "preApplications"
              ? "bg-brand text-ink"
              : "bg-neutral-200 text-ink"
          }`}>
            {preAppsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("candidates")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "candidates"
              ? "bg-ink text-white"
              : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
          }`}
        >
          <span>Aktivni kandidati</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            activeTab === "candidates"
              ? "bg-brand text-ink"
              : "bg-neutral-200 text-ink"
          }`}>
            {activeProgramCandidates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "invitations"
              ? "bg-ink text-white"
              : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
          }`}
        >
          <span>{t("admin.pendingInvitations")}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            activeTab === "invitations"
              ? "bg-brand text-ink"
              : "bg-neutral-200 text-ink"
          }`}>
            {invitations.length}
          </span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* 1. PRIKAZ TAB-A: FAZA 0 — PRIJAVE, TRIJAŽA, KONSULTACIJE & GATE */}
      {/* ================================================================ */}
      {activeTab === "preApplications" && (
        <>
          {/* Pretraga i filteri po fazama trijaže */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pretraga prijava po imenu, fakultetu, telefonu..."
                className={inputCls}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preAppFilters.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPreAppFilter(id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                    preAppFilter === id
                      ? "bg-ink text-white"
                      : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {preAppRows.length === 0 ? (
            <EmptyState>Nema prijava u ovoj kategoriji pretrage.</EmptyState>
          ) : (
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-surface px-5 py-3 text-[13px] font-semibold text-ink-3">
                Evidencija prijava, trijaže, konsultacija i kvalifikacionog praga (Faza 0)
              </div>
              <ul className="divide-y divide-line">
                {preAppRows.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-surface"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Student info */}
                      <div className="flex items-start gap-3.5 min-w-[280px] max-w-sm">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-ink">
                          {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-ink truncate">{s.name}</span>
                            {s.isNew && (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                NOVO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-2 mt-0.5">
                            {s.email}
                          </p>
                          <p className="text-xs text-ink-2">
                            <strong>{s.phone || "Nije unet"}</strong>
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-ink-2">
                            <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 font-medium">
                              {s.faculty || "Fakultet"} ({s.studyCity || "Beograd"})
                            </span>
                            <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 font-medium">
                              Godina: {s.studyYear === "YEAR_1" ? "1. god" : s.studyYear === "YEAR_2" ? "2. god" : s.studyYear === "YEAR_3" ? "3. god" : s.studyYear === "YEAR_4" ? "4. god" : s.studyYear === "MASTER" ? "Master" : s.studyYear || "2. god"} ({s.ectsPoints || 0} ESPB)
                            </span>
                            <span className="inline-flex items-center rounded-md bg-amber-50 text-amber-900 px-2 py-0.5 font-semibold">
                              Engleski: {s.preferences?.englishLevel || "B2"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3 Faze obrade u karticama: 1. Poziv, 2. Konsultacije, 3. Selekcija */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-w-[320px]">
                        {/* KORAK 1: Trijaža & Poziv */}
                        <div className="rounded-xl border border-line bg-white p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-xs font-semibold text-ink-3">
                                1. Poziv & Trijaža
                              </span>
                              {s.contactStatus === "REACHED" || s.latestContactOutcome === "REACHED" ? (
                                <Badge tone="green">Ostvaren kontakt</Badge>
                              ) : s.contactStatus === "CALLBACK_REQUESTED" || s.latestContactOutcome === "CALLBACK_REQUESTED" ? (
                                <Badge tone="amber">Zatražen poziv</Badge>
                              ) : s.contactStatus === "ATTEMPTED" || s.latestContactOutcome === "NO_ANSWER" ? (
                                <Badge tone="red">Nema odgovora</Badge>
                              ) : (
                                <Badge tone="slate">Čeka poziv</Badge>
                              )}
                            </div>
                            {s.contactNotes ? (
                              <p className="text-xs text-ink-2 line-clamp-2 italic bg-surface p-1.5 rounded-md">
                                "{s.contactNotes}"
                              </p>
                            ) : (
                              <p className="text-xs text-ink-3 italic">Nema zabeleške sa poziva</p>
                            )}
                            {s.nextContactAt && (
                              <p className="mt-1 text-2xs font-semibold text-amber-800">
                                ⏰ Sledeći kontakt: {new Date(s.nextContactAt).toLocaleString("sr-RS", { dateStyle: "short", timeStyle: "short" })}
                              </p>
                            )}
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-line flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setSelectedCallCandidate(s)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-2"
                            >
                              <PhoneIcon className="h-3.5 w-3.5 text-ink" />
                              <span>{s.contactStatus ? "Ažuriraj poziv" : "Evidentiraj poziv"}</span>
                            </button>
                            {s.infoMaterialsSent ? (
                              <span className="text-2xs font-semibold text-emerald-700 flex items-center gap-0.5" title={`Poslato: ${s.infoMaterialsSentAt ? new Date(s.infoMaterialsSentAt).toLocaleDateString() : "Da"}`}>
                                ✓ Info paket
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendMaterials(s)}
                                className="text-2xs font-semibold text-ink hover:underline flex items-center gap-1"
                                title="Pošalji info brošuru i cenovnik na email kandidata"
                              >
                                <MailIcon className="h-3 w-3" />
                                <span>Pošalji brošuru</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* KORAK 2: Konsultacije (1-na-1) */}
                        <div className="rounded-xl border border-line bg-white p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-xs font-semibold text-ink-3">
                                2. Info Konsultacije
                              </span>
                              {s.consultationStatus === "ATTENDED" ? (
                                <Badge tone="green">✓ Održane</Badge>
                              ) : s.consultationStatus === "SCHEDULED" ? (
                                <Badge tone="blue">Zakazane</Badge>
                              ) : s.consultationStatus === "NO_SHOW" ? (
                                <Badge tone="red">✕ Nije došao</Badge>
                              ) : (
                                <Badge tone="slate">Nisu zakazane</Badge>
                              )}
                            </div>
                            {s.consultationStartsAt ? (
                              <div className="text-xs font-semibold text-ink">
                                {new Date(s.consultationStartsAt).toLocaleString("sr-RS", { dateStyle: "short", timeStyle: "short" })}
                                <span className="ml-1.5 font-normal text-2xs text-ink-3">
                                  ({s.consultationType === "IN_PERSON" ? "Uživo" : "Online"})
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-ink-3 italic">Nije zakazan termin</p>
                            )}
                            {s.consultationNotes && (
                              <p className="mt-1 text-xs text-ink-2 line-clamp-2 italic bg-surface p-1.5 rounded-md">
                                "{s.consultationNotes}"
                              </p>
                            )}
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-line">
                            <button
                              type="button"
                              onClick={() => setSelectedConsultationCandidate(s)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-2"
                            >
                              <CalendarIcon className="h-3.5 w-3.5 text-ink" />
                              <span>{s.consultationStatus === "SCHEDULED" ? "Evidentiraj ishod" : "Zakaži konsultacije"}</span>
                            </button>
                          </div>
                        </div>

                        {/* KORAK 3: Selekciona odluka (Readiness Gate za Fazu 1) */}
                        <div className="rounded-xl border border-line bg-white p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-xs font-semibold text-ink-3">
                                3. Odluka (Gate u Fazu 1)
                              </span>
                              {s.selectionDecision === "QUALIFIED" || Boolean(s.activationCode) ? (
                                s.registeredAt || s.isRegistered || s.status === "review" ? (
                                  <Badge tone="green">✓ Aktiviran nalog</Badge>
                                ) : (
                                  <Badge tone="amber">Čeka aktivaciju</Badge>
                                )
                              ) : s.selectionDecision === "REJECTED" || s.status === "rejected" ? (
                                <Badge tone="red">✕ Odbijen</Badge>
                              ) : (
                                <Badge tone="amber">U obradi</Badge>
                              )}
                            </div>
                            {s.selectionDecision === "QUALIFIED" || Boolean(s.activationCode) ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="tabular-nums text-xs font-bold tracking-wider text-ink">
                                    {s.activationCode || "KOD GENERISAN"}
                                  </span>
                                  {s.activationCode && (
                                    <button
                                      type="button"
                                      onClick={() => copyInvitationCode(s.activationCode)}
                                      className="text-2xs font-semibold text-ink hover:underline"
                                    >
                                      {copiedCode === s.activationCode ? "✓ Kopirano" : "Kopiraj"}
                                    </button>
                                  )}
                                </div>
                                {s.registeredAt || s.isRegistered || s.status === "review" ? (
                                  <p className="text-2xs text-emerald-800 font-semibold">
                                    ✓ Prešao u Fazu 1 ({s.packageName || "Program"})
                                  </p>
                                ) : (
                                  <p className="text-2xs text-amber-800 font-medium">
                                    Čeka aktivaciju naloga ({s.packageName || "Program"})
                                  </p>
                                )}
                              </div>
                            ) : s.selectionDecision === "REJECTED" || s.status === "rejected" ? (
                              <p className="text-xs text-red-900 font-medium line-clamp-2">
                                {s.decisionNote || "Prijava nije odobrena"}
                              </p>
                            ) : (
                              <p className="text-xs text-ink-3">
                                Nakon obavljenih konsultacija, donesite selekcionu odluku i izdajte registracioni kod.
                              </p>
                            )}
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-line flex flex-wrap items-center justify-between gap-1.5">
                            {s.selectionDecision !== "QUALIFIED" && !s.activationCode && s.status !== "rejected" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedQualifyCandidate(s)}
                                  className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white hover:bg-neutral-950"
                                  title="Obavi selekciju kandidata"
                                >
                                  <UserCheckIcon className="h-3.5 w-3.5 text-brand" />
                                  <span>Selekcija</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRejectCandidate(s)}
                                  className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-100"
                                  title="Odbij prijavu kandidata"
                                >
                                  <UserXIcon className="h-3.5 w-3.5 text-red-700" />
                                  <span>Odbij</span>
                                </button>
                              </>
                            ) : !s.activationCode && s.selectionDecision === "QUALIFIED" ? (
                              <div className="flex items-center gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReadinessCandidate(s)}
                                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                                  title="Preduslovi za kreiranje profila"
                                >
                                  <UserCheckIcon className="h-3.5 w-3.5 text-white" />
                                  <span>Spreman za profil (Gate)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedQualifyCandidate(s)}
                                  className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white px-2 py-1 text-xs font-semibold text-ink hover:bg-surface-2"
                                  title="Izmeni selekcionu odluku"
                                >
                                  Izmeni
                                </button>
                              </div>
                            ) : (s.selectionDecision === "QUALIFIED" || Boolean(s.activationCode)) && !s.isRegistered && !s.registeredAt && s.status === "applying" ? (
                              <button
                                type="button"
                                onClick={() => handleActivateCandidate(s)}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer"
                                title="Aktiviraj nalog odmah i prebaci kandidata u Fazu 1 (Aktivni kandidati)"
                              >
                                <CheckIcon className="h-3.5 w-3.5 text-white" />
                                <span>Aktiviraj nalog (Prebaci u Fazu 1)</span>
                              </button>
                            ) : (
                              <span className="text-2xs text-ink-3">
                                Odluka doneta: {s.decidedAt ? new Date(s.decidedAt).toLocaleDateString() : "Danas"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer kartice sa zabeleškama i brisanjem */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line text-xs text-ink-3">
                      <div>
                        <span>Podneto: {s.createdAt ? new Date(s.createdAt).toLocaleDateString("sr-RS") : "Danas"}</span>
                        {s.notes && (
                          <span className="ml-3 italic truncate max-w-md inline-block align-bottom">
                            {s.notes.split("\n").pop()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(s)}
                          className="text-xs font-semibold text-ink hover:underline"
                        >
                          Prikaži pun dosije kandidata &rarr;
                        </button>
                        <GhostIconButton
                          label="Obriši"
                          danger
                          onClick={() => handleDeleteCandidate(s.id, s.name)}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </GhostIconButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* 2. PRIKAZ TAB-A: POZIVNICE I VERIFIKACIONI KODOVI */}
      {/* ================================================================ */}
      {activeTab === "invitations" && (
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-surface px-5 py-3 text-[13px] font-semibold text-ink-3">
            Aktivni verifikacioni kodovi za registraciju naloga
          </div>
          <ul className="divide-y divide-line">
            {invitations.map((inv) => (
              <li key={inv.code} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-surface">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-base font-bold tracking-wider text-ink">
                      {inv.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyInvitationCode(inv.code)}
                      className="rounded-full border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:bg-surface-2"
                    >
                      {copiedCode === inv.code ? "✓ Kopirano" : "Kopiraj kod"}
                    </button>
                    <Badge tone={inv.status === "registered" ? "green" : "amber"}>
                      {inv.status === "registered" ? "Aktiviran nalog" : "Čeka registraciju"}
                    </Badge>
                    {inv.status !== "registered" && (
                      <button
                        type="button"
                        onClick={() => {
                          const cand = students.find((s) => s.email?.toLowerCase() === (inv.email || "").toLowerCase());
                          if (cand) {
                            handleActivateCandidate(cand);
                          } else {
                            handleActivateCandidate({
                              email: inv.email,
                              name: inv.candidateName,
                              packageName: inv.packageName,
                              packageId: inv.packageId,
                              activationCode: inv.code,
                              finalPrice: inv.finalPrice,
                            });
                          }
                        }}
                        className="rounded-full bg-emerald-50 px-2 py-1 text-2xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
                        title="Aktiviraj nalog odmah i prebaci kandidata u aktivne kandidate (Faze 1-3)"
                      >
                        Aktiviraj odmah
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleResetInvitation(inv.code)}
                      className="rounded-full bg-amber-50 px-2 py-1 text-2xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                      title="Resetuj kod na 'Čeka registraciju' i omogući ponovnu aktivaciju"
                    >
                      ↻ Resetuj kod
                    </button>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {inv.candidateName ? `${inv.candidateName} · ` : ""}{inv.email}
                  </p>
                  <p className="text-xs text-ink-3">
                    Paket: {inv.packageName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">{inv.finalPrice} €</p>
                  {inv.discount > 0 && (
                    <p className="text-xs font-medium text-emerald-700">
                      Popust: -{inv.discount} € {inv.discountNote ? `(${inv.discountNote})` : ""}
                    </p>
                  )}
                  <p className="text-2xs text-ink-3 mt-1">
                    Kreirano: {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ================================================================ */}
      {/* 3. PRIKAZ TAB-A: AKTIVNI KANDIDATI U PROGRAMU (FAZE 1-3) */}
      {/* ================================================================ */}
      {activeTab === "candidates" && (
        <>
          {/* Pretraga + filteri */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraga po imenu, emailu..." className={inputCls} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filters.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                    filter === id ? "bg-ink text-white" : "bg-surface-2 text-ink-2 hover:bg-neutral-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState>{t("admin.usersEmpty")}</EmptyState>
          ) : (
            <Card className="overflow-hidden">
              {/* Zaglavlje tabele */}
              <div className="hidden grid-cols-[1.8fr_1.2fr_1.4fr_auto] gap-4 border-b border-line px-5 py-3 text-[13px] font-semibold text-ink-3 md:grid items-center">
                <span>{t("admin.colStudent")}</span>
                <span>{t("admin.colProgram")}</span>
                <span>Trenutni korak</span>
                <span className="text-right">Akcije</span>
              </div>
              <ul className="divide-y divide-line">
                {rows.map((s) => {
                  const stepInfo = getCandidateStepInfo(s);
                  return (
                  <li
                    key={s.id}
                    className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-surface md:grid-cols-[1.8fr_1.2fr_1.4fr_auto] md:items-center md:gap-4"
                  >
                    <div
                      onClick={() => setSelectedCandidate(s)}
                      className="flex cursor-pointer items-center gap-3 min-w-0"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/30 text-xs font-semibold text-ink">
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="truncate text-xs text-ink-3">{s.email}</span>
                          {Boolean(s.signedContractFileName || s.contractSigned) ? (
                            <span className="inline-flex items-center rounded-sm bg-emerald-100 px-1.5 py-0.2 text-2xs font-semibold text-emerald-800" title={`Ugovor: ${s.signedContractFileName || "Potpisan"}`}>
                              ✓ Ugovor
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.2 text-2xs font-semibold text-amber-800" title="Ugovor nije okačen (uplate blokirane)">
                              Bez ugovora
                            </span>
                          )}
                        </div>
                      </span>
                    </div>

                    <span
                      onClick={() => setSelectedCandidate(s)}
                      className="cursor-pointer truncate text-sm text-ink-2"
                    >
                      {s.program}
                    </span>

                    <div
                      onClick={() => setSelectedCandidate(s)}
                      className="flex cursor-pointer flex-col gap-1 min-w-0"
                    >
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${stepInfo.badgeCls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${stepInfo.dotCls}`} />
                        {stepInfo.stepTitle}
                      </span>
                      <span className="truncate text-xs font-medium text-ink-2" title={stepInfo.subLabel}>
                        {stepInfo.subLabel}
                      </span>
                    </div>

                    {/* Akciona dugmad */}
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCandidate(s)}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-2"
                        title="Izmeni podatke aplikacije"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Detalji</span>
                      </button>
                      <GhostIconButton
                        label="Obriši"
                        danger
                        onClick={() => handleDeleteCandidate(s.id, s.name)}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </GhostIconButton>
                    </div>
                  </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* SVI MODALI */}
      {/* ================================================================ */}
      {selectedCandidate && (
        <CandidateApplicationModal
          candidate={selectedCandidate}
          onSave={handleSaveCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      {showCodeModal && (
        <GenerateCodeModal
          onCreated={handleCodeCreated}
          onClose={() => setShowCodeModal(false)}
        />
      )}

      {/* Faza 0 Modali */}
      {selectedCallCandidate && (
        <RecordCallModal
          candidate={selectedCallCandidate}
          onSave={handleSaveCall}
          onClose={() => setSelectedCallCandidate(null)}
        />
      )}

      {selectedConsultationCandidate && (
        <ScheduleConsultationModal
          candidate={selectedConsultationCandidate}
          onSave={handleSaveConsultation}
          onClose={() => setSelectedConsultationCandidate(null)}
        />
      )}

      {selectedQualifyCandidate && (
        <CandidateSelectionModal
          candidate={selectedQualifyCandidate}
          onSave={handleSaveSelection}
          onClose={() => setSelectedQualifyCandidate(null)}
        />
      )}

      {selectedReadinessCandidate && (
        <ProfileReadinessModal
          candidate={selectedReadinessCandidate}
          onSave={handleApproveReadiness}
          onActivateDirectly={(cand) => handleActivateCandidate(cand)}
          onClose={() => setSelectedReadinessCandidate(null)}
        />
      )}

      {selectedRejectCandidate && (
        <RejectPreAppModal
          candidate={selectedRejectCandidate}
          onSave={handleRejectPreApp}
          onClose={() => setSelectedRejectCandidate(null)}
        />
      )}

      {showNewPreAppModal && (
        <NewPreAppModal
          onCreated={handleCreateManualPreApp}
          onClose={() => setShowNewPreAppModal(false)}
        />
      )}
    </>
  );
}
