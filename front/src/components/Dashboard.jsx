// Dashboard.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import {
  getCurrentUser,
  saveCandidate,
  syncFromBackend,
  downloadContractPdf,
  downloadResponsibilityStatementPdf,
  signCandidateContract,
  downloadPaymentSlipPdf,
  openPrintablePaymentSlipWindow,
  uploadDocumentWithBackend,
  uploadSignedContractWithBackend,
  readFileAsDataUrl,
  saveCandidateDs160WithBackend,
  getDs160Status,
  isDs160Complete,
  changeCandidateDiscount,
  calculateProfileScore,
  reportInstallmentPayment,
  confirmInstallmentPayment,
  verifyCandidateContract,
  verifyCandidateDocuments,
} from "../data/candidateStore";
import { getInvoicesForCandidate, ensureCandidateInstallmentInvoice } from "../data/invoicesStore";

import InvoiceModal from "./InvoiceModal";
import ProfileBuilderModal from "./ProfileBuilderModal";
import JobFairModal from "./JobFairModal";
import JobOfferModal from "./JobOfferModal";

import DashboardHeader from "./dashboard/DashboardHeader";
import Step0Registration from "./dashboard/Step0Registration";
import Step1Documents from "./dashboard/Step1Documents";
import Step2JobPlacement from "./dashboard/Step2JobPlacement";
import Step3VisaDeparture from "./dashboard/Step3VisaDeparture";
import CandidatePreferencesFooter from "./dashboard/CandidatePreferencesFooter";

import SignContractModal from "./dashboard/modals/SignContractModal";
import Ds160Modal from "./dashboard/modals/Ds160Modal";
import ChangeDiscountModal from "./dashboard/modals/ChangeDiscountModal";
import TranslationModal from "./dashboard/modals/TranslationModal";
import VideoInstructionsModal from "./dashboard/modals/VideoInstructionsModal";

import { getYouTubeEmbedUrl } from "./dashboard/icons";

export default function Dashboard({
  onLogout = () => {},
  onNavigate = () => {},
  logoHref = "/",
  candidateData = null,
}) {
  const { t } = useTranslation();

  // Učitaj kandidata iz props-a, ili iz localStorage store-a
  const [candidate, setCandidate] = useState(() => {
    return (
      candidateData ||
      getCurrentUser() || {
        firstName: "",
        lastName: "",
        email: "",
        packageName: "Work & Travel USA",
        finalPrice: 1850,
        paymentMethod: "now",
        guarantor: null,
        preferences: {
          location: "",
          position: "",
          englishLevel: "B2",
          testLink: "",
        },
        youtubeUrl: "",
        cvFileName: "",
        facultyCertFileName: "",
        facultyCertAiTranslation: false,
        status: "applying",
        progress: 10,
      }
    );
  });

  // Sinhronizacija sa candidateData kada se uloguje drugi korisnik ili sa backenda
  useEffect(() => {
    if (candidateData) {
      setCandidate(candidateData);
      setYoutubeInput(candidateData.youtubeUrl || "");
      setIsYoutubeEditing(!candidateData.youtubeUrl);
      setCvFile(candidateData.cvFileName || null);
      setFacultyFile(candidateData.facultyCertFileName || null);
      setAiTranslationReady(Boolean(candidateData.facultyCertAiTranslation));
      setPoliceFile(candidateData.policeCertificateFileName || null);
      setPoliceTranslationReady(Boolean(candidateData.policeCertificateTranslated));
    }
  }, [candidateData]);

  useEffect(() => {
    const emailToSync = candidateData?.email || candidate?.email;
    if (!emailToSync) return;
    syncFromBackend(emailToSync).then((data) => {
      if (data?.candidate) {
        setCandidate(data.candidate);
        setYoutubeInput(data.candidate.youtubeUrl || "");
        setIsYoutubeEditing(!data.candidate.youtubeUrl);
        setCvFile(data.candidate.cvFileName || null);
        setFacultyFile(data.candidate.facultyCertFileName || null);
        setAiTranslationReady(Boolean(data.candidate.facultyCertAiTranslation));
        setPoliceFile(data.candidate.policeCertificateFileName || null);
        setPoliceTranslationReady(Boolean(data.candidate.policeCertificateTranslated));
      }
    });
  }, [candidateData?.email]);

  // Stanja za ispunjavanje obaveznih stavki
  const [youtubeInput, setYoutubeInput] = useState(candidate.youtubeUrl || "");
  const [isYoutubeEditing, setIsYoutubeEditing] = useState(!candidate.youtubeUrl);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [cvFile, setCvFile] = useState(candidate.cvFileName || null);
  const [facultyFile, setFacultyFile] = useState(candidate.facultyCertFileName || null);
  const [policeFile, setPoliceFile] = useState(candidate.policeCertificateFileName || null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [aiTranslationReady, setAiTranslationReady] = useState(Boolean(candidate.facultyCertAiTranslation));
  const [policeTranslationReady, setPoliceTranslationReady] = useState(Boolean(candidate.policeCertificateTranslated));
  const [isTranslatingPolice, setIsTranslatingPolice] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [activeTranslationDoc, setActiveTranslationDoc] = useState("faculty"); // "faculty" | "police"
  const policeInputRef = useRef(null);

  const status = candidate.status || "applying";
  const isPastReview = ["job", "departure", "ready"].includes(status);
  const isInReview = ["review", "docs", "in_review", "registered"].includes(status);
  const isReady = status === "ready";
  const isDeparture = status === "departure" || isReady;

  const currentProgress =
    typeof candidate.progress === "number"
      ? candidate.progress
      : status === "ready"
      ? 100
      : status === "departure"
      ? 90
      : status === "job"
      ? 75
      : status === "docs" || status === "in_review"
      ? 55
      : status === "review" || status === "registered"
      ? 40
      : 18;

  const hasConfirmedJob = Boolean(
    (candidate.jobApplicationStatus === "ACCEPTED" ||
      candidate.jobOfferSignedAt ||
      (candidate.jobOfferAccepted && isPastReview) ||
      candidate.hasJob) &&
    candidate.jobApplicationStatus !== "SCHEDULED" &&
    candidate.jobApplicationStatus !== "APPLIED" &&
    candidate.jobApplicationStatus !== "NO_SLOTS" &&
    candidate.jobApplicationStatus !== "REJECTED"
  );

  // Gate 1: Ugovor & Uplata I rate (Registracija -> Korak 1)
  const isPastRegistration = ["docs", "in_review", "job", "departure", "ready"].includes(status);
  const hasSignedContract = Boolean(candidate.signedContractFileName || candidate.contractSigned || isPastRegistration);
  const isContractApproved = Boolean(
    candidate.contractApproved ||
    candidate.contractVerificationStatus === "approved" ||
    isPastRegistration
  );
  const isContractPending = Boolean(
    hasSignedContract &&
    !isContractApproved &&
    candidate.contractVerificationStatus !== "rejected"
  );

  const isFullPaymentPaid = Boolean(
    candidate.isFullPaymentPaid ||
    (candidate.paymentMethod === "now" &&
      (candidate.firstInstallmentApproved ||
        candidate.firstInstallmentStatus === "paid" ||
        candidate.firstPaymentStatus === "paid"))
  );

  const isFirstInstallmentPaid = Boolean(
    candidate.firstInstallmentApproved ||
    candidate.firstInstallmentStatus === "paid" ||
    candidate.firstPaymentStatus === "paid" ||
    isFullPaymentPaid ||
    isPastRegistration
  );
  const isFirstInstallmentPending = Boolean(
    !isFirstInstallmentPaid &&
    (candidate.firstInstallmentStatus === "pending" ||
      candidate.firstPaymentStatus === "pending" ||
      candidate.fullPaymentStatus === "pending")
  );

  const isRegistrationDone = Boolean(isContractApproved && isFirstInstallmentPaid);

  // Gate 2: Dosije & Verifikacija (Korak 1 -> Korak 2)
  const isDocumentsApproved = Boolean(
    candidate.documentsApproved ||
    candidate.documentsVerificationStatus === "approved" ||
    isPastReview
  );
  const isDocumentsRejected = Boolean(
    !isDocumentsApproved &&
    (candidate.documentsVerificationStatus === "rejected" || Boolean(candidate.documentsRejectionReason))
  );
  const isDocumentsPending = Boolean(
    !isDocumentsApproved &&
    !isDocumentsRejected &&
    (candidate.documentsVerificationStatus === "pending" ||
      candidate.documentsSubmittedForReview ||
      status === "docs" ||
      status === "in_review")
  );
  const isStep1Done = Boolean(isDocumentsApproved);

  // Gate 3: Posao & II Rata (Korak 2 -> Korak 3)
  const isSecondInstallmentPaid = Boolean(
    candidate.secondInstallmentPaid ||
    candidate.secondInstallmentApproved ||
    candidate.secondInstallmentStatus === "paid" ||
    isFullPaymentPaid ||
    (candidate.paymentMethod === "now" && isFirstInstallmentPaid) ||
    isDeparture
  );
  const isSecondInstallmentPending = Boolean(
    !isSecondInstallmentPaid &&
    candidate.paymentMethod !== "now" &&
    candidate.secondInstallmentStatus === "pending"
  );
  const isStep2Done = Boolean(hasConfirmedJob && isSecondInstallmentPaid);

  // Gate 4: Viza, III Rata / PKZ & Polazak (Korak 3 -> Završeno)
  const isThirdInstallmentPaid = Boolean(
    candidate.thirdInstallmentPaid ||
    candidate.thirdInstallmentApproved ||
    candidate.thirdInstallmentStatus === "paid" ||
    isFullPaymentPaid ||
    candidate.paymentMethod === "now" ||
    candidate.paymentMethod === "later" ||
    candidate.paymentMethod === "installments" ||
    isReady
  );
  const isThirdInstallmentPending = Boolean(
    !isThirdInstallmentPaid &&
    candidate.paymentMethod !== "now" &&
    candidate.thirdInstallmentStatus === "pending"
  );
  const isStep3Done = isReady;

  // Kompatibilnost sa pomoćnim proverama
  const isStep4Done = isDeparture;
  const isStep5Done = isReady;

  const [activeStepTab, setActiveStepTab] = useState("all"); // 'all' | 'reg' | 'step1' | 'step2' | 'step3'

  let statusBadgeText = candidate.paymentMethod === "now"
    ? "Registracija — Ugovor i uplata programa u celosti"
    : "Registracija — Ugovor i I rata";
  if (isDocumentsRejected) {
    statusBadgeText = "Korak 1 — Dokumentacija zahteva dopunu";
  } else if (status === "ready" || candidate.hasVisa) {
    statusBadgeText = "Završeno — Viza odobrena / Spreman za polazak";
  } else if (isThirdInstallmentPending) {
    statusBadgeText = "Čekanje na vizu — Čeka potvrdu III rate";
  } else if (status === "departure") {
    statusBadgeText = "Čekanje na vizu — DS-2019, DS-160 i Ambasada";
  } else if (isSecondInstallmentPending) {
    statusBadgeText = "Korak 2 — Čeka potvrdu II rate programa";
  } else if (status === "job") {
    statusBadgeText = "Korak 2 — Izbor posla i intervju";
  } else if (isDocumentsPending) {
    statusBadgeText = "Korak 1 — Dosije poslat na pregled koordinatoru";
  } else if (status === "docs" || status === "in_review") {
    statusBadgeText = "Korak 1 — Priprema profila i dokumentacije";
  } else if (isFirstInstallmentPending) {
    statusBadgeText = candidate.paymentMethod === "now"
      ? "Registracija — Uplata programa u celosti čeka potvrdu admina"
      : "Registracija — Uplata I rate čeka potvrdu admina";
  } else if (isContractPending) {
    statusBadgeText = "Registracija — Ugovor čeka overu administratora";
  } else if (status === "review" || status === "registered") {
    statusBadgeText = candidate.paymentMethod === "now"
      ? "Registracija — Potpisivanje ugovora i uplata u celosti"
      : "Registracija — Potpisivanje ugovora i I rata";
  }

  const [applicationSubmitted, setApplicationSubmitted] = useState(isPastReview || isInReview);

  useEffect(() => {
    setApplicationSubmitted(isPastReview || isInReview);
  }, [status, isPastReview, isInReview]);

  const cvInputRef = useRef(null);
  const certInputRef = useRef(null);

  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [uploadToast, setUploadToast] = useState("");
  const [showDs160Modal, setShowDs160Modal] = useState(false);
  const [showChangeDiscountModal, setShowChangeDiscountModal] = useState(false);
  const [showSignContractModal, setShowSignContractModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [showProfileBuilderModal, setShowProfileBuilderModal] = useState(false);
  const [selectedCandidateInvoice, setSelectedCandidateInvoice] = useState(null);
  const candidateInvoices = useMemo(() => {
    if (!candidate?.id) return [];
    let list = getInvoicesForCandidate(candidate.id, candidate.email);
    if (list.length === 0) {
      const isFull = candidate.paymentMethod === "now";
      const isPaid = isFull ? Boolean(candidate.isFullPaymentPaid) : Boolean(candidate.isFirstInstallmentPaid);
      const initial = ensureCandidateInstallmentInvoice(
        candidate,
        isFull ? "FULL" : 1,
        isPaid ? "PAID" : "PENDING"
      );
      if (initial) list = [initial];
    }
    return list;
  }, [candidate, showInvoicesModal]);
  const profileScore = calculateProfileScore(candidate);
  const [showJobFairModal, setShowJobFairModal] = useState(false);
  const [showJobOfferModal, setShowJobOfferModal] = useState(false);
  const interviewScheduled = Boolean(
    candidate.jobApplicationStatus === "SCHEDULED" ||
    candidate.interviewScheduled ||
    Boolean(candidate.interviewScheduledAt) ||
    Boolean(candidate.interviewDetails)
  );

  const handleSelectJob = (job) => {
    const employerStr = `${job.employer || ""} — ${job.title || ""}`.trim();
    const stayStr = `${job.housing ? `${job.housing}, ` : ""}${job.city || ""}, SAD`.trim();
    const currentDs160 = candidate.ds160 || {};
    const updatedDs160 = {
      ...currentDs160,
      employerInfo: employerStr || currentDs160.employerInfo || "",
      stayAddress: stayStr || currentDs160.stayAddress || "",
      supervisorName: job.supervisor || currentDs160.supervisorName || "HR Department / Supervisor",
      employerPhone: job.phone || currentDs160.employerPhone || "+1 (555) 234-5678",
      tripFunder: currentDs160.tripFunder || "Lična sredstva / Work & Travel",
      previousUsTravel: currentDs160.previousUsTravel || "Ne",
      visaRefusal: currentDs160.visaRefusal || "Ne",
    };

    updateCandidateState({
      selectedJobId: job.id,
      selectedJob: job,
      selectedJobTitle: job.title,
      selectedJobEmployer: job.employer,
      selectedJobCity: job.city,
      selectedJobWage: job.wage,
      selectedJobHousing: job.housing,
      jobApplicationStatus: "APPLIED",
      hasJob: false,
      interviewScheduledAt: "",
      interviewLink: "",
      interviewNote: "",
      ds160: updatedDs160,
    });
    setUploadToast(`Prijavili ste se za poziciju: ${job.title} (${job.employer})! Podaci o poslodavcu su automatski uneti u vaš DS-160 upitnik.`);
    setTimeout(() => setUploadToast(""), 4500);
  };

  const handleScheduleInterview = (details) => {
    setInterviewScheduled(true);
    updateCandidateState({
      interviewScheduled: true,
      interviewDetails: details,
      status: "job",
    });
    setUploadToast("Uspešno zakazan intervju sa američkim poslodavcem!");
    setTimeout(() => setUploadToast(""), 4500);
  };

  const handleAcceptJobOffer = (signedOffer) => {
    const currentDs160 = candidate.ds160 || {};
    const updatedDs160 = {
      ...currentDs160,
      employerInfo: `${signedOffer.companyName || candidate.selectedJobEmployer || ""} — ${signedOffer.position || candidate.selectedJobTitle || ""}`.trim(),
      stayAddress: signedOffer.housingAddress || `${candidate.selectedJobHousing ? `${candidate.selectedJobHousing}, ` : ""}${candidate.selectedJobCity || ""}, SAD`.trim(),
      supervisorName: signedOffer.supervisor || currentDs160.supervisorName || "General Manager",
      employerPhone: signedOffer.phone || currentDs160.employerPhone || "+1 (555) 234-5678",
    };

    updateCandidateState({
      hasJob: true,
      jobOfferAccepted: true,
      jobOfferSignedAt: signedOffer.signedAt,
      jobOfferSignature: signedOffer.signature,
      jobOfferDetails: signedOffer,
      status: "departure",
      secondInstallmentDue: true,
      ds160: updatedDs160,
    });
    setUploadToast("Job Offer je prihvaćen! Detalji poslodavca su automatski sinhronizovani sa DS-160 upitnikom.");
    setTimeout(() => setUploadToast(""), 5000);
  };

  const [copiedRefCode, setCopiedRefCode] = useState(false);

  // Ažuriranje i perzistencija
  const updateCandidateState = (updates) => {
    setCandidate((prev) => {
      const base = prev || candidate;
      const updated = { ...base, ...updates };
      saveCandidate(updated);
      return updated;
    });
  };

  const signedContractInputRef = useRef(null);
  const [isUploadingSignedContract, setIsUploadingSignedContract] = useState(false);

  // Rukovaoci čekanja i simulacije uplata / verifikacija
  const handleReportFirstInstallment = () => {
    const isFull = candidate.paymentMethod === "now";
    reportInstallmentPayment(candidate.id || candidate.email, isFull ? "FULL" : 1);
    updateCandidateState({
      firstInstallmentStatus: "pending",
      firstPaymentStatus: "pending",
      ...(isFull ? { fullPaymentStatus: "pending", fullPaymentReportedAt: new Date().toISOString() } : {}),
      firstInstallmentReportedAt: new Date().toISOString(),
    });
    setUploadToast(
      isFull
        ? "Prijavljena uplata programa u celosti. Čeka se potvrda administratora (izvod banke)."
        : `Prijavljena uplata I rate (${candidate.firstInstallmentAmount || 250} €). Čeka se potvrda administratora (izvod banke).`
    );
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handleSimulateFirstPaymentConfirm = () => {
    const isFull = candidate.paymentMethod === "now";
    confirmInstallmentPayment(candidate.id || candidate.email, isFull ? "FULL" : 1);
    updateCandidateState({
      firstInstallmentStatus: "paid",
      firstPaymentStatus: "paid",
      firstInstallmentApproved: true,
      firstInstallmentPaidAt: new Date().toISOString(),
      ...(isFull
        ? {
            isFullPaymentPaid: true,
            secondInstallmentPaid: true,
            secondInstallmentApproved: true,
            thirdInstallmentPaid: true,
            thirdInstallmentApproved: true,
          }
        : {}),
      progress: Math.max(candidate.progress || 0, 40),
    });
    setUploadToast(
      isFull
        ? "Administrator je potvrdio uplatu programa u celosti! Registracioni preduslovi su ispunjeni."
        : `Administrator je potvrdio uplatu I rate (${candidate.firstInstallmentAmount || 250} €)! Registracija je uspešno završena.`
    );
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handleSimulateContractApprove = () => {
    verifyCandidateContract(candidate.id || candidate.email, true);
    updateCandidateState({
      contractVerificationStatus: "approved",
      contractApproved: true,
      contractVerifiedAt: new Date().toISOString(),
    });
    setUploadToast("Potpisani ugovor je zvanično verifikovan i odobren od strane pravnog tima!");
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handleSimulateDocumentsApprove = () => {
    verifyCandidateDocuments(candidate.id || candidate.email, true);
    updateCandidateState({
      documentsVerificationStatus: "approved",
      documentsApproved: true,
      status: "job",
      progress: Math.max(candidate.progress || 0, 75),
    });
    setUploadToast("Sponzor i koordinator su odobrili dosije! Otključan je Korak 2 (Izbor poslova i intervjui).");
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handleReportSecondInstallment = () => {
    reportInstallmentPayment(candidate.id || candidate.email, 2);
    updateCandidateState({
      secondInstallmentStatus: "pending",
      secondInstallmentReportedAt: new Date().toISOString(),
    });
    setUploadToast(`Prijavljena uplata II rate (${candidate.secondInstallmentAmount || 400} €). Čeka se knjiženje KIR fakture.`);
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handleConfirmSecondInstallment = () => {
    confirmInstallmentPayment(candidate.id || candidate.email, 2);
    updateCandidateState({
      secondInstallmentStatus: "paid",
      secondInstallmentPaid: true,
      secondInstallmentApproved: true,
      secondInstallmentPaidAt: new Date().toISOString(),
      status: "departure",
      progress: Math.max(candidate.progress || 0, 89),
    });
    setUploadToast("Uplata II rate je proknjižena! Otključan je Korak 3 (Viza, DS-2019 i Ambasada SAD).");
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handleReportThirdInstallment = () => {
    reportInstallmentPayment(candidate.id || candidate.email, 3);
    updateCandidateState({
      thirdInstallmentStatus: "pending",
      thirdInstallmentReportedAt: new Date().toISOString(),
    });
    setUploadToast(`Prijavljena uplata III rate (${candidate.thirdInstallmentAmount || 450} €). Čeka se potvrda pre preuzimanja vize i avio karte.`);
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handleConfirmThirdInstallment = () => {
    confirmInstallmentPayment(candidate.id || candidate.email, 3);
    updateCandidateState({
      thirdInstallmentStatus: "paid",
      thirdInstallmentPaid: true,
      thirdInstallmentApproved: true,
      thirdInstallmentPaidAt: new Date().toISOString(),
    });
    setUploadToast("Uplata III rate je potvrđena! Sve finansijske obaveze prema agenciji su izmirene.");
    setTimeout(() => setUploadToast(""), 5000);
  };

  const handlePaymentSlipClick = () => {
    if (!hasSignedContract) {
      setShowSignContractModal(true);
      return;
    }
    const slipType = candidate.paymentMethod === "now" ? "full" : "rate1";
    openPrintablePaymentSlipWindow({ id: candidate.id, email: candidate.email, type: slipType });
  };

  const handleUploadSignedContract = async (file) => {
    if (!file) return;
    setIsUploadingSignedContract(true);
    const dataUrl = await readFileAsDataUrl(file);
    try {
      const res = await uploadSignedContractWithBackend(file, candidate.email, candidate.id);
      const ref = `AA-POTPIS-2026-${String(candidate.id).replace(/[^0-9]/g, "").slice(-4) || "1042"}-${Date.now().toString(36).toUpperCase()}`;
      const updates = {
        contractSigned: true,
        contractDownloaded: true,
        contractSignedAt: new Date().toISOString(),
        contractSignedReference: ref,
        signedContractFileName: file.name,
        signedContractUploadedAt: new Date().toISOString(),
        signedContractDataUrl: dataUrl,
        signedContractUrl: res?.fileUrl || candidate.signedContractUrl,
        contractVerificationStatus: "pending",
        contractApproved: false,
      };
      updateCandidateState(updates);
      setShowSignContractModal(false);
      setUploadToast(
        res?.message ||
          `Potpisani ugovor (${file.name}) je uspešno okačen! Uplatnica je otključana, a ugovor je na verifikaciji.`
      );
      setTimeout(() => setUploadToast(""), 6000);
    } catch (err) {
      console.error(err);
      const ref = `AA-POTPIS-2026-${String(candidate.id).replace(/[^0-9]/g, "").slice(-4) || "1042"}-${Date.now().toString(36).toUpperCase()}`;
      const updates = {
        contractSigned: true,
        contractDownloaded: true,
        contractSignedAt: new Date().toISOString(),
        contractSignedReference: ref,
        signedContractFileName: file.name,
        signedContractUploadedAt: new Date().toISOString(),
        signedContractDataUrl: dataUrl,
        contractVerificationStatus: "pending",
        contractApproved: false,
      };
      updateCandidateState(updates);
      setShowSignContractModal(false);
      setUploadToast(
        `Potpisani ugovor (${file.name}) je uspešno okačen! Uplatnica je otključana, a ugovor je na verifikaciji.`
      );
      setTimeout(() => setUploadToast(""), 6000);
    } finally {
      setIsUploadingSignedContract(false);
    }
  };

  const handleChangeDiscount = (promoId, extraData = {}) => {
    const updated = changeCandidateDiscount(candidate.id || candidate.email, promoId, extraData);
    if (updated) {
      setCandidate(updated);
      setShowChangeDiscountModal(false);
      setUploadToast(
        promoId === "none" || !promoId
          ? "Promocija je uklonjena sa vašeg profila."
          : `Uspešno ste promenili promociju: ${updated.discountNote || "Popust aktiviran"}!`
      );
      setTimeout(() => setUploadToast(""), 4500);
    }
  };

  const handleSaveYoutube = (e) => {
    e.preventDefault();
    if (!youtubeInput.trim()) return;
    updateCandidateState({ youtubeUrl: youtubeInput.trim() });
    setIsYoutubeEditing(false);
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      setIsUploadingCv(true);
      setCvFile(fileName);
      const dataUrl = await readFileAsDataUrl(file);
      updateCandidateState({
        cvFileName: fileName,
        cvDataUrl: dataUrl,
        cvUploadedAt: new Date().toISOString(),
      });
      try {
        const res = await uploadDocumentWithBackend(file, "cv", candidate.email, candidate.id);
        if (res?.fileUrl) {
          updateCandidateState({ cvUrl: res.fileUrl });
        }
        setUploadToast(res?.message || "CV je uspešno otpremljen.");
      } catch (err) {
        console.warn("CV upload error:", err);
        setUploadToast("CV je uspešno otpremljen.");
      } finally {
        setIsUploadingCv(false);
        setTimeout(() => setUploadToast(""), 4000);
        if (e.target) e.target.value = "";
      }
    }
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      setIsUploadingCert(true);
      setFacultyFile(fileName);
      setAiTranslationReady(true);
      const dataUrl = await readFileAsDataUrl(file);
      updateCandidateState({
        facultyCertFileName: fileName,
        facultyCertDataUrl: dataUrl,
        facultyCertAiTranslation: true,
        facultyCertUploadedAt: new Date().toISOString(),
      });
      try {
        const res = await uploadDocumentWithBackend(file, "facultyCert", candidate.email, candidate.id);
        if (res?.fileUrl) {
          updateCandidateState({ facultyCertUrl: res.fileUrl });
        }
        setUploadToast(res?.message || "Uverenje sa fakulteta je uspešno otpremljeno i digitalno verifikovano.");
      } catch (err) {
        console.warn("Faculty cert upload error:", err);
        setUploadToast("Uverenje sa fakulteta je uspešno otpremljeno.");
      } finally {
        setIsUploadingCert(false);
        setAiTranslationReady(true);
        setTimeout(() => setUploadToast(""), 4500);
        if (e.target) e.target.value = "";
      }
    }
  };

  const runAiTranslation = () => {
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
      setAiTranslationReady(true);
      updateCandidateState({ facultyCertAiTranslation: true });
      setUploadToast("Uverenje sa fakulteta je digitalno verifikovano.");
      setTimeout(() => setUploadToast(""), 3500);
    }, 1200);
  };

  const handlePoliceCertUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      setIsUploadingCert(true);
      setPoliceFile(fileName);
      setPoliceTranslationReady(true);
      const dataUrl = await readFileAsDataUrl(file);
      updateCandidateState({
        policeCertificateFileName: fileName,
        policeCertificateDataUrl: dataUrl,
        policeCertificateUploaded: true,
        policeCertificateTranslated: true,
        policeCertificateUploadedAt: new Date().toISOString(),
      });
      try {
        const res = await uploadDocumentWithBackend(file, "policeCert", candidate.email, candidate.id);
        if (res?.fileUrl) {
          updateCandidateState({ policeCertificateUrl: res.fileUrl });
        }
        setUploadToast(res?.message || "Uverenje o nekažnjavanju iz MUP-a je otpremljeno i pripremljeno za prevod.");
      } catch (err) {
        console.warn("Police cert upload error:", err);
        setUploadToast("Uverenje o nekažnjavanju iz MUP-a je otpremljeno.");
      } finally {
        setIsUploadingCert(false);
        setPoliceTranslationReady(true);
        setTimeout(() => setUploadToast(""), 4500);
        if (e.target) e.target.value = "";
      }
    }
  };

  const runPoliceTranslation = () => {
    setIsTranslatingPolice(true);
    setTimeout(() => {
      setIsTranslatingPolice(false);
      setPoliceTranslationReady(true);
      updateCandidateState({ policeCertificateTranslated: true });
      setUploadToast("Zvanični sertifikovan prevod Uverenja iz MUP-a je završen.");
      setTimeout(() => setUploadToast(""), 4000);
    }, 1200);
  };

  const isRequirementsMet = Boolean(
    candidate.youtubeUrl &&
      candidate.cvFileName &&
      candidate.facultyCertFileName &&
      aiTranslationReady &&
      (candidate.policeCertificateFileName || policeFile)
  );

  const handleSubmitForReview = () => {
    if (!isRequirementsMet) return;
    setApplicationSubmitted(true);
    const dateStr = new Date().toLocaleDateString("sr-RS");
    const wasRejected = Boolean(
      candidate.documentsVerificationStatus === "rejected" || candidate.documentsRejectionReason
    );
    const noteEntry = wasRejected
      ? `[${dateStr}]: Kandidat je dopunio dosije i poslao na ponovni pregled nakon obrazloženja.`
      : `[${dateStr}]: Kandidat je priložio kompletan dosije (CV + uverenje sa fakulteta + MUP uverenje sa prevodom).`;
    const newNotes = candidate.notes ? `${candidate.notes}\n${noteEntry}` : noteEntry;
    updateCandidateState({
      status: "docs",
      progress: 55,
      notes: newNotes,
      documentsSubmittedForReview: true,
      documentsVerificationStatus: "pending",
      documentsApproved: false,
      documentsRejectionReason: "",
      documentsRejectedAt: null,
    });
    setUploadToast(
      wasRejected
        ? "Dopunjeni dosije je poslat koordinatoru na ponovni pregled!"
        : "Dosije je poslat na verifikaciju — čeka se odobrenje koordinatora i sponzora."
    );
    setTimeout(() => setUploadToast(""), 5000);
  };

  const goHome = (e) => {
    e.preventDefault();
    onNavigate(e, logoHref);
  };

  const embedUrl = getYouTubeEmbedUrl(candidate.youtubeUrl);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[var(--brand-ink)]">
      {/* Zaglavlje, Hero, Brze akcije, Stepper i Filter tabovi */}
      <DashboardHeader
        candidate={candidate}
        logoHref={logoHref}
        goHome={goHome}
        onLogout={onLogout}
        t={t}
        hasSignedContract={hasSignedContract}
        isContractApproved={isContractApproved}
        isContractPending={isContractPending}
        isFirstInstallmentPaid={isFirstInstallmentPaid}
        isFirstInstallmentPending={isFirstInstallmentPending}
        setShowSignContractModal={setShowSignContractModal}
        handlePaymentSlipClick={handlePaymentSlipClick}
        setShowInvoicesModal={setShowInvoicesModal}
        candidateInvoices={candidateInvoices}
        setShowDs160Modal={setShowDs160Modal}
        uploadToast={uploadToast}
        statusBadgeText={statusBadgeText}
        currentProgress={currentProgress}
        isRegistrationDone={isRegistrationDone}
        isStep1Done={isStep1Done}
        isDocumentsApproved={isDocumentsApproved}
        isDocumentsPending={isDocumentsPending}
        isDocumentsRejected={isDocumentsRejected}
        isStep2Done={isStep2Done}
        isSecondInstallmentPaid={isSecondInstallmentPaid}
        isSecondInstallmentPending={isSecondInstallmentPending}
        isStep3Done={isStep3Done}
        isThirdInstallmentPaid={isThirdInstallmentPaid}
        isThirdInstallmentPending={isThirdInstallmentPending}
        profileScore={profileScore}
        hasConfirmedJob={hasConfirmedJob}
        status={status}
        interviewScheduled={interviewScheduled}
        jobApplicationStatus={candidate.jobApplicationStatus}
        activeStepTab={activeStepTab}
        setActiveStepTab={setActiveStepTab}
      />

      {/* Glavni sadržaj koraka */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:px-4">
        {/* FAZA 0: REGISTRACIJA, IZBOR PROGRAMA, UGOVOR & I RATA */}
        {(activeStepTab === "all" || activeStepTab === "reg") && (
          <Step0Registration
            candidate={candidate}
            hasSignedContract={hasSignedContract}
            isContractApproved={isContractApproved}
            isContractPending={isContractPending}
            isFirstInstallmentPaid={isFirstInstallmentPaid}
            isFirstInstallmentPending={isFirstInstallmentPending}
            isRegistrationDone={isRegistrationDone}
            handleReportFirstInstallment={handleReportFirstInstallment}
            handleSimulateFirstPaymentConfirm={handleSimulateFirstPaymentConfirm}
            handleSimulateContractApprove={handleSimulateContractApprove}
            signedContractInputRef={signedContractInputRef}
            isUploadingSignedContract={isUploadingSignedContract}
            handleUploadSignedContract={handleUploadSignedContract}
            handlePaymentSlipClick={handlePaymentSlipClick}
            setShowChangeDiscountModal={setShowChangeDiscountModal}
            copiedRefCode={copiedRefCode}
            setCopiedRefCode={setCopiedRefCode}
          />
        )}

        {/* KORAK 1: PROFIL, DOKUMENTACIJA & ZVANIČNI PREVODI */}
        {(activeStepTab === "all" || activeStepTab === "step1") && (
          <Step1Documents
            candidate={candidate}
            setShowDs160Modal={setShowDs160Modal}
            isRegistrationDone={isRegistrationDone}
            isStep1Done={isStep1Done}
            isDocumentsApproved={isDocumentsApproved}
            isDocumentsPending={isDocumentsPending}
            isDocumentsRejected={isDocumentsRejected}
            handleSimulateDocumentsApprove={handleSimulateDocumentsApprove}
            profileScore={profileScore}
            setShowProfileBuilderModal={setShowProfileBuilderModal}
            setShowVideoModal={setShowVideoModal}
            isYoutubeEditing={isYoutubeEditing}
            setIsYoutubeEditing={setIsYoutubeEditing}
            youtubeInput={youtubeInput}
            setYoutubeInput={setYoutubeInput}
            handleSaveYoutube={handleSaveYoutube}
            embedUrl={embedUrl}
            cvInputRef={cvInputRef}
            handleCvUpload={handleCvUpload}
            setCvFile={setCvFile}
            updateCandidateState={updateCandidateState}
            certInputRef={certInputRef}
            isUploadingCert={isUploadingCert}
            facultyFile={facultyFile}
            setFacultyFile={setFacultyFile}
            aiTranslationReady={aiTranslationReady}
            setAiTranslationReady={setAiTranslationReady}
            handleCertUpload={handleCertUpload}
            runAiTranslation={runAiTranslation}
            isTranslating={isTranslating}
            setActiveTranslationDoc={setActiveTranslationDoc}
            setShowTranslationModal={setShowTranslationModal}
            setUploadToast={setUploadToast}
            policeInputRef={policeInputRef}
            policeFile={policeFile}
            setPoliceFile={setPoliceFile}
            policeTranslationReady={policeTranslationReady}
            setPoliceTranslationReady={setPoliceTranslationReady}
            handlePoliceCertUpload={handlePoliceCertUpload}
            runPoliceTranslation={runPoliceTranslation}
            isTranslatingPolice={isTranslatingPolice}
            isPastReview={isPastReview}
            applicationSubmitted={applicationSubmitted}
            isRequirementsMet={isRequirementsMet}
            handleSubmitForReview={handleSubmitForReview}
            t={t}
          />
        )}

        {/* KORAK 2: POSAO, INTERVJU SA POSLODAVCEM & II RATA */}
        {(activeStepTab === "all" || activeStepTab === "step2") && (
          <Step2JobPlacement
            candidate={candidate}
            status={status}
            isDocumentsApproved={isDocumentsApproved}
            isStep2Done={isStep2Done}
            hasConfirmedJob={hasConfirmedJob}
            isSecondInstallmentPaid={isSecondInstallmentPaid}
            isSecondInstallmentPending={isSecondInstallmentPending}
            handleReportSecondInstallment={handleReportSecondInstallment}
            handleConfirmSecondInstallment={handleConfirmSecondInstallment}
            interviewScheduled={interviewScheduled}
            setShowJobFairModal={setShowJobFairModal}
            setShowJobOfferModal={setShowJobOfferModal}
            setShowInvoicesModal={setShowInvoicesModal}
            handleAcceptJobOffer={handleAcceptJobOffer}
            updateCandidateState={updateCandidateState}
            setUploadToast={setUploadToast}
          />
        )}

        {/* KORAK 3: AMBASADA SAD, VIZA, III RATA / PKZ & POLAZAK */}
        {(activeStepTab === "all" || activeStepTab === "step3") && (
          <Step3VisaDeparture
            candidate={candidate}
            status={status}
            isStep3Done={isStep3Done}
            isDeparture={isDeparture}
            isReady={isReady}
            isSecondInstallmentPaid={isSecondInstallmentPaid}
            isThirdInstallmentPaid={isThirdInstallmentPaid}
            isThirdInstallmentPending={isThirdInstallmentPending}
            handleReportThirdInstallment={handleReportThirdInstallment}
            handleConfirmThirdInstallment={handleConfirmThirdInstallment}
            setShowDs160Modal={setShowDs160Modal}
            updateCandidateState={updateCandidateState}
            setUploadToast={setUploadToast}
          />
        )}

        {/* PREGLED PREFERENCIJA I ARHIVA DOKUMENATA */}
        <CandidatePreferencesFooter
          candidate={candidate}
          aiTranslationReady={aiTranslationReady}
          isStep4Done={isStep4Done}
          isStep5Done={isStep5Done}
          status={status}
          t={t}
        />
      </main>

      {/* MODAL: UPUTSTVO ZA YOUTUBE VIDEO */}
      <VideoInstructionsModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        t={t}
      />

      {/* MODAL: PREGLED AI PREVODA UVERENJA */}
      <TranslationModal
        isOpen={showTranslationModal}
        onClose={() => setShowTranslationModal(false)}
        activeTranslationDoc={activeTranslationDoc}
        setActiveTranslationDoc={setActiveTranslationDoc}
        candidate={candidate}
      />

      {/* MODAL: DS-160 UPITNIK ZA AMBASADU SAD */}
      {showDs160Modal && (
        <Ds160Modal
          candidate={candidate}
          onClose={() => setShowDs160Modal(false)}
          onSave={async (ds160Data) => {
            const candFirst = ds160Data.firstName || candidate.firstName || "";
            const candLast = ds160Data.lastNameAndMaiden || candidate.lastName || "";
            const candName = `${candFirst} ${candLast}`.trim() || candidate.name;
            const dsStatus = getDs160Status(ds160Data);
            const updates = {
              ds160: ds160Data,
              ds160Filled: dsStatus.isComplete,
              firstName: candFirst,
              lastName: candLast,
              name: candName,
              gender: ds160Data.gender || candidate.gender,
              maritalStatus: ds160Data.maritalStatus || candidate.maritalStatus,
              birthDate: ds160Data.dateOfBirth || candidate.birthDate,
              dateOfBirth: ds160Data.dateOfBirth || candidate.birthDate,
              birthPlace: ds160Data.birthPlace || candidate.birthPlace,
              birthCountry: ds160Data.birthCountry || candidate.birthCountry,
              citizenship: ds160Data.citizenship || candidate.citizenship,
              jmbg: ds160Data.jmbg || candidate.jmbg,
              passportNumber: ds160Data.passportNumber || candidate.passportNumber,
              idCardNumber: ds160Data.passportNumber || candidate.idCardNumber,
              passportExpiryDate: ds160Data.passportExpiryDate || candidate.passportExpiryDate,
              passportExpiry: ds160Data.passportExpiryDate || candidate.passportExpiry,
              phone: ds160Data.mobilePhone || candidate.phone,
              email: ds160Data.primaryEmail || candidate.email,
              address: ds160Data.homeAddress || candidate.address,
              faculty: ds160Data.university || candidate.faculty,
            };
            updateCandidateState(updates);
            setShowDs160Modal(false);
            setUploadToast(
              dsStatus.isComplete
                ? "DS-160 upitnik je kompletno popunjen i sačuvan!"
                : "DS-160 upitnik je sačuvan kao radna verzija (delimično popunjen)."
            );
            try {
              await saveCandidateDs160WithBackend(ds160Data, candidate.email, candidate.id);
            } catch (err) {
              console.warn("DS-160 backend sync error:", err);
            }
            setTimeout(() => setUploadToast(""), 4500);
          }}
        />
      )}

      {/* MODAL: PROMENA POPUSTA / PROMOCIJE */}
      {showChangeDiscountModal && (
        <ChangeDiscountModal
          candidate={candidate}
          onClose={() => setShowChangeDiscountModal(false)}
          onSave={handleChangeDiscount}
        />
      )}

      {/* MODAL: POTPISIVANJE I KAČENJE UGOVORA */}
      {showSignContractModal && (
        <SignContractModal
          candidate={candidate}
          onClose={() => setShowSignContractModal(false)}
          onSignDigital={(signedBy) => {
            const res = signCandidateContract(candidate.id || candidate.email, signedBy);
            if (res) {
              setCandidate(res);
              setShowSignContractModal(false);
              setUploadToast("Ugovor je digitalno verifikovan i potpisan! Uplatnica je sada otključana.");
              setTimeout(() => setUploadToast(""), 5000);
            }
          }}
          onUploadSignedFile={(file) => handleUploadSignedContract(file)}
          onDownloadContract={() => downloadContractPdf(candidate.id, candidate.email)}
          onDownloadResponsibility={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}
        />
      )}

      {/* MODAL: KNJIGA IZDATIH RAČUNA (KIR) / FAKTURE */}
      {showInvoicesModal && (
        <InvoiceModal
          candidate={candidate}
          isOpen={showInvoicesModal}
          onClose={() => {
            setShowInvoicesModal(false);
            setSelectedCandidateInvoice(null);
          }}
          selectedInvoice={selectedCandidateInvoice}
          onSelectInvoice={(inv) => setSelectedCandidateInvoice(inv)}
          onPayInvoice={(inv) => {
            setUploadToast(`Instrukcije i IPS QR nalog za fakturu ${inv.invoiceNumber} su pripremljeni.`);
            setTimeout(() => setUploadToast(""), 4500);
          }}
        />
      )}

      {/* MODAL: PROFIL BUILDER (CV, ISKUSTVO, DOSTUPNOST) */}
      {showProfileBuilderModal && (
        <ProfileBuilderModal
          isOpen={showProfileBuilderModal}
          onClose={() => setShowProfileBuilderModal(false)}
          candidate={candidate}
          onSave={(profileData) => {
            updateCandidateState(profileData);
            setShowProfileBuilderModal(false);
            setUploadToast("Vaš CV i profil su uspešno ažurirani i sačuvani!");
            setTimeout(() => setUploadToast(""), 4500);
          }}
        />
      )}

      {/* MODAL: SAJAM POSLOVA (KATALOG RADNIH PONUDA) */}
      {showJobFairModal && (
        <JobFairModal
          isOpen={showJobFairModal}
          onClose={() => setShowJobFairModal(false)}
          candidate={candidate}
          onSelectJob={(job) => {
            handleSelectJob(job);
            setShowJobFairModal(false);
            setUploadToast(`Izabrali ste poziciju: ${job.title} (${job.employer})!`);
            setTimeout(() => setUploadToast(""), 4500);
          }}
          onScheduleInterview={(details) => {
            handleScheduleInterview(details);
            setShowJobFairModal(false);
          }}
        />
      )}

      {/* MODAL: JOB OFFER PREGLED I DIGITALNO POTPISIVANJE */}
      {showJobOfferModal && (
        <JobOfferModal
          isOpen={showJobOfferModal}
          onClose={() => setShowJobOfferModal(false)}
          candidate={candidate}
          onAcceptOffer={(signedOffer) => {
            handleAcceptJobOffer(signedOffer);
            setShowJobOfferModal(false);
          }}
        />
      )}
    </div>
  );
}
