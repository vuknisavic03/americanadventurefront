import { DEMO_MODE } from "../../config.js";
// front/src/data/candidateStore/preApplications.js
// Faza 0: Online prijave, trijaža, pozivi, konsultacije i selekcioni gate

import { saveCandidate } from "./candidates.js";
import { getCandidates } from "./session.js";
import { PROGRAM_PACKAGES } from "./mockSeed.js";
import { createInvitation } from "./invitations.js";

/**
 * Šalje online prijavu na pravi backend endpoint (/api/public/pre-applications).
 */
export async function submitPreApplicationWithBackend({
  firstName,
  lastName,
  email,
  phone,
  jmbg,
  birthDate,
  address,
  faculty,
  studyCity,
  studyYear,
  repeatedYear,
  ectsPoints,
  program,
  previousExperience,
  message,
  newsletterConsent = false,
}) {
  let dateOfBirth = birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : "2002-05-15";
  const cleanJmbg = String(jmbg || "").replace(/\D/g, "");
  if (!birthDate && cleanJmbg.length >= 7) {
    const day = cleanJmbg.slice(0, 2);
    const month = cleanJmbg.slice(2, 4);
    const yrPart = cleanJmbg.slice(4, 7);
    const year = yrPart.startsWith("0") ? `2${yrPart}` : `1${yrPart}`;
    const candidateIso = `${year}-${month}-${day}`;
    const parsed = new Date(`${candidateIso}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === candidateIso) {
      dateOfBirth = candidateIso;
    }
  }

  const studyYearMap = {
    1: "YEAR_1",
    2: "YEAR_2",
    3: "YEAR_3",
    4: "YEAR_4",
    master: "MASTER",
  };
  const currentStudyYear = studyYearMap[String(studyYear || "2").toLowerCase()] || "YEAR_2";
  const studyInterruptionStatus = repeatedYear === "Da" ? "RENEWED_YEAR" : "NONE";

  const noteParts = [
    `Program: ${program || "Work and Travel"}`,
    jmbg ? `JMBG: ${jmbg}` : "",
    previousExperience === "yes" ? "Ranije bio/la na programu" : "",
    message ? `Poruka: ${message}` : "",
  ].filter(Boolean);

  let delivered = false;
  try {
    const res = await fetch("/api/public/pre-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstName: firstName || "Kandidat",
        lastName: lastName || "Prijava",
        email,
        phone,
        dateOfBirth,
        facultyName: faculty || "Univerzitet u Beogradu",
        studyCity: studyCity || "Beograd",
        residentialAddress: address || "Beograd, Srbija",
        currentStudyYear,
        espbPoints: Math.max(0, Number.parseInt(String(ectsPoints ?? "120"), 10) || 0),
        studyInterruptionStatus,
        privacyConsent: true,
        newsletterConsent: Boolean(newsletterConsent),
        applicantNote: noteParts.join(" | "),
        website: "",
      }),
    });
    delivered = res.ok;
  } catch {
    // Mreža nije dostupna — pozivalac prikazuje grešku i rezervni put (e-pošta).
  }
  // U demo režimu (bez backenda) prijava se čuva samo lokalno, da prototip ostane upotrebljiv.
  if (!delivered && !DEMO_MODE) return { delivered: false };

  const saved = saveCandidate({
    id: `preapp-${Date.now()}`,
    email: (email || "").trim().toLowerCase(),
    firstName: firstName || "Kandidat",
    lastName: lastName || "",
    name: `${firstName || "Kandidat"} ${lastName || ""}`.trim(),
    phone: (phone || "").trim(),
    jmbg: cleanJmbg,
    faculty: (faculty || "").trim(),
    studyCity: studyCity || "Beograd",
    studyYear: currentStudyYear,
    ectsPoints: Math.max(0, Number.parseInt(String(ectsPoints ?? "120"), 10) || 0),
    packageId: "swt-full",
    packageName: `Online prijava: ${program || "Work & Travel USA"}`,
    program: program || "Work & Travel USA",
    status: "applying",
    progress: 10,
    isNew: true,
    contactStatus: "NOT_ATTEMPTED",
    latestContactOutcome: null,
    contactNotes: "",
    nextContactAt: null,
    infoMaterialsSent: false,
    infoMaterialsSentAt: null,
    consultationStatus: "NOT_SCHEDULED",
    consultationStartsAt: null,
    consultationType: "ONLINE",
    consultationNotes: "",
    selectionDecision: "PENDING",
    decisionNote: "",
    decidedAt: null,
    notes: noteParts.join(" | "),
    createdAt: new Date().toISOString(),
  });
  return { delivered: true, candidate: saved };
}

/**
 * FAZA 0: Evidentira pokušaj telefonskog ili email kontakta (trijaža prijava).
 */
export function recordContactAttempt(candidateId, { outcome, note = "", nextContactAt = null, sendMaterials = false }) {
  const list = getCandidates();
  const idx = list.findIndex((c) => String(c.id) === String(candidateId) || c.email === candidateId);
  if (idx < 0) return null;

  const dateStr = new Date().toLocaleDateString("sr-RS");
  const outcomeLabels = {
    REACHED: "Razgovor obavljen",
    NO_ANSWER: "Bez odgovora",
    CALLBACK_REQUESTED: "Tražen ponovni poziv",
    INVALID_CONTACT: "Neispravan kontakt",
  };
  const outcomeLabel = outcomeLabels[outcome] || outcome;
  const newNote = `[${dateStr} Poziv]: ${outcomeLabel}${note ? ` — ${note}` : ""}${nextContactAt ? ` (Sledeći kontakt: ${nextContactAt})` : ""}`;

  const updated = {
    ...list[idx],
    contactStatus: outcome === "REACHED" ? "REACHED" : outcome === "CALLBACK_REQUESTED" ? "FOLLOW_UP_REQUIRED" : "ATTEMPTED",
    latestContactOutcome: outcome,
    latestContactAt: new Date().toISOString(),
    nextContactAt: nextContactAt || list[idx].nextContactAt,
    notes: list[idx].notes ? `${list[idx].notes}\n${newNote}` : newNote,
    isNew: false,
  };

  if (sendMaterials) {
    updated.infoMaterialsSent = true;
    updated.infoMaterialsSentAt = new Date().toISOString();
  }

  saveCandidate(updated);
  return updated;
}

/**
 * FAZA 0: Šalje informativni materijal / brošuru kandidatu.
 */
export function sendQualificationMaterials(candidateId) {
  const list = getCandidates();
  const idx = list.findIndex((c) => String(c.id) === String(candidateId) || c.email === candidateId);
  if (idx < 0) return null;

  const dateStr = new Date().toLocaleDateString("sr-RS");
  const newNote = `[${dateStr}]: Poslat informativni materijal i brošura na email ${list[idx].email}.`;

  const updated = {
    ...list[idx],
    infoMaterialsSent: true,
    infoMaterialsSentAt: new Date().toISOString(),
    notes: list[idx].notes ? `${list[idx].notes}\n${newNote}` : newNote,
  };

  saveCandidate(updated);
  return updated;
}

/**
 * FAZA 0: Zakazuje termin za konsultacije (uživo ili video poziv).
 */
export function scheduleConsultation(candidateId, { scheduledAt, consultationType = "ONLINE", notes = "" }) {
  const list = getCandidates();
  const idx = list.findIndex((c) => String(c.id) === String(candidateId) || c.email === candidateId);
  if (idx < 0) return null;

  const dateStr = new Date().toLocaleDateString("sr-RS");
  const typeLabel = consultationType === "IN_PERSON" ? "Uživo u agenciji (Beograd)" : "Online video sastanak";
  const newNote = `[${dateStr}]: Zakazane konsultacije za ${scheduledAt} (${typeLabel}).${notes ? ` Napomena: ${notes}` : ""}`;

  const updated = {
    ...list[idx],
    consultationStatus: "SCHEDULED",
    consultationStartsAt: scheduledAt,
    consultationType,
    consultationNotes: notes || list[idx].consultationNotes || "",
    notes: list[idx].notes ? `${list[idx].notes}\n${newNote}` : newNote,
  };

  saveCandidate(updated);
  return updated;
}

/**
 * FAZA 0: Evidentira ishod i prisustvo na konsultacijama.
 */
export function recordConsultationAttendance(candidateId, { attendanceStatus, notes = "" }) {
  const list = getCandidates();
  const idx = list.findIndex((c) => String(c.id) === String(candidateId) || c.email === candidateId);
  if (idx < 0) return null;

  const dateStr = new Date().toLocaleDateString("sr-RS");
  const statusLabels = {
    ATTENDED: "Konsultacije održane (Kandidat prisustvovao)",
    NO_SHOW: "Kandidat se nije pojavio na zakazanom terminu",
    CANCELLED: "Konsultacije otkazane",
  };
  const label = statusLabels[attendanceStatus] || attendanceStatus;
  const newNote = `[${dateStr}]: ${label}.${notes ? ` Utisak/beleška: ${notes}` : ""}`;

  const updated = {
    ...list[idx],
    consultationStatus: attendanceStatus,
    consultationNotes: notes ? `${list[idx].consultationNotes ? `${list[idx].consultationNotes}\n` : ""}${notes}` : list[idx].consultationNotes,
    notes: list[idx].notes ? `${list[idx].notes}\n${newNote}` : newNote,
  };

  saveCandidate(updated);
  return updated;
}

/**
 * FAZA 0 (FR-007, FR-008, FR-009, FR-010, FR-011): Selekcioni ishod.
 * Označava da li kandidat ispunjava uslove (FR-007) ili ne ispunjava (FR-009).
 * Ako ispunjava uslove, automatski se evidentira slanje obavezne dokumentacije (FR-008)
 * i poziva na konsultacije preko Calendly linka (FR-011).
 * Ako ne ispunjava uslove, zahteva se obavezna napomena sa razlogom odbijanja (FR-010, BR-005).
 */
export function markCandidateSelection(candidateId, options = {}) {
  const {
    eligible,
    decision,
    rejectionReason = "",
    rejectionNote = "",
    reason = "",
    notes = "",
    sendDocuments = true,
    sendDocumentation = true,
    inviteConsultations = true,
    sendCalendly = true,
  } = options;

  const isEligible = eligible !== undefined ? Boolean(eligible) : (decision === "QUALIFIED");
  const fullReason = (rejectionReason || reason || rejectionNote || notes || "").trim();

  const list = getCandidates();
  const idx = list.findIndex((c) => String(c.id) === String(candidateId) || c.email === candidateId);
  if (idx < 0) return null;

  const dateStr = new Date().toLocaleDateString("sr-RS");
  const nowIso = new Date().toISOString();

  if (!isEligible) {
    const noteEntry = `[${dateStr} Selekcija]: Kandidat NE ISPUNJAVA uslove za prijem (FR-009). Razlog: ${fullReason}`;
    const updated = {
      ...list[idx],
      status: "rejected",
      selectionDecision: "REJECTED",
      decisionNote: fullReason,
      decidedAt: nowIso,
      progress: 0,
      notes: list[idx].notes ? `${list[idx].notes}\n${noteEntry}` : noteEntry,
    };
    saveCandidate(updated);
    return updated;
  }

  // Kandidat ISPUNJAVA uslove (FR-007)
  const shouldSendDocs = Boolean(sendDocuments && sendDocumentation);
  const shouldInvite = Boolean(inviteConsultations && sendCalendly);
  const actionEntries = [`[${dateStr} Selekcija]: Kandidat ISPUNJAVA uslove za prijem na program (FR-007).`];
  if (shouldSendDocs) {
    actionEntries.push(`[${dateStr} FR-008]: Poslata obavezna dokumentacija (Ugovor 2027, Izjava o odgovornosti, Cenovnik i Pravila).`);
  }
  if (shouldInvite) {
    actionEntries.push(`[${dateStr} FR-011]: Poslat drugi email za zakazivanje konsultacija (Calendly link).`);
  }

  const updated = {
    ...list[idx],
    selectionDecision: "QUALIFIED",
    decidedAt: nowIso,
    infoMaterialsSent: shouldSendDocs ? true : list[idx].infoMaterialsSent,
    infoMaterialsSentAt: shouldSendDocs ? nowIso : list[idx].infoMaterialsSentAt,
    consultationInvited: shouldInvite ? true : list[idx].consultationInvited,
    consultationInviteSentAt: shouldInvite ? nowIso : list[idx].consultationInviteSentAt,
    calendlyLink: "https://calendly.com/american-adventure/konsultacije",
    notes: list[idx].notes ? `${list[idx].notes}\n${actionEntries.join("\n")}` : actionEntries.join("\n"),
  };

  saveCandidate(updated);
  return updated;
}

/**
 * FAZA 0 (SELEKCIONI READINESS GATE - FR-015, BR-002):
 * Proverava da li kandidat zadovoljava definisane preduslove:
 * 1. Prošao inicijalnu selekciju (ispunjava uslove, FR-007)
 * 2. Poslata/učinjena dostupnom obavezna dokumenta (FR-008)
 * 3. Održane konsultacije i prisustvovao (FR-013)
 * Tek kada su preduslovi ispunjeni (ili uz eksplicitno administrativno odobrenje),
 * kandidat dobija status 'spreman za kreiranje profila' i izdaje mu se aktivacioni kod za Fazu 1.
 */
export function approveProfileReadiness(candidateId, options = {}) {
  const {
    packageId = "swt-full",
    discount = 0,
    discountNote = "Kvalifikovan na konsultacijama",
    bypassPrerequisites = false,
    overridePrerequisites = false,
  } = options;

  const canBypass = Boolean(bypassPrerequisites || overridePrerequisites);

  const list = getCandidates();
  const idx = list.findIndex((c) => String(c.id) === String(candidateId) || c.email === candidateId);
  if (idx < 0) return null;

  const cand = list[idx];

  // Provera preduslova prema FR-015 i BR-002
  const selectionPassed = cand.selectionDecision === "QUALIFIED";
  const documentsSent = Boolean(cand.infoMaterialsSent);
  const consultationAttended = cand.consultationStatus === "ATTENDED";

  if (!canBypass && (!selectionPassed || !documentsSent || !consultationAttended)) {
    const missing = [];
    if (!selectionPassed) missing.push("inicijalna selekcija (označiti da ispunjava uslove)");
    if (!documentsSent) missing.push("slanje obavezne dokumentacije");
    if (!consultationAttended) missing.push("održane konsultacije uz potvrđeno prisustvo");
    return {
      error: `Kandidat ne ispunjava preduslove za profil (FR-015/BR-002). Nedostaje: ${missing.join(", ")}.`,
      missing,
    };
  }

  const pkg = PROGRAM_PACKAGES.find((p) => p.id === packageId) || PROGRAM_PACKAGES[0];
  const finalPrice = Math.max(0, pkg.basePrice - (Number(discount) || 0));

  // Kreiraj pozivnicu sa jedinstvenim kodom
  const newInv = createInvitation({
    email: cand.email,
    candidateName: `${cand.firstName || ""} ${cand.lastName || ""}`.trim() || cand.name,
    packageId: pkg.id,
    discount: Number(discount) || 0,
    discountNote,
  });

  const dateStr = new Date().toLocaleDateString("sr-RS");
  const noteEntry = `[${dateStr} FR-015/BR-002]: Svi preduslovi ispunjeni (selekcija, ugovor, konsultacije). Odobrena spremnost za kreiranje profila. Izdat aktivacioni kod: ${newInv.code}.`;

  const updated = {
    ...cand,
    packageId: pkg.id,
    packageName: pkg.name,
    basePrice: pkg.basePrice,
    discount: Number(discount) || 0,
    discountNote,
    finalPrice,
    selectionDecision: "QUALIFIED",
    isReadyForProfile: true,
    profileReadinessApprovedAt: new Date().toISOString(),
    activationCode: newInv.code,
    decidedAt: new Date().toISOString(),
    status: cand.status === "review" ? "review" : "applying",
    progress: cand.status === "review" ? 40 : 35,
    notes: cand.notes ? `${cand.notes}\n${noteEntry}` : noteEntry,
  };

  saveCandidate(updated);
  return { candidate: updated, invitation: newInv };
}

/**
 * FAZA 0 (SELEKCIONI READINESS GATE): Kvalifikuje kandidata i generiše verifikacioni kod za Fazu 1.
 * Kompatibilni wrapper za approveProfileReadiness.
 */
export function qualifyCandidateAndIssueCode(candidateId, params) {
  return approveProfileReadiness(candidateId, { ...params, bypassPrerequisites: true });
}

/**
 * FAZA 0: Odbija prijavu kandidata uz obrazloženje i belešku.
 */
export function rejectPreApplication(candidateId, { reason, note = "" }) {
  const list = getCandidates();
  const idx = list.findIndex((c) => String(c.id) === String(candidateId) || c.email === candidateId);
  if (idx < 0) return null;

  const dateStr = new Date().toLocaleDateString("sr-RS");
  const noteEntry = `[${dateStr}]: Prijava ODBIJENA. Razlog: ${reason}${note ? ` (${note})` : ""}.`;

  const updated = {
    ...list[idx],
    status: "rejected",
    selectionDecision: "REJECTED",
    decisionNote: `${reason}${note ? ` — ${note}` : ""}`,
    decidedAt: new Date().toISOString(),
    progress: 0,
    notes: list[idx].notes ? `${list[idx].notes}\n${noteEntry}` : noteEntry,
  };

  saveCandidate(updated);
  return updated;
}

/**
 * FAZA 0: Ručni unos prijave direktno iz admin panela (za kandidate koji dođu lično ili pozovu telefonom).
 */
export function createManualPreApplication(formData) {
  const now = Date.now();
  const cleanJmbg = String(formData.jmbg || "").replace(/\D/g, "");
  const newLead = {
    id: `preapp-${now}`,
    email: (formData.email || "").trim().toLowerCase(),
    firstName: formData.firstName || "Kandidat",
    lastName: formData.lastName || "",
    name: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
    phone: (formData.phone || "").trim(),
    jmbg: cleanJmbg,
    faculty: formData.faculty || "Fakultet",
    studyCity: formData.studyCity || "Beograd",
    studyYear: formData.studyYear || "YEAR_2",
    ectsPoints: Number(formData.ectsPoints) || 120,
    program: formData.program || "Work & Travel USA",
    packageName: `Prijava: ${formData.program || "Work & Travel USA"}`,
    packageId: "swt-full",
    status: "applying",
    progress: 10,
    isNew: true,
    contactStatus: formData.contactStatus || "NOT_ATTEMPTED",
    latestContactOutcome: null,
    contactNotes: formData.initialNote || "",
    nextContactAt: null,
    infoMaterialsSent: false,
    infoMaterialsSentAt: null,
    consultationStatus: "NOT_SCHEDULED",
    consultationStartsAt: null,
    consultationType: "ONLINE",
    consultationNotes: "",
    selectionDecision: "PENDING",
    decisionNote: "",
    decidedAt: null,
    preferences: {
      englishLevel: formData.englishLevel || "B2",
      location: formData.location || "",
      position: "",
    },
    notes: `[${new Date().toLocaleDateString("sr-RS")}]: Ručni unos prijave u agenciji.${formData.initialNote ? ` Napomena: ${formData.initialNote}` : ""}`,
    createdAt: new Date().toISOString(),
  };

  saveCandidate(newLead);
  return newLead;
}
