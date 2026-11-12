// front/src/data/candidateStore/candidates.js
// Upravljanje profilima kandidata, sinhronizacija, reaktivni prelasci koraka i statusi dokumenata

import {
  CANDIDATES_KEY,
  INVITATIONS_KEY,
  CURRENT_USER_KEY,
  PROMOTIONS_KEY,
  loadData,
  saveData,
} from "./storage.js";
import { INITIAL_CANDIDATES, INITIAL_INVITATIONS } from "./mockSeed.js";
import { ensureCandidateInstallmentInvoice, getCurrentNbsRate } from "../invoicesStore.js";

/**
 * Računa popunjenost studentskog profila i CV-ja za potrebe interne validacije (0-100)
 */
export function calculateProfileScore(candidate) {
  if (!candidate) return 0;
  let score = 0;
  // 1. Lični podaci i kontakt
  if (candidate.firstName && candidate.lastName && candidate.faculty && candidate.phone) score += 20;
  // 2. Radno iskustvo i veštine / CV fajl
  if (candidate.cvFileName || (Array.isArray(candidate.workExperience) && candidate.workExperience.length > 0)) score += 25;
  // 3. Datumi dostupnosti za rad u SAD
  if (candidate.availability?.startDate && candidate.availability?.endDate) score += 15;
  // 4. Radne preferencije i veštine
  if (candidate.preferences?.location || candidate.preferences?.position || (Array.isArray(candidate.skills) && candidate.skills.length > 0)) score += 20;
  // 5. 60s video prezentacija
  if (candidate.youtubeUrl || candidate.videoUrl) score += 20;
  return Math.min(score, 100);
}

/**
 * Vraća precizne informacije o trenutnom koraku kandidata (bez procenata).
 * Korak 0 se prikazuje kao "Registracija", a završni koraci kao "Čekanje na vizu" / "Viza odobrena".
 */

export const DS160_REQUIRED_FIELDS = [
  "lastNameAndMaiden",
  "firstName",
  "dateOfBirth",
  "birthPlace",
  "jmbg",
  "passportNumber",
  "passportExpiryDate",
  "employerInfo",
  "supervisorName",
  "stayAddress",
  "employerPhone",
  "homeAddress",
  "mobilePhone",
  "university",
  "referencePerson1",
  "referencePerson2",
  "emergencyContact",
];

export function getDs160Status(ds160) {
  if (!ds160 || typeof ds160 !== "object") {
    return {
      isComplete: false,
      isStarted: false,
      filledCount: 0,
      totalCount: DS160_REQUIRED_FIELDS.length,
      label: "Za popunjavanje",
    };
  }

  const filledCount = DS160_REQUIRED_FIELDS.filter(
    (k) => String(ds160[k] || "").trim().length > 0
  ).length;
  const anyFilled = Object.values(ds160).some((v) => String(v || "").trim().length > 0);
  const isComplete = filledCount === DS160_REQUIRED_FIELDS.length;

  if (isComplete) {
    return {
      isComplete: true,
      isStarted: true,
      filledCount,
      totalCount: DS160_REQUIRED_FIELDS.length,
      label: "Kompletno popunjen",
    };
  }

  if (anyFilled) {
    return {
      isComplete: false,
      isStarted: true,
      filledCount,
      totalCount: DS160_REQUIRED_FIELDS.length,
      label: "U toku (Delimično)",
    };
  }

  return {
    isComplete: false,
    isStarted: false,
    filledCount: 0,
    totalCount: DS160_REQUIRED_FIELDS.length,
    label: "Za popunjavanje",
  };
}

export function isDs160Complete(ds160) {
  return getDs160Status(ds160).isComplete;
}

export function getCandidateStepInfo(candidate) {
  if (!candidate) {
    return {
      stepNumber: 0,
      stepKey: "registration",
      stepTitle: "Registracija",
      subLabel: "Ugovor i I rata",
      badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
      dotCls: "bg-amber-500",
    };
  }

  const rawStatus = candidate.status === "in_review" ? "review" : (candidate.status || "review");

  if (rawStatus === "rejected" || candidate.selectionDecision === "REJECTED") {
    return {
      stepNumber: -1,
      stepKey: "rejected",
      stepTitle: "Odbijena prijava",
      subLabel: candidate.decisionNote || "Ne ispunjava uslove programa",
      badgeCls: "bg-red-50 text-red-700 border-red-200",
      dotCls: "bg-red-500",
    };
  }

  const isPhase0 =
    !candidate.isRegistered &&
    !candidate.registeredAt &&
    (rawStatus === "applying" || String(candidate.id || "").startsWith("preapp-"));

  if (isPhase0) {
    let subLabel = "Novi upit — čeka kontakt";
    if (candidate.selectionDecision === "QUALIFIED") subLabel = "Kvalifikovan — poslat kod za registraciju";
    else if (candidate.consultationStatus === "ATTENDED") subLabel = "Konsultacije održane — čeka odluku";
    else if (candidate.consultationStatus === "SCHEDULED") subLabel = "Zakazane konsultacije";
    else if (candidate.contactStatus === "REACHED") subLabel = "Obavljen inicijalni razgovor";
    return {
      stepNumber: 0,
      stepKey: "selection",
      stepTitle: "Prijava i selekcija",
      subLabel,
      badgeCls: "bg-purple-50 text-purple-700 border-purple-200",
      dotCls: "bg-purple-500",
    };
  }

  const isContractRejected = Boolean(
    candidate.contractVerificationStatus === "rejected" ||
      (!candidate.contractApproved && candidate.contractRejectionReason)
  );
  const contractApproved = Boolean(
    !isContractRejected &&
      (candidate.contractApproved || candidate.contractVerificationStatus === "approved")
  );
  const isFullPaid = Boolean(
    candidate.isFullPaymentPaid ||
      (candidate.paymentMethod === "now" &&
        (candidate.firstInstallmentApproved ||
          candidate.firstInstallmentStatus === "paid" ||
          candidate.firstPaymentStatus === "paid"))
  );
  const r1Paid = Boolean(
    candidate.firstInstallmentApproved ||
      candidate.firstInstallmentStatus === "paid" ||
      candidate.firstPaymentStatus === "paid" ||
      isFullPaid
  );
  const isDocsRejected = Boolean(
    candidate.documentsVerificationStatus === "rejected" ||
      (!candidate.documentsApproved && candidate.documentsRejectionReason)
  );
  const docsApproved = Boolean(
    !isDocsRejected &&
      (candidate.documentsApproved || candidate.documentsVerificationStatus === "approved")
  );
  const r2Paid = Boolean(
    candidate.secondInstallmentPaid ||
      candidate.secondInstallmentStatus === "paid" ||
      isFullPaid
  );
  const hasJob = Boolean(
    (candidate.jobApplicationStatus === "ACCEPTED" || candidate.jobOfferSignedAt || candidate.hasJob) &&
    candidate.jobApplicationStatus !== "SCHEDULED" &&
    candidate.jobApplicationStatus !== "APPLIED" &&
    candidate.jobApplicationStatus !== "NO_SLOTS" &&
    candidate.jobApplicationStatus !== "REJECTED"
  );
  const hasVisa = Boolean(candidate.hasVisa || rawStatus === "ready");

  if (hasVisa || rawStatus === "ready") {
    return {
      stepNumber: 4,
      stepKey: "ready",
      stepTitle: "Viza odobrena",
      subLabel: candidate.flightDepartureDate
        ? `Let: ${candidate.flightDepartureDate} • Spreman za polazak`
        : "Spreman za polazak u SAD",
      badgeCls: "bg-emerald-100 text-emerald-900 border-emerald-300",
      dotCls: "bg-emerald-600",
    };
  }

  if (rawStatus === "departure" || (docsApproved && hasJob && r2Paid)) {
    const hasDs160 = candidate.ds160 && Object.keys(candidate.ds160).length > 0;
    let subLabel = "Priprema za Ambasadu i viziranje";
    if (!hasDs160) subLabel = "Popunjavanje DS-160 upitnika";
    else if (!candidate.embassyInterviewDate) subLabel = "Čeka zakazivanje termina u Ambasadi";
    else subLabel = `Termin u Ambasadi: ${candidate.embassyInterviewDate}`;

    return {
      stepNumber: 3,
      stepKey: "departure",
      stepTitle: "Čekanje na vizu",
      subLabel,
      badgeCls: "bg-teal-50 text-teal-800 border-teal-200",
      dotCls: "bg-teal-500",
    };
  }

  if (rawStatus === "job" || docsApproved) {
    let subLabel = "Priprema za intervju i izbor posla";
    if (candidate.jobApplicationStatus === "SCHEDULED") {
      subLabel = candidate.interviewScheduledAt
        ? `Intervju zakazan (${candidate.interviewScheduledAt})`
        : "Intervju sa poslodavcem zakazan";
    } else if (candidate.jobApplicationStatus === "NO_SLOTS") {
      subLabel = "Nema termina za intervju — potreban novi izbor";
    } else if (candidate.jobApplicationStatus === "REJECTED") {
      subLabel = "Poslodavac odbio kandidata — potreban novi izbor";
    } else if (candidate.jobApplicationStatus === "APPLIED") {
      subLabel = "Prijava za posao poslata — čeka termin";
    } else if (!candidate.selectedJobTitle && !candidate.selectedJobEmployer && !hasJob) {
      subLabel = "Izbor radne ponude iz kataloga poslova";
    } else if (!candidate.jobOfferSignedAt && !hasJob) {
      subLabel = "Čeka potvrdu poslodavca / Job Offer";
    } else if (candidate.secondInstallmentStatus === "pending" && !r2Paid) {
      subLabel = "II rata prijavljena — čeka potvrdu";
    } else if (!r2Paid) {
      subLabel = candidate.paymentMethod === "now"
        ? "Izbor posla i priprema intervjua"
        : `Čeka uplatu II rate (${candidate.secondInstallmentAmount || 400} €)`;
    } else {
      subLabel = candidate.paymentMethod === "now" ? "Posao potvrđen" : "Posao i II rata potvrđeni";
    }

    return {
      stepNumber: 2,
      stepKey: "job",
      stepTitle: "Korak 2: Posao i ponuda",
      subLabel,
      badgeCls: "bg-indigo-50 text-indigo-800 border-indigo-200",
      dotCls: "bg-indigo-500",
    };
  }

  if (rawStatus === "docs" || (contractApproved && r1Paid)) {
    if (isContractRejected) {
      return {
        stepNumber: 0,
        stepKey: "review",
        stepTitle: "Registracija",
        subLabel: "Ugovor odbijen — potreban novi upload",
        badgeCls: "bg-red-50 text-red-700 border-red-200",
        dotCls: "bg-red-500",
      };
    }
    let subLabel = "Prikupljanje dokumenata i CV";
    if (candidate.documentsVerificationStatus === "rejected") {
      subLabel = "Dosije vraćen na dopunu";
    } else if (
      candidate.documentsVerificationStatus === "pending" ||
      candidate.documentsSubmittedForReview
    ) {
      subLabel = "Dosije poslat — čeka odobrenje admina";
    }
    return {
      stepNumber: 1,
      stepKey: "docs",
      stepTitle: "Korak 1: Profil i dokumenta",
      subLabel,
      badgeCls: "bg-blue-50 text-blue-800 border-blue-200",
      dotCls: "bg-blue-500",
    };
  }

  // Default za registrovane kandidate: Registracija (nekadašnji Korak 0)
  let regSubLabel = "Potpisivanje ugovora i I rata";
  if (!candidate.contractSigned && !candidate.signedContractFileName) {
    regSubLabel = "Čeka otpremanje potpisanog ugovora";
  } else if (candidate.contractVerificationStatus === "rejected") {
    regSubLabel = "Ugovor odbijen — potreban novi upload";
  } else if (!contractApproved && candidate.firstInstallmentStatus === "pending" && !r1Paid) {
    regSubLabel = "Čeka overu ugovora i potvrdu I rate";
  } else if (!contractApproved) {
    regSubLabel = "Ugovor poslat — čeka overu admina";
  } else if (candidate.firstInstallmentStatus === "pending" && !r1Paid) {
    regSubLabel = "I rata prijavljena — čeka potvrdu admina";
  } else if (!r1Paid) {
    regSubLabel = candidate.paymentMethod === "now"
      ? `Ugovor overen • Čeka uplatu programa u celosti (${candidate.finalPrice || 1750} €)`
      : `Ugovor overen • Čeka uplatu I rate (${candidate.firstInstallmentAmount || 250} €)`;
  }

  return {
    stepNumber: 0,
    stepKey: "review",
    stepTitle: "Registracija",
    subLabel: regSubLabel,
    badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
    dotCls: "bg-amber-500",
  };
}

export function getCandidates() {
  return loadData(CANDIDATES_KEY, INITIAL_CANDIDATES);
}

export function getCurrentUser() {
  return loadData(CURRENT_USER_KEY, null);
}

export function setCurrentUser(user) {
  saveData(CURRENT_USER_KEY, user);
}

export function clearCurrentUser() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {}
}

export function resetDemoData() {
  saveData(CANDIDATES_KEY, INITIAL_CANDIDATES);
  saveData(INVITATIONS_KEY, INITIAL_INVITATIONS);
  return INITIAL_CANDIDATES;
}

/**
 * Sinhronizuje podatke kandidata i pozivnica sa backend servera (/api/public/portal-state).
 */
export async function syncFromBackend(email) {
  try {
    const url = email
      ? `/api/public/portal-state?email=${encodeURIComponent(email)}`
      : "/api/public/portal-state";
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.invitations)) {
      saveData(INVITATIONS_KEY, data.invitations);
    }
    if (Array.isArray(data.candidates)) {
      saveData(CANDIDATES_KEY, data.candidates);
    }
    if (Array.isArray(data.promotions) && data.promotions.length > 0) {
      saveData(PROMOTIONS_KEY, data.promotions);
    }
    if (data.candidate) {
      const current = getCurrentUser();
      if (current && current.email?.toLowerCase() === data.candidate.email?.toLowerCase()) {
        setCurrentUser({ ...current, ...data.candidate });
      }
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Primenjuje reaktivna pravila prelaska između koraka na osnovu ispunjenih uslova (poslovna pravila).
 */
function applyReactiveWorkflowTransitions(cand, explicitStatusProvided = false) {
  const c = { ...cand };
  if (!c.isRegistered || c.status === "applying" || c.status === "rejected") {
    return c;
  }

  const isContractRejected = Boolean(
    c.contractVerificationStatus === "rejected" || (!c.contractApproved && c.contractRejectionReason)
  );
  const contractApproved = Boolean(
    !isContractRejected && (c.contractApproved || c.contractVerificationStatus === "approved")
  );
  const isFullPaid = Boolean(
    c.isFullPaymentPaid ||
      (c.paymentMethod === "now" &&
        (c.firstInstallmentApproved ||
          c.firstInstallmentStatus === "paid" ||
          c.firstPaymentStatus === "paid"))
  );
  const r1Paid = Boolean(
    c.firstInstallmentApproved ||
      c.firstInstallmentStatus === "paid" ||
      c.firstPaymentStatus === "paid" ||
      isFullPaid
  );
  const isDocsRejected = Boolean(
    c.documentsVerificationStatus === "rejected" || (!c.documentsApproved && c.documentsRejectionReason)
  );
  const docsApproved = Boolean(
    !isDocsRejected && (c.documentsApproved || c.documentsVerificationStatus === "approved")
  );
  const r2Paid = Boolean(
    c.secondInstallmentPaid || c.secondInstallmentStatus === "paid" || isFullPaid
  );
  const isJobConfirmed = Boolean(
    (c.jobApplicationStatus === "ACCEPTED" || c.jobOfferSignedAt || c.hasJob) &&
    c.jobApplicationStatus !== "SCHEDULED" &&
    c.jobApplicationStatus !== "APPLIED" &&
    c.jobApplicationStatus !== "NO_SLOTS" &&
    c.jobApplicationStatus !== "REJECTED"
  );
  const hasJob = isJobConfirmed;
  const hasVisa = Boolean(c.hasVisa);

  c.hasJob = hasJob;
  c.hasVisa = hasVisa;

  if (!explicitStatusProvided) {
    let cur = c.status === "in_review" ? "review" : (c.status || "review");

    // 1. Registracija -> Korak 1 (Dokumenta) čim su i ugovor i I rata potvrđeni
    if (cur === "review" && contractApproved && r1Paid) {
      cur = "docs";
    }
    // 2. Korak 1 -> Korak 2 (Posao) čim je dosije odobren
    if ((cur === "review" || cur === "docs") && contractApproved && r1Paid && docsApproved) {
      cur = "job";
    }
    // 3. Korak 2 -> Korak 3 (Čekanje na vizu) čim ima posao (Job Offer) i potvrđenu II ratu
    if ((cur === "review" || cur === "docs" || cur === "job") && docsApproved && hasJob && r2Paid) {
      cur = "departure";
    }
    // 4. Korak 3 -> Viza odobrena / Spreman za polazak čim je viza odobrena
    if (hasVisa) {
      cur = "ready";
    }

    c.status = cur;
  } else {
    // Ako je admin ručno prebacio status na "ready", označi da ima vizu
    if (c.status === "ready") {
      c.hasVisa = true;
    }
  }

  return c;
}

export function saveCandidate(candidate, options = {}) {
  const list = getCandidates();
  const candidateEmail = candidate.email ? candidate.email.toLowerCase().trim() : "";
  const existingIdx = list.findIndex(
    (c) =>
      (candidate.id && c.id === candidate.id) ||
      (candidateEmail && c.email && c.email.toLowerCase() === candidateEmail)
  );
  let baseCandidate = existingIdx >= 0 ? list[existingIdx] : null;

  // Utvrdi da li je kandidat aktiviran / registrovan
  const isNowRegistered = Boolean(
    candidate.isRegistered ||
    candidate.registeredAt ||
    baseCandidate?.isRegistered ||
    baseCandidate?.registeredAt ||
    (candidate.status && ["review", "in_review", "docs", "job", "departure", "ready"].includes(candidate.status))
  );

  // Ako je kandidat registrovan/aktiviran, ID ne sme počinjati sa "preapp-"
  let targetId = candidate.id || baseCandidate?.id;
  if (!targetId || (isNowRegistered && String(targetId).startsWith("preapp-"))) {
    targetId = candidate.id && !String(candidate.id).startsWith("preapp-")
      ? candidate.id
      : `cand-${Date.now()}`;
  }

  // Automatski dodeli referral kod ako ga kandidat još nema
  const referralCode =
    candidate.referralCode ||
    baseCandidate?.referralCode ||
    `AA-${(candidate.firstName || baseCandidate?.firstName || "REF").slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let referredBy = candidate.referredBy !== undefined ? candidate.referredBy : (baseCandidate?.referredBy || "");
  let referredByEmail = candidate.referredByEmail !== undefined ? candidate.referredByEmail : (baseCandidate?.referredByEmail || "");
  if (referredBy && referredBy.includes("@")) {
    referredByEmail = referredBy.toLowerCase().trim();
    const referrerCand = list.find((c) => c.email?.toLowerCase() === referredByEmail);
    if (referrerCand?.referralCode) {
      referredBy = referrerCand.referralCode;
    }
  }

  const registeredAt =
    candidate.registeredAt ||
    baseCandidate?.registeredAt ||
    (isNowRegistered ? new Date().toISOString() : undefined);

  const candFirst = candidate.firstName || (candidate.name ? candidate.name.split(" ")[0] : "") || candidate.ds160?.firstName || baseCandidate?.firstName || "";
  const candLast = candidate.lastName || (candidate.name ? candidate.name.split(" ").slice(1).join(" ") : "") || candidate.ds160?.lastNameAndMaiden || baseCandidate?.lastName || "";
  const candName = `${candFirst} ${candLast}`.trim() || candidate.name || baseCandidate?.name || "";
  const candPhone = (candidate.phone && String(candidate.phone).trim()) || candidate.ds160?.mobilePhone || baseCandidate?.phone || "";
  const candJmbg = candidate.jmbg || candidate.ds160?.jmbg || baseCandidate?.jmbg || "";
  const candPassNum = candidate.passportNumber || candidate.idCardNumber || candidate.ds160?.passportNumber || baseCandidate?.passportNumber || baseCandidate?.idCardNumber || "";
  const candBirthDate = candidate.birthDate || candidate.dateOfBirth || candidate.ds160?.dateOfBirth || baseCandidate?.birthDate || baseCandidate?.dateOfBirth || "";
  const candExpiryDate = candidate.passportExpiryDate || candidate.passportExpiry || candidate.ds160?.passportExpiryDate || baseCandidate?.passportExpiryDate || baseCandidate?.passportExpiry || "";
  const candGender = candidate.gender || candidate.ds160?.gender || baseCandidate?.gender || "";
  const candAddress = candidate.address || candidate.ds160?.homeAddress || baseCandidate?.address || "";
  const candBirthPlace = candidate.birthPlace || candidate.city || candidate.studyCity || candidate.ds160?.birthPlace || baseCandidate?.birthPlace || baseCandidate?.city || "";
  const candCitizenship = candidate.citizenship || candidate.ds160?.citizenship || baseCandidate?.citizenship || "Republika Srbija";
  const candMarital = candidate.maritalStatus || candidate.ds160?.maritalStatus || baseCandidate?.maritalStatus || "";

  const jobEmp = candidate.selectedJobEmployer || candidate.jobEmployer || baseCandidate?.selectedJobEmployer || baseCandidate?.jobEmployer || "";
  const jobTitle = candidate.selectedJobTitle || candidate.jobTitle || candidate.jobPosition || baseCandidate?.selectedJobTitle || baseCandidate?.jobTitle || baseCandidate?.jobPosition || "";
  const jobCity = candidate.selectedJobCity || candidate.jobLocation || candidate.jobCity || baseCandidate?.selectedJobCity || baseCandidate?.jobLocation || baseCandidate?.jobCity || "";
  const jobHousing = candidate.selectedJobHousing || candidate.jobHousing || baseCandidate?.selectedJobHousing || baseCandidate?.jobHousing || "";

  const existingDs160 = candidate.ds160 || baseCandidate?.ds160;
  const mergedDs160 = existingDs160 ? {
    ...existingDs160,
    firstName: candFirst || existingDs160.firstName || "",
    lastNameAndMaiden: candLast || existingDs160.lastNameAndMaiden || "",
    mobilePhone: candPhone || existingDs160.mobilePhone || "",
    jmbg: candJmbg || existingDs160.jmbg || "",
    passportNumber: candPassNum || existingDs160.passportNumber || "",
    dateOfBirth: candBirthDate || existingDs160.dateOfBirth || "",
    passportExpiryDate: candExpiryDate || existingDs160.passportExpiryDate || "",
    gender: candGender || existingDs160.gender || "",
    homeAddress: candAddress || existingDs160.homeAddress || "",
    birthPlace: candBirthPlace || existingDs160.birthPlace || "",
    citizenship: candCitizenship || existingDs160.citizenship || "Republika Srbija",
    maritalStatus: candMarital || existingDs160.maritalStatus || "",
    employerInfo: existingDs160.employerInfo || (jobEmp ? `${jobEmp} (${jobTitle || "Radna pozicija"})` : ""),
    stayAddress: existingDs160.stayAddress || (jobCity ? `${jobHousing ? `${jobHousing}, ` : ""}${jobCity}, SAD` : ""),
    supervisorName: existingDs160.supervisorName || (jobEmp ? "HR Department / Supervisor" : ""),
    employerPhone: existingDs160.employerPhone || (jobEmp ? "+1 (555) 234-5678" : ""),
  } : (jobEmp ? {
    employerInfo: `${jobEmp} (${jobTitle || "Radna pozicija"})`,
    stayAddress: `${jobHousing ? `${jobHousing}, ` : ""}${jobCity || "SAD"}`,
    supervisorName: "HR Department / Supervisor",
    employerPhone: "+1 (555) 234-5678",
    tripFunder: "Lična sredstva / Work & Travel",
    previousUsTravel: "Ne",
    visaRefusal: "Ne",
    firstName: candFirst,
    lastNameAndMaiden: candLast,
    mobilePhone: candPhone,
    jmbg: candJmbg,
    passportNumber: candPassNum,
    dateOfBirth: candBirthDate,
    passportExpiryDate: candExpiryDate,
    gender: candGender,
    homeAddress: candAddress,
    birthPlace: candBirthPlace,
    citizenship: candCitizenship,
  } : undefined);

  const rawMerged = {
    ...baseCandidate,
    ...candidate,
    id: targetId,
    name: candName,
    firstName: candFirst,
    lastName: candLast,
    phone: candPhone,
    jmbg: candJmbg,
    passportNumber: candPassNum,
    idCardNumber: candPassNum,
    birthDate: candBirthDate,
    dateOfBirth: candBirthDate,
    passportExpiryDate: candExpiryDate,
    passportExpiry: candExpiryDate,
    gender: candGender,
    address: candAddress,
    birthPlace: candBirthPlace,
    citizenship: candCitizenship,
    maritalStatus: candMarital,
    ds160: mergedDs160,
    faculty: (candidate.faculty && String(candidate.faculty).trim()) || baseCandidate?.faculty || "",
    studyCity: (candidate.studyCity && String(candidate.studyCity).trim()) || baseCandidate?.studyCity || "",
    studyYear: candidate.studyYear || baseCandidate?.studyYear || "",
    ectsPoints: candidate.ectsPoints !== undefined ? candidate.ectsPoints : baseCandidate?.ectsPoints,
    passportScanFileName:
      candidate.passportScanFileName ||
      baseCandidate?.passportScanFileName ||
      (candidate.passportScanDataUrl || candidate.passportImage || baseCandidate?.passportScanDataUrl || baseCandidate?.passportImage
        ? "Sken_Pasosa_OCR.png"
        : ""),
    passportScanDataUrl:
      candidate.passportScanDataUrl ||
      candidate.passportImage ||
      baseCandidate?.passportScanDataUrl ||
      baseCandidate?.passportImage ||
      "",
    passportScanUrl: candidate.passportScanUrl || baseCandidate?.passportScanUrl || "",
    passportImage:
      candidate.passportImage ||
      candidate.passportScanDataUrl ||
      baseCandidate?.passportImage ||
      baseCandidate?.passportScanDataUrl ||
      "",
    isRegistered: isNowRegistered,
    registeredAt,
    referralCode,
    referredBy,
    referredByEmail,
  };

  const explicitStatusProvided = Boolean(
    options.explicitStatus ||
    (candidate.status && baseCandidate?.status && candidate.status !== baseCandidate.status)
  );
  const merged = applyReactiveWorkflowTransitions(rawMerged, explicitStatusProvided);

  // Ukloni stari preapp ID ili duplikate sa istim ID-jem ili istim emailom
  const remaining = list.filter((c) => {
    if (c.id === targetId) return false;
    if (baseCandidate && c.id === baseCandidate.id) return false;
    if (candidateEmail && c.email && c.email.toLowerCase() === candidateEmail) return false;
    return true;
  });

  const updated = [merged, ...remaining];
  saveData(CANDIDATES_KEY, updated);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("aa_candidate_updated", { detail: merged }));
    } catch {}
  }

  // Ako je registrovan, označi pozivnicu kao "registered"
  if (isNowRegistered) {
    const invList = loadData(INVITATIONS_KEY, INITIAL_INVITATIONS);
    const codeToMatch = (merged.code || merged.activationCode || "").toUpperCase();
    const invIdx = invList.findIndex(
      (i) =>
        (codeToMatch && (i.code || "").toUpperCase() === codeToMatch) ||
        (candidateEmail && (i.email || "").toLowerCase() === candidateEmail)
    );
    if (invIdx >= 0 && invList[invIdx].status !== "registered") {
      invList[invIdx] = {
        ...invList[invIdx],
        status: "registered",
        registeredAt: invList[invIdx].registeredAt || registeredAt || new Date().toISOString(),
      };
      saveData(INVITATIONS_KEY, invList);
    }
  }

  const currentUser = getCurrentUser();
  if (
    currentUser &&
    (currentUser.id === candidate.id ||
      currentUser.id === targetId ||
      (candidateEmail && currentUser.email?.toLowerCase() === candidateEmail))
  ) {
    setCurrentUser({ ...currentUser, ...merged });
  }

  if (!options.skipRemoteSync) {
    fetch("/api/public/portal-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "saveCandidate",
        payload: merged,
      }),
    }).catch(() => {});

    // Ako je stari ID bio preapp- i promenio se, očisti stari ID na backendu
    if (baseCandidate && baseCandidate.id !== targetId && String(baseCandidate.id).startsWith("preapp-")) {
      fetch("/api/public/portal-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "deleteCandidate",
          payload: { id: baseCandidate.id },
        }),
      }).catch(() => {});
    }
  }

  return merged;
}

/**
 * Aktivira kandidata iz Faze 0 (Prijava & Selekcija) i prebacuje ga u Registraciju (Aktivni kandidati).
 */
export function activateCandidateAccount(candidateIdOrEmail, options = {}) {
  const list = getCandidates();
  const searchKey = String(candidateIdOrEmail || "").trim().toLowerCase();
  const cand = list.find(
    (c) =>
      String(c.id).toLowerCase() === searchKey ||
      (c.email && c.email.toLowerCase() === searchKey)
  );
  if (!cand) return null;

  const nowIso = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("sr-RS");
  const code = cand.activationCode || cand.code || `WT-${Math.floor(1000 + Math.random() * 9000)}`;

  const newId = String(cand.id).startsWith("preapp-")
    ? `cand-${Date.now()}`
    : cand.id;

  const noteEntry = `[${dateStr}]: Nalog kandidata uspešno AKTIVIRAN. Prebačen u korak: Registracija.`;

  const updatedCandidate = {
    ...cand,
    id: newId,
    code,
    activationCode: code,
    status: "review",
    isRegistered: true,
    registeredAt: cand.registeredAt || nowIso,
    selectionDecision: "QUALIFIED",
    decidedAt: cand.decidedAt || nowIso,
    notes: cand.notes ? `${cand.notes}\n${noteEntry}` : noteEntry,
    ...(options.overrides || {}),
  };

  return saveCandidate(updatedCandidate);
}

export function deleteCandidate(id) {
  const list = getCandidates();
  const updated = list.filter((c) => c.id !== id);
  saveData(CANDIDATES_KEY, updated);

  fetch("/api/public/portal-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      action: "deleteCandidate",
      payload: { id },
    }),
  }).catch(() => {});

  return updated;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === "undefined") {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export async function updateLocalCandidateDocument(file, type, email, candidateId, extraData = {}) {
  if (!file) return;
  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) =>
      (candidateId && String(c.id) === String(candidateId)) ||
      (email && c.email?.toLowerCase() === email.toLowerCase())
  );
  if (idx < 0) return;

  const dataUrl = extraData.dataUrl || extraData.previewDataUrl || (await readFileAsDataUrl(file));
  const fileUrl = extraData.fileUrl || "";
  const nowIso = new Date().toISOString();
  const c = { ...candidates[idx] };

  if (type === "facultyCert") {
    c.facultyCertFileName = file.name;
    c.facultyCertAiTranslation = true;
    c.facultyCertUploadedAt = nowIso;
    if (dataUrl) c.facultyCertDataUrl = dataUrl;
    if (fileUrl) c.facultyCertUrl = fileUrl;
  } else if (type === "policeCert") {
    c.policeCertificateFileName = file.name;
    c.policeCertificateUploaded = true;
    c.policeCertificateTranslated = true;
    c.policeCertificateUploadedAt = nowIso;
    if (dataUrl) c.policeCertificateDataUrl = dataUrl;
    if (fileUrl) c.policeCertificateUrl = fileUrl;
  } else if (type === "cv") {
    c.cvFileName = file.name;
    c.cvUploadedAt = nowIso;
    if (dataUrl) c.cvDataUrl = dataUrl;
    if (fileUrl) c.cvUrl = fileUrl;
  } else if (type === "signedContract" || type === "contract") {
    c.contractSigned = true;
    c.contractDownloaded = true;
    c.signedContractFileName = file.name;
    c.signedContractUploadedAt = nowIso;
    c.contractSignedAt = nowIso;
    if (dataUrl) c.signedContractDataUrl = dataUrl;
    if (fileUrl) c.signedContractUrl = fileUrl;
  } else if (type === "passport") {
    c.passportScanFileName = file.name;
    if (dataUrl) {
      c.passportImage = dataUrl;
      c.passportScanDataUrl = dataUrl;
    }
    if (fileUrl) c.passportScanUrl = fileUrl;
  }

  saveCandidate(c);
}

export async function uploadDocumentWithBackend(file, type, email, candidateId) {
  let backendData = null;
  const localDataUrl = await readFileAsDataUrl(file);

  try {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    if (email) form.append("email", email);
    const res = await fetch("/api/public/documents/upload", {
      method: "POST",
      body: form,
    });
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = await res.json();
      if (data && data.success !== false) {
        backendData = data;
      }
    }
  } catch (err) {
    console.warn("Backend document upload offline or failed, using local persistence:", err);
  }

  await updateLocalCandidateDocument(file, type, email, candidateId, {
    fileUrl: backendData?.fileUrl,
    dataUrl: localDataUrl || backendData?.previewDataUrl,
  });

  const typeMessages = {
    signedContract: "Potpisani ugovor i Izjava o odgovornosti su uspešno evidentirani!",
    contract: "Potpisani ugovor i Izjava o odgovornosti su uspešno evidentirani!",
    cv: "CV biografija je uspešno sačuvana.",
    facultyCert: "Uverenje sa fakulteta o redovnom studiranju je uspešno otpremljeno.",
    policeCert: "Uverenje o nekažnjavanju iz MUP-a je uspešno otpremljeno.",
    passport: "Sken biometrijskog pasoša je uspešno sačuvan.",
  };

  return {
    success: true,
    fileName: file?.name || "dokument.pdf",
    fileUrl: backendData?.fileUrl,
    dataUrl: localDataUrl || backendData?.previewDataUrl,
    message: typeMessages[type] || "Dokument je uspešno sačuvan.",
  };
}

export async function uploadSignedContractWithBackend(file, email, candidateId) {
  let res = null;
  try {
    res = await uploadDocumentWithBackend(file, "signedContract", email, candidateId);
  } catch (err) {
    console.warn("Upload signed contract error:", err);
  }

  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) =>
      (candidateId && String(c.id) === String(candidateId)) ||
      (email && c.email?.toLowerCase() === email?.toLowerCase())
  );
  const nowIso = new Date().toISOString();
  const ref = `AA-POTPIS-2026-${String(candidateId || "1042").replace(/[^0-9]/g, "").slice(-4) || "1042"}-${Date.now().toString(36).toUpperCase()}`;

  if (idx >= 0) {
    const c = { ...candidates[idx] };
    c.contractSigned = true;
    c.contractDownloaded = true;
    c.signedContractFileName = file?.name || "Potpisani_Ugovor.pdf";
    c.signedContractUploadedAt = nowIso;
    c.contractSignedAt = nowIso;
    c.contractSignedReference = c.contractSignedReference || ref;
    c.contractVerificationStatus = c.contractVerificationStatus === "approved" ? "approved" : "pending";
    c.contractApproved = c.contractVerificationStatus === "approved";
    c.contractRejectionReason = "";
    saveCandidate(c);
  }

  return {
    success: true,
    fileName: file?.name || "Potpisani_Ugovor.pdf",
    message:
      res?.message ||
      "Potpisani ugovor i Izjava o odgovornosti su uspešno okačeni! Uplatnica je sada otključana za plaćanje.",
  };
}

export async function saveCandidateDs160WithBackend(candidateId, email, ds160) {
  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) =>
      (candidateId && String(c.id) === String(candidateId)) ||
      (email && c.email?.toLowerCase() === email?.toLowerCase())
  );
  if (idx >= 0) {
    saveCandidate({ ...candidates[idx], ds160 });
  }
  try {
    const res = await fetch("/api/public/portal-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveDs160",
        payload: { candidateId, email, ds160 },
      }),
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function signCandidateContract(candidateIdOrEmail, reference) {
  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) => String(c.id) === String(candidateIdOrEmail) || c.email === candidateIdOrEmail
  );
  if (idx >= 0) {
    const c = {
      ...candidates[idx],
      contractSigned: true,
      contractSignedAt: new Date().toISOString(),
      contractSignedReference: reference || `AA-POTPIS-${Date.now().toString(36).toUpperCase()}`,
      contractDownloaded: true,
    };
    return saveCandidate(c);
  }
  return null;
}

/**
 * Brza promena statusa posla i vize (npr. direktno iz tabele afilijata ili admin panela).
 */
export function updateCandidateStatusFlags(candidateIdOrEmail, flags = {}) {
  const list = getCandidates();
  const cand = list.find(
    (c) =>
      c.id === candidateIdOrEmail ||
      c.email?.toLowerCase() === String(candidateIdOrEmail).toLowerCase()
  );
  if (!cand) return null;

  const updated = {
    ...cand,
    ...(flags.hasJob !== undefined ? { hasJob: Boolean(flags.hasJob) } : {}),
    ...(flags.hasVisa !== undefined ? { hasVisa: Boolean(flags.hasVisa) } : {}),
  };

  const saved = saveCandidate(updated);

  // Ako ovaj kandidat ima preporučioca, automatski preračunaj popust preporučiocu
  const refCodeOrEmail = saved.referredByEmail || saved.referredBy;
  if (refCodeOrEmail) {
    const referrer = list.find(
      (c) =>
        (c.referralCode && c.referralCode.toUpperCase() === String(refCodeOrEmail).toUpperCase()) ||
        (c.email && c.email.toLowerCase() === String(refCodeOrEmail).toLowerCase())
    );
    if (referrer && (referrer.discountId === "promo-affiliate" || referrer.discountDetails?.conditionType === "affiliate")) {
      const allCands = getCandidates();
      const normEmail = referrer.email?.toLowerCase();
      const refCode = referrer.referralCode?.toUpperCase();
      const refs = allCands.filter((c) => {
        if (c.id === referrer.id || c.email?.toLowerCase() === normEmail) return false;
        return (c.referredBy && refCode && c.referredBy.toUpperCase() === refCode) ||
               (c.referredByEmail && normEmail && c.referredByEmail.toLowerCase() === normEmail);
      });
      const qualCount = refs.filter((r) => r.hasJob && r.hasVisa).length;
      saveCandidate({
        ...referrer,
        discount: Math.max(100, qualCount * 100 || 100),
        discountNote: `Dovedi prijatelja — Afilijate (${qualCount} kvalifikovanih)`,
      });
    }
  }

  return saved;
}

/**
 * Prijavljuje uplatu određene rate ili uplate u celosti od strane studenta.
 * @param {string} candidateIdOrEmail
 * @param {1 | 2 | 3 | "FULL"} installmentNumber
 */
export function reportInstallmentPayment(candidateIdOrEmail, installmentNumber) {
  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) =>
      (candidateIdOrEmail && String(c.id) === String(candidateIdOrEmail)) ||
      (c.email && c.email.toLowerCase() === String(candidateIdOrEmail).toLowerCase())
  );
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();
  const c = { ...candidates[idx] };
  const isFull =
    installmentNumber === "FULL" ||
    installmentNumber === "full" ||
    installmentNumber === 0 ||
    (c.paymentMethod === "now" && (installmentNumber === 1 || installmentNumber === "1"));

  if (isFull) {
    c.fullPaymentReportedAt = nowIso;
    c.fullPaymentStatus = "pending";
    c.firstInstallmentStatus = "pending";
    c.firstPaymentStatus = "pending";
    c.firstInstallmentReportedAt = nowIso;
  } else if (installmentNumber === 1 || installmentNumber === "1") {
    c.firstInstallmentStatus = "pending";
    c.firstPaymentStatus = "pending";
    c.firstInstallmentReportedAt = nowIso;
  } else if (installmentNumber === 2 || installmentNumber === "2") {
    c.secondInstallmentStatus = "pending";
    c.secondInstallmentReportedAt = nowIso;
  } else if (installmentNumber === 3 || installmentNumber === "3") {
    c.thirdInstallmentStatus = "pending";
    c.thirdInstallmentReportedAt = nowIso;
  }

  const saved = saveCandidate(c);
  try {
    ensureCandidateInstallmentInvoice(saved, isFull ? "FULL" : installmentNumber, "PENDING");
  } catch {}
  return saved;
}

/**
 * Potvrđuje uplatu rate ili uplate u celosti od strane administratora uz trajno zaključavanje NBS kursa i dinarskog iznosa.
 * @param {string} candidateIdOrEmail
 * @param {1 | 2 | 3 | "FULL"} installmentNumber
 * @param {object} options
 */
export function confirmInstallmentPayment(candidateIdOrEmail, installmentNumber, options = {}) {
  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) =>
      (candidateIdOrEmail && String(c.id) === String(candidateIdOrEmail)) ||
      (c.email && c.email.toLowerCase() === String(candidateIdOrEmail).toLowerCase())
  );
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("sr-RS");
  const todayDate = options.paidDate || nowIso.slice(0, 10);
  const rate = Number(options.exchangeRate) || getCurrentNbsRate("EUR");
  const c = { ...candidates[idx] };

  const isFull =
    installmentNumber === "FULL" ||
    installmentNumber === "full" ||
    installmentNumber === 0 ||
    (c.paymentMethod === "now" && (installmentNumber === 1 || installmentNumber === "1"));

  const finalPrice = Number(c.finalPrice) || Number(c.basePrice) || 1750;
  const r1Amt = Number(c.firstInstallmentAmount) || 250;
  const r2Amt = Number(c.secondInstallmentAmount) || 400;
  const r3Amt = Number(c.thirdInstallmentAmount) || Math.max(0, finalPrice - r1Amt - r2Amt);

  if (isFull) {
    const rsdAmount = Math.round(finalPrice * rate * 100) / 100;
    c.isFullPaymentPaid = true;
    c.fullPaymentPaidAt = nowIso;
    c.fullPaymentPaidDate = todayDate;
    c.fullPaymentExchangeRate = rate;
    c.fullPaymentPaidRsd = rsdAmount;

    c.firstInstallmentStatus = "paid";
    c.firstPaymentStatus = "paid";
    c.firstInstallmentApproved = true;
    c.firstInstallmentPaidAt = nowIso;
    c.firstInstallmentPaidDate = todayDate;
    c.firstInstallmentExchangeRate = rate;
    c.firstInstallmentPaidRsd = Math.round(r1Amt * rate * 100) / 100;

    c.secondInstallmentStatus = "paid";
    c.secondInstallmentPaid = true;
    c.secondInstallmentApproved = true;
    c.secondInstallmentPaidAt = nowIso;
    c.secondInstallmentPaidDate = todayDate;
    c.secondInstallmentExchangeRate = rate;
    c.secondInstallmentPaidRsd = Math.round(r2Amt * rate * 100) / 100;

    c.thirdInstallmentStatus = "paid";
    c.thirdInstallmentPaid = true;
    c.thirdInstallmentApproved = true;
    c.thirdInstallmentPaidAt = nowIso;
    c.thirdInstallmentPaidDate = todayDate;
    c.thirdInstallmentExchangeRate = rate;
    c.thirdInstallmentPaidRsd = Math.max(0, rsdAmount - c.firstInstallmentPaidRsd - c.secondInstallmentPaidRsd);

    const note = `[${dateStr}]: Potvrđena uplata programa u celosti (${finalPrice} € po kursu ${rate.toFixed(4)} = ${rsdAmount.toLocaleString("sr-RS")} RSD).`;
    c.notes = c.notes ? `${c.notes}\n${note}` : note;
  } else if (installmentNumber === 1 || installmentNumber === "1") {
    const r1Rsd = Math.round(r1Amt * rate * 100) / 100;
    c.firstInstallmentStatus = "paid";
    c.firstPaymentStatus = "paid";
    c.firstInstallmentApproved = true;
    c.firstInstallmentPaidAt = nowIso;
    c.firstInstallmentPaidDate = todayDate;
    c.firstInstallmentExchangeRate = rate;
    c.firstInstallmentPaidRsd = r1Rsd;
    const note = `[${dateStr}]: Potvrđena uplata I rate (${r1Amt} € po kursu ${rate.toFixed(4)} = ${r1Rsd.toLocaleString("sr-RS")} RSD).`;
    c.notes = c.notes ? `${c.notes}\n${note}` : note;
  } else if (installmentNumber === 2 || installmentNumber === "2") {
    const r2Rsd = Math.round(r2Amt * rate * 100) / 100;
    c.secondInstallmentStatus = "paid";
    c.secondInstallmentPaid = true;
    c.secondInstallmentApproved = true;
    c.secondInstallmentPaidAt = nowIso;
    c.secondInstallmentPaidDate = todayDate;
    c.secondInstallmentExchangeRate = rate;
    c.secondInstallmentPaidRsd = r2Rsd;
    const note = `[${dateStr}]: Potvrđena uplata II rate (${r2Amt} € po kursu ${rate.toFixed(4)} = ${r2Rsd.toLocaleString("sr-RS")} RSD).`;
    c.notes = c.notes ? `${c.notes}\n${note}` : note;
  } else if (installmentNumber === 3 || installmentNumber === "3") {
    const r3Rsd = Math.round(r3Amt * rate * 100) / 100;
    c.thirdInstallmentStatus = "paid";
    c.thirdInstallmentPaid = true;
    c.thirdInstallmentApproved = true;
    c.thirdInstallmentPaidAt = nowIso;
    c.thirdInstallmentPaidDate = todayDate;
    c.thirdInstallmentExchangeRate = rate;
    c.thirdInstallmentPaidRsd = r3Rsd;
    const note = `[${dateStr}]: Potvrđena uplata III (završne) rate programa (${r3Amt} € po kursu ${rate.toFixed(4)} = ${r3Rsd.toLocaleString("sr-RS")} RSD).`;
    c.notes = c.notes ? `${c.notes}\n${note}` : note;
  }

  if (c.firstInstallmentApproved && c.secondInstallmentPaid && c.thirdInstallmentPaid) {
    c.isFullPaymentPaid = true;
  }

  const saved = saveCandidate(c, options);
  try {
    ensureCandidateInstallmentInvoice(saved, isFull ? "FULL" : installmentNumber, "PAID", {
      exchangeRate: rate,
      paidDate: todayDate,
    });
  } catch {}
  return saved;
}

/**
 * Administrativna verifikacija ugovora o posredovanju.
 * Ako je i I rata već plaćena, kandidat automatski prelazi iz Registracije u Korak 1 (Dokumenta).
 * @param {string} candidateIdOrEmail
 * @param {boolean} approved
 * @param {string} note
 */
export function verifyCandidateContract(candidateIdOrEmail, approved = true, note = "") {
  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) =>
      (candidateIdOrEmail && String(c.id) === String(candidateIdOrEmail)) ||
      (c.email && c.email.toLowerCase() === String(candidateIdOrEmail).toLowerCase())
  );
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("sr-RS");
  const c = { ...candidates[idx] };
  c.contractVerificationStatus = approved ? "approved" : "rejected";
  c.contractApproved = Boolean(approved);
  c.contractVerifiedAt = nowIso;
  if (approved) {
    c.contractRejectionReason = "";
    c.contractRejectedAt = null;
    const log = `[${dateStr}]: Svojeručno potpisani ugovor i Izjava o odgovornosti ODOBRENI.`;
    c.notes = c.notes ? `${c.notes}\n${log}` : log;
  } else {
    c.contractRejectionReason = note || "Potpisani ugovor nije ispravan. Molimo otpremite ponovo.";
    c.contractRejectedAt = nowIso;
    if (c.status === "docs" || c.status === "in_review") {
      c.status = "review";
    }
    const log = `[${dateStr}]: Ugovor vraćen na ponovno slanje (${c.contractRejectionReason}).`;
    c.notes = c.notes ? `${c.notes}\n${log}` : log;
  }
  if (note) c.contractVerificationNote = note;

  return saveCandidate(c, { explicitStatus: !approved });
}

/**
 * Administrativna verifikacija kompletnog dosijea (CV, uverenja, prevodi).
 * Kada se odobri, kandidat automatski prelazi u Korak 2 (Posao i ponuda).
 * @param {string} candidateIdOrEmail
 * @param {boolean} approved
 * @param {string} note
 */
export function verifyCandidateDocuments(candidateIdOrEmail, approved = true, note = "") {
  const candidates = loadData(CANDIDATES_KEY, []);
  const idx = candidates.findIndex(
    (c) =>
      (candidateIdOrEmail && String(c.id) === String(candidateIdOrEmail)) ||
      (c.email && c.email.toLowerCase() === String(candidateIdOrEmail).toLowerCase())
  );
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("sr-RS");
  const c = { ...candidates[idx] };
  c.documentsVerificationStatus = approved ? "approved" : "rejected";
  c.documentsApproved = Boolean(approved);
  c.documentsVerifiedAt = nowIso;
  if (approved) {
    c.documentsRejectionReason = "";
    c.status = "job";
    const log = `[${dateStr}]: Dosije i dokumentacija (Korak 1) ODOBRENI. Kandidat prebačen na Korak 2: Posao i ponuda.`;
    c.notes = c.notes ? `${c.notes}\n${log}` : log;
  } else {
    c.documentsRejectionReason = note || "Dokumentacija nije kompletna ili čitljiva.";
    c.documentsRejectedAt = nowIso;
    const log = `[${dateStr}]: Dokumentacija vraćena na dopunu (${c.documentsRejectionReason}).`;
    c.notes = c.notes ? `${c.notes}\n${log}` : log;
  }
  if (note) c.documentsVerificationNote = note;

  return saveCandidate(c);
}
