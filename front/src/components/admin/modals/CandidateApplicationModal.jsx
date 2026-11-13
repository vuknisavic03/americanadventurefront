// front/src/components/admin/modals/CandidateApplicationModal.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/LanguageContext";
import {
  PROGRAM_PACKAGES,
  getPromotions,
  uploadDocumentWithBackend,
  confirmInstallmentPayment,
  verifyCandidateContract,
  verifyCandidateDocuments,
  getCandidateStepInfo,
  getDs160Status,
  openPrintableContractWindow,
} from "../../../data/candidateStore";
import {
  getInvoicesForCandidate,
  updateInvoiceStatus,
  formatEur,
  formatRsd,
  getCurrentNbsRate,
  fetchCurrentNbsRate,
  PAYMENT_STATUSES,
} from "../../../data/invoicesStore";
import NewInvoiceModal from "../../NewInvoiceModal";
import ProfileBuilderModal from "../../ProfileBuilderModal";
import { getJobs } from "../../../data/jobsStore";
import {
  FIELD_CLS,
  STATUS,
  STATUS_FLOW,
  PIPELINE_STEPS,
  CheckIcon,
  PlusIcon,
  XIcon,
  Modal,
  Field,
  PrimaryButton,
  SecondaryButton,
} from "../ui";

export default function CandidateApplicationModal({ candidate, onSave, onClose }) {
  const { t } = useTranslation();
  const promotions = getPromotions();

  // Odredi početni tab na osnovu trenutnog koraka kandidata kako admin odmah vidi aktuelni korak
  const getInitialTab = () => {
    const st = candidate.status === "in_review" ? "docs" : candidate.status === "registered" ? "review" : (candidate.status || "review");
    if (st === "docs") return "step1_docs";
    if (st === "job") return "step2_job";
    if (st === "departure" || st === "ready") return "step3_visa";
    return "registration";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // 1. Lični i akademski podaci
  const [firstName, setFirstName] = useState(candidate.firstName || (candidate.name || "").split(" ")[0] || "");
  const [lastName, setLastName] = useState(
    candidate.lastName || (candidate.name || "").split(" ").slice(1).join(" ") || ""
  );
  const [email, setEmail] = useState(candidate.email || "");
  const [phone, setPhone] = useState(candidate.phone || "");
  const [jmbg, setJmbg] = useState(candidate.jmbg || candidate.ds160?.jmbg || "");
  const [idCardNumber, setIdCardNumber] = useState(candidate.idCardNumber || "");
  const [passportNumber, setPassportNumber] = useState(candidate.passportNumber || candidate.idCardNumber || candidate.ds160?.passportNumber || "");
  const [birthDate, setBirthDate] = useState(candidate.birthDate || candidate.dateOfBirth || candidate.ds160?.dateOfBirth || "");
  const [passportExpiryDate, setPassportExpiryDate] = useState(candidate.passportExpiryDate || candidate.passportExpiry || candidate.ds160?.passportExpiryDate || "");
  const [gender, setGender] = useState(candidate.gender || candidate.ds160?.gender || "Muški");
  const [birthPlace, setBirthPlace] = useState(candidate.birthPlace || candidate.city || candidate.ds160?.birthPlace || "");
  const [citizenship, setCitizenship] = useState(candidate.citizenship || candidate.ds160?.citizenship || "Republika Srbija");
  const [address, setAddress] = useState(candidate.address || candidate.ds160?.homeAddress || "");
  const [passportScanFileName, setPassportScanFileName] = useState(
    candidate.passportScanFileName ||
      (candidate.passportScanDataUrl || candidate.passportImage || candidate.passportScanUrl
        ? "Sken_Pasosa_OCR.png"
        : "")
  );
  const [passportScanUrl, setPassportScanUrl] = useState(candidate.passportScanUrl || "");
  const [passportScanDataUrl, setPassportScanDataUrl] = useState(
    candidate.passportScanDataUrl || candidate.passportImage || ""
  );
  const [faculty, setFaculty] = useState(candidate.faculty || "");
  const [studyCity, setStudyCity] = useState(candidate.studyCity || "Beograd");
  const [studyYear, setStudyYear] = useState(candidate.studyYear || "YEAR_2");
  const [ectsPoints, setEctsPoints] = useState(
    candidate.ectsPoints !== undefined && candidate.ectsPoints !== null ? String(candidate.ectsPoints) : ""
  );

  // Selekcioni i konsultacioni podaci (Faza 0)
  const [contactStatus, setContactStatus] = useState(candidate.contactStatus || "NOT_ATTEMPTED");
  const [contactNotes, setContactNotes] = useState(candidate.contactNotes || "");
  const [infoMaterialsSent, setInfoMaterialsSent] = useState(Boolean(candidate.infoMaterialsSent));
  const [consultationStatus, setConsultationStatus] = useState(candidate.consultationStatus || "NOT_SCHEDULED");
  const [consultationStartsAt, setConsultationStartsAt] = useState(candidate.consultationStartsAt || "");
  const [consultationType, setConsultationType] = useState(candidate.consultationType || "ONLINE");
  const [consultationNotes, setConsultationNotes] = useState(candidate.consultationNotes || "");
  const [selectionDecision, setSelectionDecision] = useState(candidate.selectionDecision || "QUALIFIED");
  const [decisionNote, setDecisionNote] = useState(candidate.decisionNote || "");

  // 2. Paket, finansije, jemac i popust
  const [packageId, setPackageId] = useState(candidate.packageId || "swt-full");
  const [discount, setDiscount] = useState(candidate.discount || 0);
  const [discountNote, setDiscountNote] = useState(candidate.discountNote || "");
  const [discountId, setDiscountId] = useState(candidate.discountId || "none");
  const [discountTiming, setDiscountTiming] = useState(candidate.discountTiming || "immediate");
  const [discountVerified, setDiscountVerified] = useState(Boolean(candidate.discountVerified));
  const [referredBy, setReferredBy] = useState(candidate.referredBy || "");
  const [groupCode, setGroupCode] = useState(candidate.groupCode || "");
  const [paymentMethod, setPaymentMethod] = useState(
    candidate.paymentMethod || (candidate.paymentModel === "installments" ? "installments" : "now")
  );
  const [guarantorName, setGuarantorName] = useState(candidate.guarantor?.name || "");
  const [guarantorIdCard, setGuarantorIdCard] = useState(candidate.guarantor?.idCardNumber || "");
  const [guarantorJmbg, setGuarantorJmbg] = useState(candidate.guarantor?.jmbg || "");

  // Statusi ugovora, rata i dokumenata
  const [contractVerificationStatus, setContractVerificationStatus] = useState(
    candidate.contractVerificationStatus || (candidate.contractApproved ? "approved" : "pending")
  );
  const [contractApproved, setContractApproved] = useState(Boolean(candidate.contractApproved));
  const [firstInstallmentStatus, setFirstInstallmentStatus] = useState(
    candidate.firstInstallmentStatus ||
      candidate.firstPaymentStatus ||
      (candidate.firstInstallmentApproved ? "paid" : "unpaid")
  );
  const [firstInstallmentApproved, setFirstInstallmentApproved] = useState(
    Boolean(candidate.firstInstallmentApproved || candidate.firstInstallmentStatus === "paid")
  );
  const [documentsVerificationStatus, setDocumentsVerificationStatus] = useState(
    candidate.documentsVerificationStatus || (candidate.documentsApproved ? "approved" : "pending")
  );
  const [documentsApproved, setDocumentsApproved] = useState(Boolean(candidate.documentsApproved));
  const [secondInstallmentStatus, setSecondInstallmentStatus] = useState(
    candidate.secondInstallmentStatus || (candidate.secondInstallmentPaid ? "paid" : "unpaid")
  );
  const [secondInstallmentPaid, setSecondInstallmentPaid] = useState(
    Boolean(candidate.secondInstallmentPaid || candidate.secondInstallmentStatus === "paid")
  );
  const [thirdInstallmentStatus, setThirdInstallmentStatus] = useState(
    candidate.thirdInstallmentStatus || (candidate.thirdInstallmentPaid ? "paid" : "unpaid")
  );
  const [thirdInstallmentPaid, setThirdInstallmentPaid] = useState(
    Boolean(candidate.thirdInstallmentPaid || candidate.thirdInstallmentStatus === "paid")
  );
  const [firstInstallmentAmount, setFirstInstallmentAmount] = useState(
    candidate.firstInstallmentAmount !== undefined ? Number(candidate.firstInstallmentAmount) : 250
  );
  const [secondInstallmentAmount, setSecondInstallmentAmount] = useState(
    candidate.secondInstallmentAmount !== undefined ? Number(candidate.secondInstallmentAmount) : 400
  );
  const [thirdInstallmentAmount, setThirdInstallmentAmount] = useState(
    candidate.thirdInstallmentAmount !== undefined
      ? Number(candidate.thirdInstallmentAmount)
      : Math.max(0, (Number(candidate.finalPrice) || 1750) - (Number(candidate.firstInstallmentAmount) || 250) - (Number(candidate.secondInstallmentAmount) || 400))
  );
  const [isFullPaymentPaid, setIsFullPaymentPaid] = useState(
    Boolean(
      candidate.isFullPaymentPaid ||
        (candidate.paymentMethod === "now" &&
          (candidate.firstInstallmentApproved ||
            candidate.firstInstallmentStatus === "paid" ||
            candidate.firstPaymentStatus === "paid"))
    )
  );
  const [currentNbsRate, setCurrentNbsRate] = useState(() => getCurrentNbsRate("EUR"));

  useEffect(() => {
    let active = true;
    fetchCurrentNbsRate("EUR").then((rate) => {
      if (active && rate) setCurrentNbsRate(rate);
    });
    return () => {
      active = false;
    };
  }, []);
  const [adminToast, setAdminToast] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [rejectionModal, setRejectionModal] = useState(null);
  const [documentsRejectionReason, setDocumentsRejectionReason] = useState(candidate.documentsRejectionReason || "");
  const [contractRejectionReason, setContractRejectionReason] = useState(candidate.contractRejectionReason || "");
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);

  // 3. Korak 2: Preferencije, Priprema za intervju i Job Offer
  const [englishLevel, setEnglishLevel] = useState(
    candidate.preferences?.englishLevel || candidate.englishLevel || "B2"
  );
  const [locationPref, setLocationPref] = useState(candidate.preferences?.location || "");
  const [positionPref, setPositionPref] = useState(candidate.preferences?.position || "");
  const [testLink, setTestLink] = useState(candidate.preferences?.testLink || "");
  const [startDate, setStartDate] = useState(candidate.availability?.startDate || "");
  const [endDate, setEndDate] = useState(candidate.availability?.endDate || "");

  const [interviewPrepStatus, setInterviewPrepStatus] = useState(candidate.interviewPrepStatus || "NOT_SCHEDULED");
  const [interviewPrepScheduledAt, setInterviewPrepScheduledAt] = useState(candidate.interviewPrepScheduledAt || "");
  const [interviewPrepType, setInterviewPrepType] = useState(candidate.interviewPrepType || "ONLINE");
  const [interviewPrepNotes, setInterviewPrepNotes] = useState(candidate.interviewPrepNotes || "");

  const [selectedJobTitle, setSelectedJobTitle] = useState(candidate.selectedJobTitle || "");
  const [selectedJobEmployer, setSelectedJobEmployer] = useState(candidate.selectedJobEmployer || "");
  const [selectedJobCity, setSelectedJobCity] = useState(candidate.selectedJobCity || "");
  const [selectedJobWage, setSelectedJobWage] = useState(candidate.selectedJobWage || "");
  const [selectedJobHousing, setSelectedJobHousing] = useState(candidate.selectedJobHousing || "");
  const [hasJob, setHasJob] = useState(
    Boolean(
      (candidate.jobApplicationStatus === "ACCEPTED" || candidate.jobOfferSignedAt || candidate.hasJob) &&
      candidate.jobApplicationStatus !== "SCHEDULED" &&
      candidate.jobApplicationStatus !== "APPLIED" &&
      candidate.jobApplicationStatus !== "NO_SLOTS" &&
      candidate.jobApplicationStatus !== "REJECTED"
    )
  );

  const [offerAllJobs, setOfferAllJobs] = useState(candidate.offerAllJobs !== false);
  const [offeredJobIds, setOfferedJobIds] = useState(
    Array.isArray(candidate.offeredJobIds) ? candidate.offeredJobIds : []
  );
  const [jobApplicationStatus, setJobApplicationStatus] = useState(
    candidate.jobApplicationStatus ||
      (candidate.jobOfferSignedAt ? "ACCEPTED" : candidate.selectedJobEmployer ? "APPLIED" : "NONE")
  );
  const [interviewScheduledAt, setInterviewScheduledAt] = useState(candidate.interviewScheduledAt || "");
  const [interviewType, setInterviewType] = useState(candidate.interviewType || "ONLINE");
  const [interviewLink, setInterviewLink] = useState(candidate.interviewLink || "");
  const [interviewNote, setInterviewNote] = useState(candidate.interviewNote || "");

  // 4. Korak 1: Dokumenta i CV
  const [youtubeUrl, setYoutubeUrl] = useState(candidate.youtubeUrl || "");
  const [cvFileName, setCvFileName] = useState(candidate.cvFileName || "");
  const [cvUrl, setCvUrl] = useState(candidate.cvUrl || "");
  const [cvDataUrl, setCvDataUrl] = useState(candidate.cvDataUrl || "");
  const [facultyCertFileName, setFacultyCertFileName] = useState(candidate.facultyCertFileName || "");
  const [facultyCertUrl, setFacultyCertUrl] = useState(candidate.facultyCertUrl || "");
  const [facultyCertDataUrl, setFacultyCertDataUrl] = useState(candidate.facultyCertDataUrl || "");
  const [facultyCertAiTranslation, setFacultyCertAiTranslation] = useState(
    Boolean(candidate.facultyCertAiTranslation)
  );
  const [policeCertificateFileName, setPoliceCertificateFileName] = useState(
    candidate.policeCertificateFileName || ""
  );
  const [policeCertificateUrl, setPoliceCertificateUrl] = useState(candidate.policeCertificateUrl || "");
  const [policeCertificateDataUrl, setPoliceCertificateDataUrl] = useState(
    candidate.policeCertificateDataUrl || ""
  );
  const [policeCertificateTranslated, setPoliceCertificateTranslated] = useState(
    Boolean(candidate.policeCertificateTranslated)
  );
  const [signedContractFileName, setSignedContractFileName] = useState(candidate.signedContractFileName || "");
  const [signedContractUrl, setSignedContractUrl] = useState(candidate.signedContractUrl || "");
  const [signedContractDataUrl, setSignedContractDataUrl] = useState(candidate.signedContractDataUrl || "");
  const [contractSigned, setContractSigned] = useState(
    Boolean(candidate.contractSigned || candidate.signedContractFileName)
  );
  const [uploadingDocType, setUploadingDocType] = useState("");

  // 5. Korak 3: Viza, Ambasada, DS-2019, Let i Orijentacija
  const [ds2019Status, setDs2019Status] = useState(
    candidate.ds2019Status || (secondInstallmentPaid ? "IN_PROGRESS" : "LOCKED")
  );
  const [ds2019Number, setDs2019Number] = useState(candidate.ds2019Number || "");
  const [embassyInterviewDate, setEmbassyInterviewDate] = useState(candidate.embassyInterviewDate || "");
  const [embassyPrepStatus, setEmbassyPrepStatus] = useState(candidate.embassyPrepStatus || "NOT_SCHEDULED");
  const [flightTicketStatus, setFlightTicketStatus] = useState(candidate.flightTicketStatus || "PENDING");
  const [flightDepartureDate, setFlightDepartureDate] = useState(candidate.flightDepartureDate || "");
  const [flightReturnDate, setFlightReturnDate] = useState(candidate.flightReturnDate || "");
  const [orientationAttended, setOrientationAttended] = useState(Boolean(candidate.orientationAttended));
  const [hasVisa, setHasVisa] = useState(Boolean(candidate.hasVisa || candidate.status === "ready"));

  // 6. Status koraka i napomene
  const normInitialStatus =
    candidate.status === "in_review"
      ? "docs"
      : candidate.status === "registered"
      ? "review"
      : candidate.status || "review";
  const [status, setStatus] = useState(normInitialStatus);
  const [notes, setNotes] = useState(candidate.notes || "");

  // 7. Fakture kandidata (KIR)
  const [candidateInvoices, setCandidateInvoices] = useState(() =>
    getInvoicesForCandidate(candidate.id, candidate.email)
  );
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  const refreshCandidateInvoices = () => {
    setCandidateInvoices(getInvoicesForCandidate(candidate.id, candidate.email));
  };

  const selectedPackage = PROGRAM_PACKAGES.find((p) => p.id === packageId) || PROGRAM_PACKAGES[0];
  const basePrice = selectedPackage.basePrice;
  const numDiscount = Math.max(0, Number(discount) || 0);
  const finalPrice = Math.max(0, basePrice - numDiscount);

  const showToast = (msg) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(""), 4500);
  };

  // Izgradnja objekta kandidata iz trenutnog stanja forme
  const buildUpdatedCandidate = (overrides = {}) => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || candidate.name || email;
    const isNowRegistered = Boolean(
      candidate.isRegistered ||
        candidate.registeredAt ||
        ["review", "docs", "job", "departure", "ready"].includes(overrides.status || status)
    );
    return {
      ...candidate,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      email: email.trim(),
      phone: phone.trim(),
      jmbg: jmbg.trim(),
      idCardNumber: idCardNumber.trim() || passportNumber.trim(),
      passportNumber: passportNumber.trim() || idCardNumber.trim(),
      birthDate: birthDate.trim(),
      dateOfBirth: birthDate.trim(),
      passportExpiryDate: passportExpiryDate.trim(),
      passportExpiry: passportExpiryDate.trim(),
      gender: gender.trim(),
      birthPlace: birthPlace.trim(),
      citizenship: citizenship.trim(),
      address: address.trim(),
      passportScanFileName: passportScanFileName.trim(),
      passportScanUrl,
      passportScanDataUrl,
      passportImage: passportScanDataUrl,
      faculty: faculty.trim(),
      studyCity: studyCity.trim(),
      studyYear,
      ectsPoints: ectsPoints !== "" ? Number(ectsPoints) : undefined,
      contactStatus,
      contactNotes: contactNotes.trim(),
      infoMaterialsSent: Boolean(infoMaterialsSent),
      consultationStatus,
      consultationStartsAt: consultationStartsAt || null,
      consultationType,
      consultationNotes: consultationNotes.trim(),
      selectionDecision,
      decisionNote: decisionNote.trim(),
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      program: selectedPackage.name,
      basePrice,
      discount: numDiscount,
      discountNote: discountNote.trim(),
      discountId,
      discountTiming,
      discountVerified: Boolean(discountVerified),
      referredBy: referredBy.trim(),
      groupCode: groupCode.trim().toUpperCase(),
      hasJob: Boolean(
        (hasJob || jobApplicationStatus === "ACCEPTED") &&
        jobApplicationStatus !== "SCHEDULED" &&
        jobApplicationStatus !== "APPLIED" &&
        jobApplicationStatus !== "NO_SLOTS" &&
        jobApplicationStatus !== "REJECTED"
      ),
      offerAllJobs,
      offeredJobIds,
      jobApplicationStatus,
      interviewScheduledAt,
      interviewType,
      interviewLink,
      interviewNote,
      selectedJobTitle: selectedJobTitle.trim(),
      selectedJobEmployer: selectedJobEmployer.trim(),
      selectedJobCity: selectedJobCity.trim(),
      selectedJobWage: selectedJobWage.trim(),
      selectedJobHousing: selectedJobHousing.trim(),
      hasVisa: Boolean(hasVisa),
      finalPrice,
      paymentMethod,
      guarantor:
        paymentMethod === "later" || paymentMethod === "installments" || guarantorName.trim()
          ? {
              name: guarantorName.trim(),
              idCardNumber: guarantorIdCard.trim(),
              jmbg: guarantorJmbg.trim(),
              promissoryNotesCount: 2,
            }
          : null,
      preferences: {
        ...(candidate.preferences || {}),
        englishLevel,
        location: locationPref.trim(),
        position: positionPref.trim(),
        testLink: testLink.trim(),
      },
      availability: {
        ...(candidate.availability || {}),
        startDate,
        endDate,
      },
      youtubeUrl: youtubeUrl.trim(),
      cvFileName: cvFileName.trim(),
      cvUrl,
      cvDataUrl,
      facultyCertFileName: facultyCertFileName.trim(),
      facultyCertUrl,
      facultyCertDataUrl,
      facultyCertAiTranslation: Boolean(facultyCertAiTranslation),
      policeCertificateFileName: policeCertificateFileName.trim(),
      policeCertificateUrl,
      policeCertificateDataUrl,
      policeCertificateUploaded: Boolean(policeCertificateFileName.trim()),
      policeCertificateTranslated: Boolean(policeCertificateTranslated),
      signedContractFileName: signedContractFileName.trim(),
      signedContractUrl,
      signedContractDataUrl,
      contractSigned: Boolean(contractSigned || signedContractFileName.trim()),
      contractVerificationStatus,
      contractApproved: Boolean(contractApproved),
      contractRejectionReason,
      firstInstallmentStatus,
      firstPaymentStatus: firstInstallmentStatus,
      firstInstallmentApproved: Boolean(firstInstallmentApproved),
      firstInstallmentAmount: Number(firstInstallmentAmount) || 0,
      documentsVerificationStatus,
      documentsApproved: Boolean(documentsApproved),
      documentsRejectionReason,
      secondInstallmentStatus,
      secondInstallmentPaid: Boolean(secondInstallmentPaid),
      secondInstallmentAmount: Number(secondInstallmentAmount) || 0,
      thirdInstallmentStatus,
      thirdInstallmentPaid: Boolean(thirdInstallmentPaid),
      thirdInstallmentAmount: Number(thirdInstallmentAmount) || 0,
      isFullPaymentPaid: Boolean(isFullPaymentPaid),
      firstInstallmentPaidRsd: candidate.firstInstallmentPaidRsd,
      firstInstallmentExchangeRate: candidate.firstInstallmentExchangeRate,
      firstInstallmentPaidDate: candidate.firstInstallmentPaidDate,
      secondInstallmentPaidRsd: candidate.secondInstallmentPaidRsd,
      secondInstallmentExchangeRate: candidate.secondInstallmentExchangeRate,
      secondInstallmentPaidDate: candidate.secondInstallmentPaidDate,
      thirdInstallmentPaidRsd: candidate.thirdInstallmentPaidRsd,
      thirdInstallmentExchangeRate: candidate.thirdInstallmentExchangeRate,
      thirdInstallmentPaidDate: candidate.thirdInstallmentPaidDate,
      fullPaymentPaidRsd: candidate.fullPaymentPaidRsd,
      fullPaymentExchangeRate: candidate.fullPaymentExchangeRate,
      fullPaymentPaidDate: candidate.fullPaymentPaidDate,
      interviewPrepStatus,
      interviewPrepScheduledAt: interviewPrepScheduledAt || null,
      interviewPrepType,
      interviewPrepNotes: interviewPrepNotes.trim(),
      selectedJobTitle: selectedJobTitle.trim(),
      selectedJobEmployer: selectedJobEmployer.trim(),
      selectedJobCity: selectedJobCity.trim(),
      selectedJobWage: selectedJobWage.trim(),
      selectedJobHousing: selectedJobHousing.trim(),
      ds2019Status,
      ds2019Number: ds2019Number.trim(),
      embassyInterviewDate: embassyInterviewDate || null,
      embassyPrepStatus,
      flightTicketStatus,
      flightDepartureDate: flightDepartureDate || null,
      flightReturnDate: flightReturnDate || null,
      orientationAttended: Boolean(orientationAttended),
      ds160: candidate.ds160,
      status,
      isRegistered: isNowRegistered,
      registeredAt: candidate.registeredAt || (isNowRegistered ? new Date().toISOString() : undefined),
      notes: notes.trim(),
      ...overrides,
    };
  };

  // Reaktivne akcije u modalu:
  const handleVerifyContractAction = (approved, reason = "") => {
    verifyCandidateContract(candidate.id || email, approved, reason);
    const nextVerStatus = approved ? "approved" : "rejected";
    setContractVerificationStatus(nextVerStatus);
    setContractApproved(approved);
    if (!approved) setContractRejectionReason(reason);
    else setContractRejectionReason("");

    // Ako su i ugovor i I rata sada odobreni, automatski prebaci na Korak 1 (docs); ako je ugovor odbijen, vrati na Registraciju (review)
    const shouldAdvanceToDocs = approved && firstInstallmentApproved && (status === "review" || status === "applying");
    const shouldRevertToReview = !approved && (status === "docs" || status === "in_review");
    const nextStatus = shouldAdvanceToDocs ? "docs" : shouldRevertToReview ? "review" : status;
    if (nextStatus !== status) setStatus(nextStatus);

    const updated = buildUpdatedCandidate({
      contractVerificationStatus: nextVerStatus,
      contractApproved: approved,
      contractRejectionReason: approved ? "" : reason,
      status: nextStatus,
    });
    onSave(updated, { keepOpen: true });

    showToast(
      shouldAdvanceToDocs
        ? "Ugovor odobren! Pošto je i I rata plaćena, kandidat je automatski prebačen na Korak 1: Dokumenta."
        : approved
        ? "Svojeručno potpisani ugovor je odobren!"
        : "Ugovor je odbijen uz obrazloženje. Student na svom profilu sada vidi status odbijenog ugovora i razlog vraćanja."
    );
  };

  const handleConfirmInstallmentAction = (instNum) => {
    const todayDate = new Date().toISOString().slice(0, 10);
    const rate = currentNbsRate || 117.1524;
    const isFullAction =
      instNum === "full" ||
      instNum === "FULL" ||
      instNum === 0 ||
      (paymentMethod === "now" && (instNum === 1 || instNum === "1"));

    confirmInstallmentPayment(candidate.id || email, isFullAction ? "FULL" : instNum, {
      exchangeRate: rate,
      paidDate: todayDate,
    });
    let nextStatus = status;

    if (isFullAction) {
      setIsFullPaymentPaid(true);
      setFirstInstallmentStatus("paid");
      setFirstInstallmentApproved(true);
      setSecondInstallmentStatus("paid");
      setSecondInstallmentPaid(true);
      setThirdInstallmentStatus("paid");
      setThirdInstallmentPaid(true);
      if (contractApproved && (status === "review" || status === "applying")) {
        nextStatus = "docs";
        setStatus("docs");
      }
      if (hasJob && (status === "job" || status === "docs" || status === "review")) {
        nextStatus = "departure";
        setStatus("departure");
      }
      if (ds2019Status === "LOCKED") setDs2019Status("IN_PROGRESS");
    } else if (instNum === 1 || instNum === "1") {
      setFirstInstallmentStatus("paid");
      setFirstInstallmentApproved(true);
      if (contractApproved && (status === "review" || status === "applying")) {
        nextStatus = "docs";
        setStatus("docs");
      }
    } else if (instNum === 2 || instNum === "2") {
      setSecondInstallmentStatus("paid");
      setSecondInstallmentPaid(true);
      if (hasJob && (status === "job" || status === "docs" || status === "review")) {
        nextStatus = "departure";
        setStatus("departure");
      }
      if (ds2019Status === "LOCKED") setDs2019Status("IN_PROGRESS");
    } else if (instNum === 3 || instNum === "3") {
      setThirdInstallmentStatus("paid");
      setThirdInstallmentPaid(true);
    }

    const fullRsd = Math.round(finalPrice * rate * 100) / 100;
    const r1Rsd = Math.round((Number(firstInstallmentAmount) || 250) * rate * 100) / 100;
    const r2Rsd = Math.round((Number(secondInstallmentAmount) || 400) * rate * 100) / 100;
    const r3Rsd = Math.round((Number(thirdInstallmentAmount) || Math.max(0, finalPrice - 650)) * rate * 100) / 100;

    const overrides = isFullAction
      ? {
          isFullPaymentPaid: true,
          fullPaymentPaidRsd: fullRsd,
          fullPaymentExchangeRate: rate,
          fullPaymentPaidDate: todayDate,
          firstInstallmentStatus: "paid",
          firstPaymentStatus: "paid",
          firstInstallmentApproved: true,
          firstInstallmentPaidRsd: r1Rsd,
          firstInstallmentExchangeRate: rate,
          firstInstallmentPaidDate: todayDate,
          secondInstallmentStatus: "paid",
          secondInstallmentPaid: true,
          secondInstallmentPaidRsd: r2Rsd,
          secondInstallmentExchangeRate: rate,
          secondInstallmentPaidDate: todayDate,
          thirdInstallmentStatus: "paid",
          thirdInstallmentPaid: true,
          thirdInstallmentPaidRsd: r3Rsd,
          thirdInstallmentExchangeRate: rate,
          thirdInstallmentPaidDate: todayDate,
          ds2019Status: ds2019Status === "LOCKED" ? "IN_PROGRESS" : ds2019Status,
          status: nextStatus,
        }
      : instNum === 1 || instNum === "1"
      ? {
          firstInstallmentStatus: "paid",
          firstPaymentStatus: "paid",
          firstInstallmentApproved: true,
          firstInstallmentPaidRsd: r1Rsd,
          firstInstallmentExchangeRate: rate,
          firstInstallmentPaidDate: todayDate,
          status: nextStatus,
        }
      : instNum === 2 || instNum === "2"
      ? {
          secondInstallmentStatus: "paid",
          secondInstallmentPaid: true,
          secondInstallmentPaidRsd: r2Rsd,
          secondInstallmentExchangeRate: rate,
          secondInstallmentPaidDate: todayDate,
          ds2019Status: ds2019Status === "LOCKED" ? "IN_PROGRESS" : ds2019Status,
          status: nextStatus,
        }
      : {
          thirdInstallmentStatus: "paid",
          thirdInstallmentPaid: true,
          thirdInstallmentPaidRsd: r3Rsd,
          thirdInstallmentExchangeRate: rate,
          thirdInstallmentPaidDate: todayDate,
          status: nextStatus,
        };

    const updated = buildUpdatedCandidate(overrides);

    onSave(updated, { keepOpen: true });
    refreshCandidateInvoices();

    if (isFullAction) {
      showToast(`Uplata programa u celosti (${finalPrice} € / ${fullRsd.toLocaleString("sr-RS")} RSD) je proknjižena i evidentirana u KIR! Fiksiran kurs NBS: ${rate.toFixed(4)}.`);
    } else if (instNum === 1 && nextStatus === "docs") {
      showToast(`I rata (${firstInstallmentAmount} € / ${r1Rsd.toLocaleString("sr-RS")} RSD) potvrđena i evidentirana u KIR! Kandidat je automatski prebačen na Korak 1: Dokumenta.`);
    } else if (instNum === 2 && nextStatus === "departure") {
      showToast(`II rata (${secondInstallmentAmount} € / ${r2Rsd.toLocaleString("sr-RS")} RSD) potvrđena i evidentirana u KIR! Kandidat je automatski prebačen na Čekanje na vizu.`);
    } else {
      showToast(`Uplata ${instNum}. rate je uspešno potvrđena i evidentirana u Knjizi izdatih računa (KIR)!`);
    }
  };

  const handleVerifyDocumentsAction = (approved, reason = "") => {
    verifyCandidateDocuments(candidate.id || email, approved, reason);
    const nextDocStatus = approved ? "approved" : "rejected";
    setDocumentsVerificationStatus(nextDocStatus);
    setDocumentsApproved(approved);
    if (!approved) setDocumentsRejectionReason(reason);
    else setDocumentsRejectionReason("");

    const nextStatus = approved ? "job" : status;
    if (approved) setStatus("job");

    const updated = buildUpdatedCandidate({
      documentsVerificationStatus: nextDocStatus,
      documentsApproved: approved,
      documentsRejectionReason: approved ? "" : reason,
      status: nextStatus,
    });
    onSave(updated, { keepOpen: true });

    showToast(
      approved
        ? "Kompletan dosije odobren! Kandidat je automatski prebačen na Korak 2: Posao i ponuda."
        : "Dokumentacija je vraćena na dopunu. Obrazloženje je prikazano kandidatu na profilu."
    );
  };

  const handleAdminDocUpload = async (file, type) => {
    if (!file) return;
    setUploadingDocType(type);
    try {
      const res = await uploadDocumentWithBackend(file, type, email, candidate.id);
      if (type === "signedContract") {
        setSignedContractFileName(res.fileName);
        if (res.fileUrl) setSignedContractUrl(res.fileUrl);
        if (res.dataUrl) setSignedContractDataUrl(res.dataUrl);
        setContractSigned(true);
      } else if (type === "cv") {
        setCvFileName(res.fileName);
        if (res.fileUrl) setCvUrl(res.fileUrl);
        if (res.dataUrl) setCvDataUrl(res.dataUrl);
      } else if (type === "facultyCert") {
        setFacultyCertFileName(res.fileName);
        if (res.fileUrl) setFacultyCertUrl(res.fileUrl);
        if (res.dataUrl) setFacultyCertDataUrl(res.dataUrl);
        setFacultyCertAiTranslation(true);
      } else if (type === "policeCert") {
        setPoliceCertificateFileName(res.fileName);
        if (res.fileUrl) setPoliceCertificateUrl(res.fileUrl);
        if (res.dataUrl) setPoliceCertificateDataUrl(res.dataUrl);
        setPoliceCertificateTranslated(true);
      } else if (type === "passport") {
        setPassportScanFileName(res.fileName);
        if (res.fileUrl) setPassportScanUrl(res.fileUrl);
        if (res.dataUrl) setPassportScanDataUrl(res.dataUrl);
      }
      showToast(`Dokument "${res.fileName}" je uspešno sačuvan u dosijeu.`);
    } finally {
      setUploadingDocType("");
    }
  };

  const openDocumentPreview = (title, fileName, fileUrl, dataUrl, docCategory) => {
    if (!fileName && !fileUrl && !dataUrl) return;
    setPreviewDoc({
      title,
      fileName: fileName || "Dokument.pdf",
      url: dataUrl || fileUrl || "",
      docCategory,
    });
  };

  // Promena koraka na gornjoj traci
  const handleSelectStep = (stepId) => {
    setStatus(stepId);
    if (stepId === "ready") setHasVisa(true);
    if (stepId === "review") setActiveTab("registration");
    else if (stepId === "docs") setActiveTab("step1_docs");
    else if (stepId === "job") setActiveTab("step2_job");
    else if (stepId === "departure" || stepId === "ready") setActiveTab("step3_visa");
  };

  const currentFlow = STATUS_FLOW[status] || STATUS_FLOW.review;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const updated = buildUpdatedCandidate();
    onSave(updated);
  };

  const liveCandidateSnapshot = buildUpdatedCandidate();
  const stepInfo = getCandidateStepInfo(liveCandidateSnapshot);
  const ds160Entries = Object.entries(candidate.ds160 || {});

  // Finansijski saldo
  const r1Amount = Number(firstInstallmentAmount) || 250;
  const r2Amount = Number(secondInstallmentAmount) || 400;
  const r3Amount = Number(thirdInstallmentAmount) || Math.max(0, finalPrice - r1Amount - r2Amount);

  const isFull = paymentMethod === "now";

  const totalPaidEur = isFull
    ? isFullPaymentPaid || firstInstallmentApproved
      ? finalPrice
      : 0
    : (firstInstallmentApproved ? r1Amount : 0) +
      (secondInstallmentPaid ? r2Amount : 0) +
      (thirdInstallmentPaid ? r3Amount : 0);

  const remainingEur = Math.max(0, finalPrice - totalPaidEur);

  const totalPaidRsd = isFull
    ? isFullPaymentPaid || firstInstallmentApproved
      ? candidate.fullPaymentPaidRsd || Math.round(finalPrice * (candidate.fullPaymentExchangeRate || currentNbsRate) * 100) / 100
      : 0
    : (firstInstallmentApproved
        ? candidate.firstInstallmentPaidRsd || Math.round(r1Amount * (candidate.firstInstallmentExchangeRate || currentNbsRate) * 100) / 100
        : 0) +
      (secondInstallmentPaid
        ? candidate.secondInstallmentPaidRsd || Math.round(r2Amount * (candidate.secondInstallmentExchangeRate || currentNbsRate) * 100) / 100
        : 0) +
      (thirdInstallmentPaid
        ? candidate.thirdInstallmentPaidRsd || Math.round(r3Amount * (candidate.thirdInstallmentExchangeRate || currentNbsRate) * 100) / 100
        : 0);

  const remainingRsd = Math.round(remainingEur * currentNbsRate * 100) / 100;

  // Navigacija dosijea: prvo put kandidata (koraci), pa trajni podaci dosijea.
  const tabs = [
    {
      group: "Put kandidata",
      id: "registration",
      label: "Ugovor i uplata",
      done: Boolean(contractApproved && firstInstallmentApproved),
      alert: Boolean((contractSigned && !contractApproved) || firstInstallmentStatus === "pending"),
    },
    {
      group: "Put kandidata",
      id: "step1_docs",
      label: "Dokumenta",
      done: Boolean(documentsApproved),
      alert: Boolean(
        !documentsApproved &&
          (documentsVerificationStatus === "pending" ||
            candidate.documentsSubmittedForReview ||
            (cvFileName && facultyCertFileName && policeCertificateFileName))
      ),
    },
    {
      group: "Put kandidata",
      id: "step2_job",
      label: "Posao i ponuda",
      done: Boolean((hasJob || selectedJobEmployer) && secondInstallmentPaid),
      alert: Boolean(
        interviewPrepStatus === "SCHEDULED" ||
          (secondInstallmentStatus === "pending" && !secondInstallmentPaid)
      ),
    },
    {
      group: "Put kandidata",
      id: "step3_visa",
      label: "Viza i polazak",
      done: Boolean(hasVisa),
      alert: Boolean(thirdInstallmentStatus === "pending" && !thirdInstallmentPaid),
    },
    { group: "Dosije", id: "profile", label: "Lični podaci i paket", done: false, alert: false },
    {
      group: "Dosije",
      id: "finances",
      label: "Finansije i KIR",
      count: candidateInvoices.length,
      done: remainingEur === 0,
      alert: false,
    },
    { group: "Dosije", id: "history", label: "Selekcija i beleške", done: false, alert: false },
  ];
  const activeTabInfo = tabs.find((x) => x.id === activeTab) || tabs[0];
  const currentStepIdx = Math.max(0, PIPELINE_STEPS.findIndex((x) => x.id === status));

  const initials = (firstName[0] || "") + (lastName[0] || "") || "AA";

  return (
    <Modal
      title={`Dosije kandidata: ${firstName} ${lastName}`.trim()}
      onClose={onClose}
      panel
      bodyClassName="flex min-h-0 flex-1 flex-col lg:flex-row"
      header={
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-ink">{initials}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold leading-tight text-ink">
                    {firstName} {lastName}
                  </h2>
                  {candidate.activationCode && (
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-2">{candidate.activationCode}</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13px] text-ink-3">
                  {[email, phone, faculty].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {currentFlow?.nextId ? (
                <button
                  type="button"
                  onClick={() => handleSelectStep(currentFlow.nextId)}
                  className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-950"
                >
                  {currentFlow.nextLabel}
                </button>
              ) : (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-100 px-4 text-[13px] font-semibold text-emerald-800">
                  <CheckIcon className="h-4 w-4" /> Viza odobrena, spreman za polazak
                </span>
              )}
            </div>
          </div>

          {/* Status kandidata: pet koraka kao jedna linija; klik pomera kandidata na taj korak */}
          <ol className="mt-4 flex items-center gap-1 overflow-x-auto pb-1" aria-label="Korak kandidata">
            {PIPELINE_STEPS.map((step, idx) => {
              const isCurrent = idx === currentStepIdx;
              const isPassed = idx < currentStepIdx;
              return (
                <li key={step.id} className="flex shrink-0 items-center gap-1">
                  {idx > 0 && <span className={`h-px w-4 sm:w-8 ${isPassed || isCurrent ? "bg-ink" : "bg-line-strong"}`} aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={() => handleSelectStep(step.id)}
                    aria-current={isCurrent ? "step" : undefined}
                    title="Postavi kandidata na ovaj korak"
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                      isCurrent
                        ? "bg-brand text-ink"
                        : isPassed
                        ? "text-ink hover:bg-surface"
                        : "text-ink-3 hover:bg-surface hover:text-ink"
                    }`}
                  >
                    {isPassed ? (
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${isCurrent ? "bg-ink text-brand" : "bg-surface-2 text-ink-3"}`}>{idx + 1}</span>
                    )}
                    {step.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      }
      footer={
        <>
          <p className="text-[13px] text-ink-2">
            <span className="font-semibold text-ink">{stepInfo.stepTitle}:</span> {stepInfo.subLabel}
          </p>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onClose}>{t("admin.modalCancel")}</SecondaryButton>
            <PrimaryButton onClick={handleSubmit}>Sačuvaj sve izmene</PrimaryButton>
          </div>
        </>
      }
    >
      {/* Leva navigacija dosijea */}
      <nav aria-label="Delovi dosijea" className="shrink-0 border-b border-line bg-surface lg:w-60 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="no-scrollbar flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-0 lg:p-3">
          {tabs.map((tab, i) => {
            const isActive = activeTab === tab.id;
            const newGroup = i === 0 || tabs[i - 1].group !== tab.group;
            return (
              <div key={tab.id} className="contents">
                {newGroup && (
                  <p className={`hidden px-3 pb-1.5 text-xs font-medium text-ink-3 lg:block ${i === 0 ? "pt-2" : "pt-5"}`}>{tab.group}</p>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive ? "bg-white font-semibold text-ink shadow-sm ring-1 ring-line" : "font-medium text-ink-2 hover:bg-white/70 hover:text-ink"
                  }`}
                >
                  <span className="whitespace-nowrap">
                    {tab.label}
                    {tab.count > 0 && <span className="ml-1.5 text-ink-3">{tab.count}</span>}
                  </span>
                  {tab.done ? (
                    <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : tab.alert ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Čeka tvoju akciju" />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-xl font-bold text-ink">{activeTabInfo.label}</h3>
          {activeTabInfo.alert && !activeTabInfo.done && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Čeka tvoju akciju
            </span>
          )}
        </div>

        {adminToast && (
          <div role="status" className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            <span>{adminToast}</span>
            <button type="button" onClick={() => setAdminToast("")} aria-label="Zatvori obaveštenje" className="ml-3 rounded p-1 text-emerald-800 hover:bg-emerald-100">
              <XIcon />
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 1: REGISTRACIJA & UGOVOR (Ugovor, Izjava, Pasoš, I rata)     */}
        {/* ================================================================ */}
        {activeTab === "registration" && (
          <div className="space-y-5">
            {/* 1. Verifikacija Ugovora i I rate (Glavni gate za prelazak u Korak 1) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Kartica Ugovora */}
              <div
                className={`rounded-xl border p-4 ${
                  contractApproved
                    ? "bg-emerald-50"
                    : contractVerificationStatus === "rejected"
                    ? "bg-red-50"
                    : "bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-ink-3">
                      Uslov 1 za otključavanje Koraka 1
                    </span>
                    <h4 className="text-sm font-semibold text-ink mt-0.5">
                      Ugovor o posredovanju i Izjava o odgovornosti
                    </h4>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      contractApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : contractVerificationStatus === "rejected"
                        ? "bg-red-100 text-red-700"
                        : contractSigned
                        ? "bg-amber-200 text-amber-950"
                        : "bg-surface-2 text-ink-3"
                    }`}
                  >
                    {contractApproved
                      ? "Odobren"
                      : contractVerificationStatus === "rejected"
                      ? "Vraćen"
                      : contractSigned
                      ? "Čeka pregled"
                      : "Nije otpremljen"}
                  </span>
                </div>

                {/* Fajl potpisanog ugovora */}
                <div className="mt-3 rounded-lg border border-line bg-white p-3">
                  {signedContractFileName ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">
                          {signedContractFileName}
                        </p>
                        <p className="text-xs text-ink-3">
                          Svojeručno potpisani primerak kandidata
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openDocumentPreview(
                            "Svojeručno potpisani ugovor kandidata",
                            signedContractFileName,
                            signedContractUrl,
                            signedContractDataUrl,
                            "contract"
                          )
                        }
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Otvori dokument
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-3">
                      Kandidat još nije otpremio sken potpisanog ugovora.
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
                    <label className="cursor-pointer rounded-full border border-line-strong bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-2">
                      {uploadingDocType === "signedContract" ? "Otpremanje..." : "Otpremi sken ugovora"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleAdminDocUpload(e.target.files?.[0], "signedContract")}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => openPrintableContractWindow({ id: candidate.id, email: email })}
                      className="rounded-full border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-2"
                    >
                      Otvori popunjen ugovor i izjavu za štampu
                    </button>
                  </div>
                </div>

                {contractRejectionReason && !contractApproved && (
                  <p className="mt-2 rounded-lg bg-red-100/70 px-2.5 py-1.5 text-xs font-medium text-red-900">
                    Razlog odbijanja: {contractRejectionReason}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyContractAction(true)}
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Odobri potpisani ugovor
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectionModal({
                        type: "contract",
                        title: "Odbijanje ugovora uz obrazloženje",
                        reason: contractRejectionReason || "",
                      })
                    }
                    className="rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Vrati na ponovno slanje
                  </button>
                </div>
              </div>

              {/* Kartica I rate ili Uplate u celosti */}
              <div
                className={`rounded-xl border p-4 flex flex-col justify-between ${
                  (isFull ? isFullPaymentPaid || firstInstallmentApproved : firstInstallmentApproved)
                    ? "bg-emerald-50"
                    : firstInstallmentStatus === "pending"
                    ? "bg-amber-50"
                    : "border-line bg-white"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-ink-3">
                        Uslov 2 za otključavanje Koraka 1
                      </span>
                      <h4 className="text-sm font-semibold text-ink mt-0.5">
                        {isFull
                          ? `Uplata programa u celosti (${finalPrice} € u RSD)`
                          : `Prva rata programa (${firstInstallmentAmount} € u RSD)`}
                      </h4>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        (isFull ? isFullPaymentPaid || firstInstallmentApproved : firstInstallmentApproved)
                          ? "bg-emerald-100 text-emerald-800"
                          : firstInstallmentStatus === "pending"
                          ? "bg-amber-200 text-amber-950"
                          : "bg-surface-2 text-ink-3"
                      }`}
                    >
                      {(isFull ? isFullPaymentPaid || firstInstallmentApproved : firstInstallmentApproved)
                        ? "Plaćeno"
                        : firstInstallmentStatus === "pending"
                        ? "Prijavljena uplata"
                        : "Nije plaćeno"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-ink-2 leading-relaxed">
                    {isFull
                      ? `Kandidat je odabrao jednokratno plaćanje programa u celosti (${finalPrice} € po kursu NBS). Potvrdom uplate i ugovora otključavaju se svi naredni koraci bez rata.`
                      : `Uplata I rate (${firstInstallmentAmount} € po srednjem kursu NBS) u roku od 7 dana od potpisivanja ugovora. Potvrdom uplate i ugovora kandidat prelazi na Korak 1: Dokumenta.`}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <select
                    value={(isFull ? isFullPaymentPaid || firstInstallmentApproved : firstInstallmentApproved) ? "paid" : firstInstallmentStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFirstInstallmentStatus(val);
                      setFirstInstallmentApproved(val === "paid");
                      if (isFull) setIsFullPaymentPaid(val === "paid");
                    }}
                    className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="unpaid">Nije uplaćeno</option>
                    <option value="pending">Uplata prijavljena (Na čekanju)</option>
                    <option value="paid">Potvrđeno / Plaćeno</option>
                  </select>

                  {!(isFull ? isFullPaymentPaid || firstInstallmentApproved : firstInstallmentApproved) && (
                    <button
                      type="button"
                      onClick={() => handleConfirmInstallmentAction(isFull ? "full" : 1)}
                      className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      {isFull
                        ? `Potvrdi uplatu u celosti (${finalPrice} €)`
                        : `Potvrdi uplatu I rate (${firstInstallmentAmount} €)`}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* TAB: LIČNI PODACI, PASOŠ, PAKET I JEMAC                         */}
        {/* ================================================================ */}
        {activeTab === "profile" && (
          <div className="space-y-5">
            {/* 2. Lični podaci i Pasoš */}
            <div className="rounded-xl border border-line bg-white p-4 space-y-4">
              <h4 className="text-[13px] font-bold text-ink-3">
                Lični, akademski i pasoški podaci kandidata
              </h4>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <Field label="Ime">
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FIELD_CLS} required />
                </Field>
                <Field label="Prezime">
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FIELD_CLS} required />
                </Field>
                <Field label="Email adresa">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD_CLS} required />
                </Field>
                <Field label="Broj telefona">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={FIELD_CLS} />
                </Field>
                <Field label="JMBG (13 cifara)">
                  <input value={jmbg} onChange={(e) => setJmbg(e.target.value)} maxLength={13} className={`${FIELD_CLS} tabular-nums`} />
                </Field>
                <Field label="Broj pasoša / lične karte">
                  <input value={passportNumber} onChange={(e) => { setPassportNumber(e.target.value); setIdCardNumber(e.target.value); }} className={`${FIELD_CLS} tabular-nums`} />
                </Field>
                <Field label="Datum rođenja (DD/MM/GGGG)">
                  <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={FIELD_CLS} />
                </Field>
                <Field label="Važenje pasoša (DD/MM/GGGG)">
                  <input value={passportExpiryDate} onChange={(e) => setPassportExpiryDate(e.target.value)} className={FIELD_CLS} />
                </Field>
                <Field label="Pol">
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={FIELD_CLS}>
                    <option value="Muški">Muški</option>
                    <option value="Ženski">Ženski</option>
                  </select>
                </Field>
                <Field label="Mesto rođenja">
                  <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} className={FIELD_CLS} />
                </Field>
                <Field label="Državljanstvo">
                  <input value={citizenship} onChange={(e) => setCitizenship(e.target.value)} className={FIELD_CLS} />
                </Field>
                <Field label="Adresa prebivališta">
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className={FIELD_CLS} />
                </Field>
                <Field label="Fakultet / Visoka škola">
                  <input value={faculty} onChange={(e) => setFaculty(e.target.value)} className={FIELD_CLS} />
                </Field>
                <Field label="Godina studija">
                  <select value={studyYear} onChange={(e) => setStudyYear(e.target.value)} className={FIELD_CLS}>
                    <option value="YEAR_1">I godina osnovnih studija</option>
                    <option value="YEAR_2">II godina osnovnih studija</option>
                    <option value="YEAR_3">III godina osnovnih studija</option>
                    <option value="YEAR_4">IV godina osnovnih studija</option>
                    <option value="MASTER">Master studije</option>
                  </select>
                </Field>
                <Field label="Ostvareni ESPB bodovi">
                  <input type="number" min="0" max="300" value={ectsPoints} onChange={(e) => setEctsPoints(e.target.value)} className={FIELD_CLS} />
                </Field>
              </div>

              {/* Sken pasoša */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Sken biometrijskog pasoša: {passportScanFileName || "Nije otpremljen"}
                  </p>
                  <p className="text-xs text-ink-3">
                    Potreban za tačno popunjavanje ugovora i DS-2019 obrasca
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(passportScanFileName || passportScanDataUrl || passportScanUrl) && (
                    <button
                      type="button"
                      onClick={() =>
                        openDocumentPreview(
                          "Sken biometrijskog pasoša",
                          passportScanFileName || "Pasos.pdf",
                          passportScanUrl,
                          passportScanDataUrl,
                          "passport"
                        )
                      }
                      className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Pregledaj pasoš
                    </button>
                  )}
                  <label className="cursor-pointer rounded-full border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2">
                    {uploadingDocType === "passport" ? "Otpremanje..." : "Otpremi pasoš"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleAdminDocUpload(e.target.files?.[0], "passport")}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Paket programa, popust i jemac */}
            <div className="rounded-xl border border-line bg-white p-4 space-y-4">
              <h4 className="text-[13px] font-bold text-ink-3">
                Paket programa, popust i model otplate III rate (PKZ / Jemac)
              </h4>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <Field label="Paket programa">
                  <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className={FIELD_CLS}>
                    {PROGRAM_PACKAGES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.basePrice} €)
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Promocija / Popust">
                  <select
                    value={discountId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiscountId(val);
                      if (val === "none") {
                        setDiscount(0);
                        setDiscountNote("");
                      } else {
                        const found = promotions.find((p) => p.id === val);
                        if (found) {
                          setDiscount(found.amount);
                          setDiscountNote(found.title);
                          setDiscountTiming(found.timing || "immediate");
                        }
                      }
                    }}
                    className={FIELD_CLS}
                  >
                    <option value="none">Bez promocije / Ručni unos</option>
                    {promotions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (-{p.amount} €)
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Iznos popusta (€)">
                  <input type="number" min="0" max={basePrice} value={discount} onChange={(e) => setDiscount(e.target.value)} className={FIELD_CLS} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Model plaćanja završne (III) rate">
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={FIELD_CLS}>
                    <option value="now">Standardno plaćanje (pre viziranja u celosti)</option>
                    <option value="installments">Plaćanje na rate / PKZ (uz jemca i 2 menice)</option>
                    <option value="later">Odloženo plaćanje u SAD — PKZ (uz jemca i 2 menice)</option>
                  </select>
                </Field>
                <Field label="Napomena o popustu">
                  <input value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} placeholder="npr. Rana prijava..." className={FIELD_CLS} />
                </Field>
              </div>

              {(paymentMethod === "later" || paymentMethod === "installments" || guarantorName) && (
                <div className="rounded-lg bg-amber-50 p-3.5 space-y-3">
                  <p className="text-xs font-semibold text-amber-950">
                    Podaci o jemcu i menicama (Obavezno za PKZ / odloženo plaćanje III rate)
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Ime i prezime jemca">
                      <input value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} className={FIELD_CLS} />
                    </Field>
                    <Field label="Broj lične karte jemca">
                      <input value={guarantorIdCard} onChange={(e) => setGuarantorIdCard(e.target.value)} className={FIELD_CLS} />
                    </Field>
                    <Field label="JMBG jemca">
                      <input value={guarantorJmbg} onChange={(e) => setGuarantorJmbg(e.target.value)} maxLength={13} className={`${FIELD_CLS} tabular-nums`} />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: KORAK 1 — PROFIL & DOKUMENTA (CV, Video, Uverenja)        */}
        {/* ================================================================ */}
        {activeTab === "step1_docs" && (
          <div className="space-y-5">
            {/* Gate za odobravanje kompletnog dosijea */}
            <div
              className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                documentsApproved
                  ? "bg-emerald-50"
                  : documentsVerificationStatus === "rejected"
                  ? "bg-red-50"
                  : "border-line bg-surface"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-ink">
                    Verifikacija kompletnog dosijea (Korak 1 &rarr; Korak 2)
                  </h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      documentsApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : documentsVerificationStatus === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-surface-2 text-ink"
                    }`}
                  >
                    {documentsApproved
                      ? "Dosije odobren"
                      : documentsVerificationStatus === "rejected"
                      ? "Vraćeno na dopunu"
                      : "Čeka verifikaciju"}
                  </span>
                </div>
                <p className="text-xs text-ink-2 mt-1">
                  Pregledajte CV, 60s video, uverenje sa fakulteta i uverenje iz MUP-a. Odobravanjem dosijea kandidat automatski prelazi na <strong>Korak 2: Posao i ponuda</strong>.
                </p>
                {documentsRejectionReason && !documentsApproved && (
                  <p className="mt-2 rounded-lg bg-red-100/80 px-3 py-1.5 text-xs font-semibold text-red-900">
                    Razlog vraćanja na dopunu: {documentsRejectionReason}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleVerifyDocumentsAction(true)}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Odobri dosije (Prebaci na Korak 2)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionModal({
                      type: "documents",
                      title: "Vraćanje dokumentacije na dopunu uz obrazloženje",
                      reason: documentsRejectionReason || "",
                    })
                  }
                  className="rounded-full border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Vrati na dopunu
                </button>
              </div>
            </div>

            {/* 1. CV Builder i Video prezentacija */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-ink-3">
                    1. CV Biografija i Studentski profil
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowProfileBuilder(true)}
                    className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-ink transition-colors hover:bg-brand-strong"
                  >
                    Otvori CV Builder
                  </button>
                </div>

                <div className="rounded-lg border border-line bg-surface p-3">
                  {cvFileName ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-ink">{cvFileName}</span>
                      {(cvDataUrl || cvUrl) && (
                        <button
                          type="button"
                          onClick={() =>
                            openDocumentPreview("CV Biografija", cvFileName, cvUrl, cvDataUrl, "documents")
                          }
                          className="rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Otvori CV
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-3">CV fajl još nije otpremljen.</p>
                  )}
                  <div className="mt-2 pt-2 border-t border-line">
                    <label className="cursor-pointer text-xs font-semibold text-ink hover:underline">
                      {uploadingDocType === "cv" ? "Otpremanje..." : "+ Otpremi novi CV fajl"}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => handleAdminDocUpload(e.target.files?.[0], "cv")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <h4 className="text-[13px] font-bold text-ink-3">
                  2. YouTube 60s Video Prezentacija
                </h4>
                <Field label="YouTube Unlisted/Public URL">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={FIELD_CLS}
                  />
                </Field>
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline"
                  >
                    ▶ Otvori video prezentaciju kandidata u novom prozoru &rarr;
                  </a>
                )}
              </div>
            </div>

            {/* 2. Uverenje sa fakulteta i Uverenje iz MUP-a */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Uverenje sa fakulteta */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-ink-3">
                    3. Uverenje sa fakulteta o studiranju
                  </h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      facultyCertFileName ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {facultyCertFileName ? "Otpremljeno" : "Nedostaje"}
                  </span>
                </div>

                <div className="rounded-lg border border-line bg-surface p-3">
                  {facultyCertFileName ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-ink">
                        {facultyCertFileName}
                      </span>
                      {(facultyCertDataUrl || facultyCertUrl) && (
                        <button
                          type="button"
                          onClick={() =>
                            openDocumentPreview(
                              "Uverenje sa fakulteta",
                              facultyCertFileName,
                              facultyCertUrl,
                              facultyCertDataUrl,
                              "documents"
                            )
                          }
                          className="rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Otvori
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-3">Uverenje sa fakulteta nije otpremljeno.</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
                    <label className="cursor-pointer text-xs font-semibold text-ink hover:underline">
                      {uploadingDocType === "facultyCert" ? "Otpremanje..." : "+ Otpremi uverenje"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleAdminDocUpload(e.target.files?.[0], "facultyCert")}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={facultyCertAiTranslation}
                        onChange={(e) => setFacultyCertAiTranslation(e.target.checked)}
                        className="h-3.5 w-3.5 rounded"
                      />
                      Sudski prevod spreman
                    </label>
                  </div>
                </div>
              </div>

              {/* Uverenje iz MUP-a */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-ink-3">
                    4. Uverenje iz MUP-a o nekažnjavanju
                  </h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      policeCertificateFileName ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {policeCertificateFileName ? "Otpremljeno" : "Nedostaje"}
                  </span>
                </div>

                <div className="rounded-lg border border-line bg-surface p-3">
                  {policeCertificateFileName ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-ink">
                        {policeCertificateFileName}
                      </span>
                      {(policeCertificateDataUrl || policeCertificateUrl) && (
                        <button
                          type="button"
                          onClick={() =>
                            openDocumentPreview(
                              "Uverenje iz MUP-a o nekažnjavanju",
                              policeCertificateFileName,
                              policeCertificateUrl,
                              policeCertificateDataUrl,
                              "documents"
                            )
                          }
                          className="rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Otvori
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-3">Uverenje iz MUP-a nije otpremljeno.</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
                    <label className="cursor-pointer text-xs font-semibold text-ink hover:underline">
                      {uploadingDocType === "policeCert" ? "Otpremanje..." : "+ Otpremi MUP uverenje"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleAdminDocUpload(e.target.files?.[0], "policeCert")}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policeCertificateTranslated}
                        onChange={(e) => setPoliceCertificateTranslated(e.target.checked)}
                        className="h-3.5 w-3.5 rounded"
                      />
                      Sudski prevod spreman
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: KORAK 2 — POSAO & PONUDA (Priprema, Job Offer, II rata)   */}
        {/* ================================================================ */}
        {activeTab === "step2_job" && (() => {
          const allCatalogJobs = getJobs();
          const offeredCount = offerAllJobs ? allCatalogJobs.length : offeredJobIds.length;

          const toggleJobOffer = (jobId) => {
            setOfferedJobIds((prev) =>
              prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
            );
          };

          return (
            <div className="space-y-5">
              {/* 1. Dodeljivanje ponude poslova iz Baze poslova */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-xs font-bold text-ink-3">
                      Korak 2.1 — Ponuda radnih mesta za ovog kandidata
                    </span>
                    <h4 className="text-sm font-semibold text-ink">
                      Dodeljivanje poslova iz Baze poslova
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-surface border border-line px-3 py-1 text-xs font-medium text-ink">
                      Kandidatu ponuđeno: {offeredCount} poslova
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={offerAllJobs}
                        onChange={(e) => setOfferAllJobs(e.target.checked)}
                        className="h-4 w-4 rounded"
                      />
                      <span>Ponudi sve poslove iz Baze poslova (podrazumevano)</span>
                    </label>

                    {!offerAllJobs && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOfferedJobIds(allCatalogJobs.map((j) => j.id))}
                          className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-2"
                        >
                          Označi sve
                        </button>
                        <button
                          type="button"
                          onClick={() => setOfferedJobIds([])}
                          className="rounded-full border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-surface-2"
                        >
                          Poništi sve
                        </button>
                      </div>
                    )}
                  </div>

                  {!offerAllJobs && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 border border-line rounded-xl bg-surface">
                      {allCatalogJobs.map((job) => {
                        const isOffered = offeredJobIds.includes(job.id);
                        return (
                          <div
                            key={job.id}
                            onClick={() => toggleJobOffer(job.id)}
                            className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs transition-colors ${
                              isOffered
                                ? "border-line-strong bg-surface"
                                : "border-line bg-white hover:border-line-strong"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isOffered}
                              onChange={() => {}}
                              className="mt-0.5 h-4 w-4 rounded"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-ink truncate">{job.title}</p>
                              <p className="text-xs text-ink-2 truncate">{job.employer} • {job.city}</p>
                              <p className="text-2xs font-semibold text-amber-900 mt-0.5">{job.wage}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Izbor kandidata & Upravljanje tokom intervjua sa poslodavcem */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-xs font-bold text-ink-3">
                      Korak 2.2 — Izbor kandidata & Intervju sa poslodavcem
                    </span>
                    <h4 className="text-sm font-semibold text-ink">
                      Status razgovora za posao i radne ponude
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        jobApplicationStatus === "ACCEPTED" || (hasJob && !["SCHEDULED", "APPLIED", "NO_SLOTS", "REJECTED"].includes(jobApplicationStatus))
                          ? "bg-emerald-100 text-emerald-800"
                          : jobApplicationStatus === "SCHEDULED"
                          ? "bg-surface-2 text-ink"
                          : jobApplicationStatus === "APPLIED"
                          ? "bg-amber-100 text-amber-800"
                          : jobApplicationStatus === "NO_SLOTS" || jobApplicationStatus === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-surface-2 text-ink-3"
                      }`}
                    >
                      {jobApplicationStatus === "ACCEPTED" || (hasJob && !["SCHEDULED", "APPLIED", "NO_SLOTS", "REJECTED"].includes(jobApplicationStatus))
                        ? "Job Offer obezbeđen (Prihvaćen)"
                        : jobApplicationStatus === "SCHEDULED"
                        ? "Intervju zakazan"
                        : jobApplicationStatus === "APPLIED"
                        ? "Kandidat poslao prijavu (Čeka termin)"
                        : jobApplicationStatus === "NO_SLOTS"
                        ? "Nema slobodnih termina"
                        : jobApplicationStatus === "REJECTED"
                        ? "Poslodavac odbio kandidata"
                        : "Nije izabran posao"}
                    </span>
                  </div>
                </div>

                {/* Brzi izbor ili izmena posla iz kataloga */}
                <Field label="Izabrana radna pozicija (automatski popunjeno na osnovu izbora kandidata ili ručno dodeljeno)">
                  <select
                    value=""
                    onChange={(e) => {
                      const job = allCatalogJobs.find((j) => String(j.id) === String(e.target.value));
                      if (job) {
                        setSelectedJobTitle(job.title);
                        setSelectedJobEmployer(job.employer);
                        setSelectedJobCity(job.city);
                        setSelectedJobWage(job.wage);
                        setSelectedJobHousing(job.housing);
                        setJobApplicationStatus("APPLIED");
                      }
                    }}
                    className={FIELD_CLS}
                  >
                    <option value="">-- Dodelite ili promenite posao iz baze poslova --</option>
                    {allCatalogJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.employer} — {j.title} ({j.city} • {j.wage})
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Naziv poslodavca (Kompanija)">
                    <input
                      value={selectedJobEmployer}
                      onChange={(e) => setSelectedJobEmployer(e.target.value)}
                      placeholder="npr. Grand Hotel Mackinac"
                      className={FIELD_CLS}
                    />
                  </Field>
                  <Field label="Radna pozicija (Job Title)">
                    <input
                      value={selectedJobTitle}
                      onChange={(e) => setSelectedJobTitle(e.target.value)}
                      placeholder="npr. Spasilac na bazenu / Server"
                      className={FIELD_CLS}
                    />
                  </Field>
                  <Field label="Grad i američka država">
                    <input
                      value={selectedJobCity}
                      onChange={(e) => setSelectedJobCity(e.target.value)}
                      placeholder="npr. Ocean City, MD"
                      className={FIELD_CLS}
                    />
                  </Field>
                  <Field label="Satnica (USD/h)">
                    <input
                      value={selectedJobWage}
                      onChange={(e) => setSelectedJobWage(e.target.value)}
                      placeholder="npr. $16.50 / sat"
                      className={FIELD_CLS}
                    />
                  </Field>
                  <Field label="Smeštaj (Housing)">
                    <input
                      value={selectedJobHousing}
                      onChange={(e) => setSelectedJobHousing(e.target.value)}
                      placeholder="npr. Obezbeđen smeštaj ($110/ned)"
                      className={FIELD_CLS}
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasJob}
                        onChange={(e) => {
                          setHasJob(e.target.checked);
                          if (e.target.checked) setJobApplicationStatus("ACCEPTED");
                        }}
                        className="h-4 w-4 rounded"
                      />
                      Potvrđen Job Offer (Posao obezbeđen)
                    </label>
                  </div>
                </div>

                {/* Sekcija: Upravljanje tokom intervjua i realnim ishodima */}
                <div className="rounded-2xl border border-line bg-white p-5 space-y-3 sm:p-6">
                  <h5 className="text-[13px] font-bold text-ink-2">
                    Upravljanje terminom i ishodom razgovora sa poslodavcem
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Termin intervjua (Datum i vreme)">
                      <input
                        type="datetime-local"
                        value={interviewScheduledAt}
                        onChange={(e) => setInterviewScheduledAt(e.target.value)}
                        className={FIELD_CLS}
                      />
                    </Field>
                    <Field label="Format razgovora">
                      <select
                        value={interviewType}
                        onChange={(e) => setInterviewType(e.target.value)}
                        className={FIELD_CLS}
                      >
                        <option value="ONLINE">Online (Google Meet / Zoom)</option>
                        <option value="IN_PERSON">Uživo u agenciji / hotelu</option>
                      </select>
                    </Field>
                    <Field label="Link za pristup ili adresa">
                      <input
                        value={interviewLink}
                        onChange={(e) => setInterviewLink(e.target.value)}
                        placeholder="https://meet.google.com/... ili adresa"
                        className={FIELD_CLS}
                      />
                    </Field>
                  </div>

                  <Field label="Napomena / Poruka kandidatu (Instrukcije za intervju, razlog odbijanja ili obaveštenje o terminima)">
                    <input
                      value={interviewNote}
                      onChange={(e) => setInterviewNote(e.target.value)}
                      placeholder="npr. Poslodavac trenutno nema slobodnih termina / Pripremite nivo engleskog..."
                      className={FIELD_CLS}
                    />
                  </Field>

                  {/* Dugmad za promenu statusa (Dvosmerni realni slučajevi sa instant čuvanjem) */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
                    <button
                      type="button"
                      onClick={() => {
                        if (!interviewScheduledAt) {
                          alert("Molimo unesite datum i vreme intervjua.");
                          return;
                        }
                        setJobApplicationStatus("SCHEDULED");
                        setHasJob(false);
                        const updated = buildUpdatedCandidate({
                          jobApplicationStatus: "SCHEDULED",
                          interviewScheduledAt,
                          interviewType,
                          interviewLink,
                          interviewNote,
                          hasJob: false,
                        });
                        onSave(updated, { keepOpen: true });
                        setAdminToast("Termin intervjua je uspešno zakazan i sačuvan.");
                        setTimeout(() => setAdminToast(""), 4000);
                      }}
                      className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-950"
                    >
                      Zakaži termin intervjua
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const note = interviewNote || "Poslodavac trenutno nema slobodnih termina za razgovor za ovu poziciju. Molimo odaberite drugu opciju iz baze poslova.";
                        setJobApplicationStatus("NO_SLOTS");
                        setHasJob(false);
                        if (!interviewNote) setInterviewNote(note);
                        const updated = buildUpdatedCandidate({
                          jobApplicationStatus: "NO_SLOTS",
                          interviewNote: note,
                          hasJob: false,
                        });
                        onSave(updated, { keepOpen: true });
                        setAdminToast("Evidentirano da nema termina. Obaveštenje je poslato kandidatu.");
                        setTimeout(() => setAdminToast(""), 4000);
                      }}
                      className="rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                    >
                      Nema slobodnih termina
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const note = interviewNote || "Poslodavac nije prihvatio kandidata nakon razgovora. Molimo izaberite novu ponudu iz baze.";
                        setJobApplicationStatus("REJECTED");
                        setHasJob(false);
                        if (!interviewNote) setInterviewNote(note);
                        const updated = buildUpdatedCandidate({
                          jobApplicationStatus: "REJECTED",
                          interviewNote: note,
                          hasJob: false,
                        });
                        onSave(updated, { keepOpen: true });
                        setAdminToast("Evidentirano da je poslodavac odbio kandidata. Otključan novi izbor posla.");
                        setTimeout(() => setAdminToast(""), 4000);
                      }}
                      className="rounded-full bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100"
                    >
                      Poslodavac odbio kandidata
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setJobApplicationStatus("ACCEPTED");
                        setHasJob(true);
                        const updated = buildUpdatedCandidate({
                          jobApplicationStatus: "ACCEPTED",
                          hasJob: true,
                        });
                        onSave(updated, { keepOpen: true });
                        setAdminToast("Poslodavac je prihvatio kandidata. Job Offer je obezbeđen!");
                        setTimeout(() => setAdminToast(""), 4000);
                      }}
                      className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Poslodavac prihvatio (Job Offer)
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Druga rata programa (400 EUR) */}
              <div
                className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                  secondInstallmentPaid
                    ? "bg-emerald-50"
                    : secondInstallmentStatus === "pending"
                    ? "bg-amber-50"
                    : "border-line bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-ink">
                      {isFull
                        ? "Uplata programa u celosti"
                        : `Druga rata programa (${secondInstallmentAmount} EUR u RSD)`}
                    </h4>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        (isFull ? isFullPaymentPaid || secondInstallmentPaid : secondInstallmentPaid)
                          ? "bg-emerald-100 text-emerald-800"
                          : secondInstallmentStatus === "pending"
                          ? "bg-amber-200 text-amber-950"
                          : "bg-surface-2 text-ink-3"
                      }`}
                    >
                      {isFull
                        ? "Program uplaćen u celosti"
                        : secondInstallmentPaid
                        ? "II rata plaćena"
                        : secondInstallmentStatus === "pending"
                        ? "Prijavljena uplata"
                        : "Nije plaćeno"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3 mt-1">
                    {isFull
                      ? "Kandidat nema obavezu plaćanja II rate jer je program plaćen u celosti."
                      : "Uplaćuje se po obezbeđivanju radne ponude (potpisan Job Offer)."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isFull && !secondInstallmentPaid && (
                    <button
                      type="button"
                      onClick={() => handleConfirmInstallmentAction(2)}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Proknjiži II ratu ({secondInstallmentAmount} EUR)
                    </button>
                  )}
                  {(isFull || secondInstallmentPaid) && (
                    <span className="text-xs font-semibold text-emerald-800">
                      {isFull ? "Program je uplaćen u celosti" : "Uplata II rate je proknjižena"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ================================================================ */}
        {/* TAB 4: KORAK 3 — VIZA & POLAZAK (DS-2019, DS-160, Ambasada, Let) */}
        {/* ================================================================ */}
        {activeTab === "step3_visa" && (
          <div className="space-y-5">
            {/* Glavni status J-1 Vize */}
            <div
              className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                hasVisa
                  ? "bg-emerald-50"
                  : "border-line bg-surface"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-ink">
                    Status J-1 Vize i spremnosti za polazak u SAD
                  </h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      hasVisa ? "bg-emerald-200 text-emerald-950" : "bg-surface-2 text-ink"
                    }`}
                  >
                    {hasVisa ? "Viza odobrena • Spreman za polazak" : "Čekanje na vizu"}
                  </span>
                </div>
                <p className="text-xs text-ink-2 mt-1">
                  Nakon uspešnog intervjua u Ambasadi SAD u Beogradu, potvrdite odobrenu J-1 vizu kako bi kandidat dobio status <strong>Viza odobrena / Spreman za polazak</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!hasVisa ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHasVisa(true);
                      setStatus("ready");
                      const updated = buildUpdatedCandidate({ hasVisa: true, status: "ready" });
                      onSave(updated, { keepOpen: true });
                      showToast("J-1 Viza je potvrđena! Kandidat ima status: Viza odobrena / Spreman za polazak.");
                    }}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Potvrdi ODOBRENU J-1 Vizu
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHasVisa(false);
                      setStatus("departure");
                      const updated = buildUpdatedCandidate({ hasVisa: false, status: "departure" });
                      onSave(updated, { keepOpen: true });
                      showToast("Status vraćen na: Čekanje na vizu.");
                    }}
                    className="rounded-full border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
                  >
                    Vrati na "Čekanje na vizu"
                  </button>
                )}
              </div>
            </div>

            {/* 1. DS-2019, Ambasada termin i III rata */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <h4 className="text-[13px] font-bold text-ink-3">
                  1. DS-2019 Obrazac i Termin u Ambasadi SAD
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Status DS-2019 formulara">
                    <select value={ds2019Status} onChange={(e) => setDs2019Status(e.target.value)} className={FIELD_CLS}>
                      <option value="LOCKED">Čeka II ratu</option>
                      <option value="IN_PROGRESS">U izradi kod US sponzora</option>
                      <option value="ISSUED">Izdat i spreman (SEVIS aktivan)</option>
                    </select>
                  </Field>
                  <Field label="SEVIS / DS-2019 broj">
                    <input value={ds2019Number} onChange={(e) => setDs2019Number(e.target.value)} placeholder="npr. N0012345678" className={`${FIELD_CLS} tabular-nums`} />
                  </Field>
                  <Field label="Datum i vreme intervjua u Ambasadi">
                    <input type="datetime-local" value={embassyInterviewDate} onChange={(e) => setEmbassyInterviewDate(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="Priprema za Ambasadu">
                    <select value={embassyPrepStatus} onChange={(e) => setEmbassyPrepStatus(e.target.value)} className={FIELD_CLS}>
                      <option value="NOT_SCHEDULED">Nije održana</option>
                      <option value="SCHEDULED">Zakazana priprema</option>
                      <option value="COMPLETED">Održana priprema za vizu</option>
                    </select>
                  </Field>
                </div>
                <div className="pt-1">
                  <a
                    href="/documents/Uplatnica_viziranje.docx"
                    download="Uplatnica_viziranje.docx"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline"
                  >
                    Preuzmi zvaničnu uplatnicu za viziranje (.docx) &rarr;
                  </a>
                </div>
              </div>

              {/* III rata i Avio karta / Orijentacija */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <h4 className="text-[13px] font-bold text-ink-3">
                  {isFull
                    ? "2. Završna rata — Plaćeno u celosti, Avio karta i Orijentacija"
                    : `2. Završna (III) rata (${thirdInstallmentAmount} €), Avio karta i Orijentacija`}
                </h4>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3">
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      {isFull
                        ? "Program je uplaćen u celosti prilikom registracije"
                        : `III rata (${thirdInstallmentAmount} €) — ${paymentMethod === "now" ? "Standardno" : "PKZ / Rate"}`}
                    </p>
                    <p className="text-xs text-ink-3">
                      Status: {isFull || thirdInstallmentPaid ? "Plaćeno u celosti" : thirdInstallmentStatus === "pending" ? "Prijavljena uplata" : "Čeka uplatu / PKZ"}
                    </p>
                  </div>
                  {!isFull && !thirdInstallmentPaid && (
                    <button
                      type="button"
                      onClick={() => handleConfirmInstallmentAction(3)}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Potvrdi III ratu ({thirdInstallmentAmount} €)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Datum leta (Polazak u SAD)">
                    <input type="date" value={flightDepartureDate} onChange={(e) => setFlightDepartureDate(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="Datum povratka iz SAD">
                    <input type="date" value={flightReturnDate} onChange={(e) => setFlightReturnDate(e.target.value)} className={FIELD_CLS} />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orientationAttended}
                      onChange={(e) => setOrientationAttended(e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    Održana obavezna orijentacija pred put
                  </label>
                  <a
                    href="/documents/Narudzbenica-avio-karte.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-ink hover:underline"
                  >
                    Narudžbenica avio karte
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Pregled DS-160 upitnika */}
            <div className="rounded-xl border border-line bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-bold text-ink-3">
                    3. Odgovori kandidata iz DS-160 viza upitnika
                  </h4>
                  {(() => {
                    const st = getDs160Status(candidate.ds160);
                    if (st.isComplete) {
                      return (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-medium">
                          Kompletiran (svih 17 polja)
                        </span>
                      );
                    }
                    if (st.isStarted) {
                      return (
                        <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-medium">
                          U izradi ({st.filledCount}/{st.totalCount} polja)
                        </span>
                      );
                    }
                    return (
                      <span className="rounded-full bg-surface-2 text-ink-3 px-3 py-1 text-xs font-medium">
                        Nije popunjavano
                      </span>
                    );
                  })()}
                </div>
                <a
                  href="/documents/UPITNIK_za_izradu_DS160_J1.docx"
                  download="UPITNIK_za_izradu_DS160_J1.docx"
                  className="text-xs font-semibold text-ink hover:underline"
                >
                  Preuzmi prazan DS-160 obrazac (.docx)
                </a>
              </div>

              {ds160Entries.length === 0 ? (
                <p className="text-xs text-ink-3 py-3">
                  Kandidat još uvek nije sačuvao odgovore u DS-160 upitniku na svom Dashboard-u.
                </p>
              ) : (
                <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 md:grid-cols-3 pr-1">
                  {ds160Entries.map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-line bg-surface px-3 py-2">
                      <p className="text-xs font-semibold text-ink-3">{k}</p>
                      <p className="text-xs font-semibold text-ink break-words mt-0.5">{String(v || "—")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 5: FINANSIJE, DINAMIČKE RATE & KIR FAKTURE                  */}
        {/* ================================================================ */}
        {activeTab === "finances" && (
          <div className="space-y-4">
            {/* Finansijski bilans u EUR i RSD */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-xs font-semibold text-ink-3">Cena paketa</p>
                <p className="text-base sm:text-lg font-bold text-ink mt-0.5">{formatEur(basePrice)}</p>
                <p className="text-xs font-semibold text-ink-3 mt-0.5">{formatRsd(basePrice * currentNbsRate)}</p>
              </div>
              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-xs font-semibold text-ink-3">Popust</p>
                <p className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5">-{formatEur(numDiscount)}</p>
                <p className="text-xs font-semibold text-emerald-800/80 mt-0.5">-{formatRsd(numDiscount * currentNbsRate)}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                <p className="text-xs font-semibold text-ink">Za uplatu</p>
                <p className="text-base sm:text-lg font-bold text-ink mt-0.5">{formatEur(finalPrice)}</p>
                <p className="text-xs font-semibold text-ink mt-0.5">{formatRsd(finalPrice * currentNbsRate)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-900/60">Ukupno uplaćeno</p>
                <p className="text-base sm:text-lg font-bold text-emerald-800 mt-0.5">{formatEur(totalPaidEur)}</p>
                <p className="text-xs font-bold text-emerald-900 mt-0.5">{formatRsd(totalPaidRsd)}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold text-amber-900/60">Preostali dug</p>
                <p className="text-base sm:text-lg font-bold text-amber-900 mt-0.5">{formatEur(remainingEur)}</p>
                <p className="text-xs font-semibold text-amber-800 mt-0.5">{formatRsd(remainingRsd)}</p>
              </div>
            </div>

            {/* Podešavanje modela plaćanja i dinamičkih iznosa rata */}
            <div className="rounded-xl border border-line bg-white p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className="text-[13px] font-bold text-ink-2">
                    Podešavanje plana plaćanja i iznosa rata
                  </h4>
                  <p className="text-xs text-ink-3 mt-0.5">
                    Administrator može dinamički prilagoditi iznose pojedinačnih rata za ovog kandidata.
                  </p>
                </div>
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2">
                  Srednji kurs NBS: <strong className="tabular-nums text-ink">{Number(currentNbsRate).toFixed(4)} RSD</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 items-end">
                <Field label="Model plaćanja">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={FIELD_CLS}
                  >
                    <option value="now">Jednokratno — Uplata u celosti (odmah)</option>
                    <option value="installments">Plaćanje u ratama (I, II i III rata)</option>
                    <option value="later">PKZ — Plaćanje kroz zaradu u SAD</option>
                  </select>
                </Field>

                {paymentMethod !== "now" ? (
                  <>
                    <Field label="I rata (EUR)">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={firstInstallmentAmount}
                        onChange={(e) => setFirstInstallmentAmount(Number(e.target.value) || 0)}
                        className={FIELD_CLS}
                      />
                    </Field>
                    <Field label="II rata (EUR)">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={secondInstallmentAmount}
                        onChange={(e) => setSecondInstallmentAmount(Number(e.target.value) || 0)}
                        className={FIELD_CLS}
                      />
                    </Field>
                    <Field label="III rata (EUR)">
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={thirdInstallmentAmount}
                          onChange={(e) => setThirdInstallmentAmount(Number(e.target.value) || 0)}
                          className={FIELD_CLS}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const balanced = Math.max(0, finalPrice - Number(firstInstallmentAmount || 0) - Number(secondInstallmentAmount || 0));
                            setThirdInstallmentAmount(balanced);
                            showToast(`III rata je automatski uravnotežena na ${balanced} € kako bi zbir odgovarao ceni programa.`);
                          }}
                          title="Automatski proračunaj III ratu"
                          className="rounded-lg bg-surface-2 hover:bg-neutral-200 border border-line-strong px-2 text-xs font-semibold text-ink whitespace-nowrap"
                        >
                          Auto
                        </button>
                      </div>
                    </Field>
                  </>
                ) : (
                  <div className="sm:col-span-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-950">
                    <p className="font-semibold">Jednokratna uplata programa u celosti</p>
                    <p className="text-xs text-emerald-900/80 mt-0.5">
                      Kandidat plaća celokupan iznos odjednom ({formatEur(finalPrice)} / {formatRsd(finalPrice * currentNbsRate)}). Nema pojedinačnih podela na II i III ratu.
                    </p>
                  </div>
                )}
              </div>

              {paymentMethod !== "now" && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-2">Zbir rata:</span>
                    <strong className="font-semibold text-ink">
                      {formatEur(firstInstallmentAmount + secondInstallmentAmount + thirdInstallmentAmount)}
                    </strong>
                    {firstInstallmentAmount + secondInstallmentAmount + thirdInstallmentAmount === finalPrice ? (
                      <span className="text-emerald-700 font-semibold">(Zbir u potpunosti odgovara ceni programa)</span>
                    ) : (
                      <span className="text-amber-800 font-semibold">
                        (Razlika u odnosu na cenu paketa: {formatEur(finalPrice - (firstInstallmentAmount + secondInstallmentAmount + thirdInstallmentAmount))})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Prikaz kartica: Jednokratno ili 3 rate */}
            {paymentMethod === "now" ? (
              <div className={`rounded-xl border p-4 ${isFullPaymentPaid || firstInstallmentApproved ? "bg-emerald-50" : "border-line bg-white"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-ink-3">
                      Jednokratno plaćanje
                    </span>
                    <h4 className="text-sm font-semibold text-ink mt-0.5">
                      Uplata programa u celosti
                    </h4>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isFullPaymentPaid || firstInstallmentApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : firstInstallmentStatus === "pending"
                        ? "bg-amber-200 text-amber-950"
                        : "bg-surface-2 text-ink-3"
                    }`}
                  >
                    {isFullPaymentPaid || firstInstallmentApproved
                      ? "Plaćeno u celosti"
                      : firstInstallmentStatus === "pending"
                      ? "Prijavljena uplata"
                      : "Čeka uplatu"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <span className="text-xs font-semibold text-ink-3">Iznos u devizama</span>
                    <p className="text-lg font-bold text-ink mt-0.5">{formatEur(finalPrice)}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <span className="text-xs font-semibold text-ink-3">
                      {candidate.fullPaymentPaidRsd ? "Zaključan dinarski iznos (RSD)" : "Dinarska protivvrednost (RSD)"}
                    </span>
                    <p className="text-lg font-bold text-ink mt-0.5">
                      {formatRsd(
                        candidate.fullPaymentPaidRsd ||
                          Math.round(finalPrice * (candidate.fullPaymentExchangeRate || currentNbsRate) * 100) / 100
                      )}
                    </p>
                  </div>
                </div>

                {candidate.fullPaymentPaidRsd ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-2.5 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        Plaćeno dana: {candidate.fullPaymentPaidDate || "—"} • Primenjeni kurs NBS: {Number(candidate.fullPaymentExchangeRate || currentNbsRate).toFixed(4)} RSD
                      </p>
                      <p className="text-xs text-emerald-900/80 mt-0.5">
                        Dinarski iznos je trajno evidentiran i fiksiran na dan knjiženja uplate.
                      </p>
                    </div>
                    <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-2xs font-semibold">
                      Evidentirano u KIR
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-line">
                    <p className="text-xs text-ink-2">
                      Obračunato po današnjem srednjem kursu NBS: <strong>{Number(currentNbsRate).toFixed(4)} RSD</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => handleConfirmInstallmentAction("full")}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Proknjiži uplatu u celosti ({formatEur(finalPrice)})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    num: 1,
                    title: "I rata (Registracija & Ugovor)",
                    eur: r1Amount,
                    paid: firstInstallmentApproved,
                    status: firstInstallmentStatus,
                    paidRsd: candidate.firstInstallmentPaidRsd,
                    rate: candidate.firstInstallmentExchangeRate,
                    paidDate: candidate.firstInstallmentPaidDate,
                  },
                  {
                    num: 2,
                    title: "II rata (Job Offer)",
                    eur: r2Amount,
                    paid: secondInstallmentPaid,
                    status: secondInstallmentStatus,
                    paidRsd: candidate.secondInstallmentPaidRsd,
                    rate: candidate.secondInstallmentExchangeRate,
                    paidDate: candidate.secondInstallmentPaidDate,
                  },
                  {
                    num: 3,
                    title: "III rata (Pred vizu / PKZ)",
                    eur: r3Amount,
                    paid: thirdInstallmentPaid,
                    status: thirdInstallmentStatus,
                    paidRsd: candidate.thirdInstallmentPaidRsd,
                    rate: candidate.thirdInstallmentExchangeRate,
                    paidDate: candidate.thirdInstallmentPaidDate,
                  },
                ].map((r) => {
                  const calculatedRsd = Math.round(r.eur * currentNbsRate * 100) / 100;
                  const displayRsd = r.paid && r.paidRsd ? r.paidRsd : calculatedRsd;
                  const displayRate = r.paid && r.rate ? r.rate : currentNbsRate;

                  return (
                    <div
                      key={r.num}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between ${
                        r.paid ? "bg-emerald-50" : "border-line bg-white"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">{r.title}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              r.paid
                                ? "bg-emerald-100 text-emerald-800"
                                : r.status === "pending"
                                ? "bg-amber-200 text-amber-900"
                                : "bg-surface-2 text-ink-3"
                            }`}
                          >
                            {r.paid ? "Plaćeno" : r.status === "pending" ? "Prijavljeno" : "Nije plaćeno"}
                          </span>
                        </div>

                        <div>
                          <p className="text-lg font-bold text-ink">{formatEur(r.eur)}</p>
                          <p className="text-xs font-semibold text-ink-2 mt-0.5">
                            = {formatRsd(displayRsd)}
                          </p>
                        </div>

                        {r.paid && (
                          <div className="rounded-lg border border-emerald-200 bg-white p-2 text-2xs text-emerald-950 space-y-0.5">
                            <p className="font-semibold">
                              Proknjiženo: {r.paidDate || "—"}
                            </p>
                            <p className="text-ink-2">
                              Kurs NBS: {Number(displayRate).toFixed(4)} RSD
                            </p>
                            <p className="text-2xs font-semibold text-emerald-800">
                              Zaključan dinarski iznos
                            </p>
                          </div>
                        )}

                        {!r.paid && (
                          <p className="text-2xs text-ink-3">
                            Obračun po kursu: {Number(currentNbsRate).toFixed(4)} RSD
                          </p>
                        )}
                      </div>

                      {!r.paid && (
                        <button
                          type="button"
                          onClick={() => handleConfirmInstallmentAction(r.num)}
                          className="mt-3 w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Proknjiži {r.num}. ratu ({formatEur(r.eur)})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Garancija kursa obaveštenje */}
            <div className="rounded-xl border border-line bg-neutral-50/70 p-3 text-xs text-ink-2">
              <p className="font-semibold text-ink">
                Pravilo deviznog obračuna i evidencije uplata (NBS):
              </p>
              <p className="text-xs text-ink-2 mt-0.5">
                Kada kandidat uplati i administrator proknjiži ratu (ili iznos u celosti), sistem u dosijeu i KIR fakturi trajno čuva tačan datum, primenjeni srednji kurs NBS na taj dan i uplaćeni dinarski iznos. Promene kursa nakon datuma uplate ne menjaju proknjiženi dinarski iznos.
              </p>
            </div>

            {/* KIR Fakture */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5">
              <div>
                <p className="text-xs font-semibold text-ink">Knjiga izdatih računa (KIR) za ovog kandidata</p>
                <p className="text-xs text-ink-3">
                  Svaka potvrda rate automatski kreira račun u KIR-u. Možete izdati i dodatni račun ručno.
                </p>
              </div>
              <PrimaryButton onClick={() => setShowCreateInvoiceModal(true)}>
                <PlusIcon className="h-4 w-4" /> Izradite novu fakturu
              </PrimaryButton>
            </div>

            {candidateInvoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong py-8 text-center text-xs text-ink-3">
                Nema evidentiranih KIR računa za ovog kandidata.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-surface text-xs font-semibold text-ink-3">
                      <th className="px-3.5 py-2.5">Broj fakture</th>
                      <th className="px-3.5 py-2.5">Svrha</th>
                      <th className="px-3.5 py-2.5 text-right">EUR</th>
                      <th className="px-3.5 py-2.5 text-right">RSD</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs">
                    {candidateInvoices.map((inv) => {
                      const st = PAYMENT_STATUSES[inv.status] || PAYMENT_STATUSES.PENDING;
                      return (
                        <tr key={inv.id}>
                          <td className="px-3.5 py-2.5 tabular-nums font-semibold">{inv.invoiceNumber}</td>
                          <td className="px-3.5 py-2.5">{inv.purpose}</td>
                          <td className="px-3.5 py-2.5 text-right font-semibold">{inv.originalAmount.toFixed(2)} {inv.currency}</td>
                          <td className="px-3.5 py-2.5 text-right font-bold">{formatRsd(inv.totalRsd)}</td>
                          <td className="px-3.5 py-2.5">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${st.badgeCls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateInvoiceStatus(inv.id, "PAID");
                                  refreshCandidateInvoices();
                                }}
                                className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Proknjiži
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 6: SELEKCIJA (FAZA 0) & INTERNE BELEŠKE                      */}
        {/* ================================================================ */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-white p-4 space-y-3.5">
              <h4 className="text-[13px] font-bold text-ink-3">
                Podaci iz Faze 0 (Inicijalna prijava, trijaža i konsultacije)
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Status prvog kontakta">
                  <select value={contactStatus} onChange={(e) => setContactStatus(e.target.value)} className={FIELD_CLS}>
                    <option value="NOT_ATTEMPTED">Nije pozvan</option>
                    <option value="REACHED">Razgovor obavljen</option>
                    <option value="NO_ANSWER">Nije se javio</option>
                  </select>
                </Field>
                <Field label="Status konsultacija">
                  <select value={consultationStatus} onChange={(e) => setConsultationStatus(e.target.value)} className={FIELD_CLS}>
                    <option value="NOT_SCHEDULED">Nisu zakazane</option>
                    <option value="SCHEDULED">Zakazane</option>
                    <option value="ATTENDED">Održane</option>
                  </select>
                </Field>
                <Field label="Odluka selekcije">
                  <select value={selectionDecision} onChange={(e) => setSelectionDecision(e.target.value)} className={FIELD_CLS}>
                    <option value="PENDING">Na čekanju</option>
                    <option value="QUALIFIED">Kvalifikovan</option>
                    <option value="REJECTED">Odbijen</option>
                  </select>
                </Field>
              </div>
              <Field label="Beleške sa konsultacija (Faza 0)">
                <textarea rows={2} value={consultationNotes} onChange={(e) => setConsultationNotes(e.target.value)} className={FIELD_CLS} />
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-white p-4 space-y-3">
              <h4 className="text-[13px] font-bold text-ink-3">
                Interne napomene i dnevnik aktivnosti kandidata
              </h4>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Unesite interne napomene o kandidatu..."
                className={FIELD_CLS}
              />
            </div>
          </div>
        )}
      </form>

      {/* MODAL ZA KREIRANJE NOVE FAKTURE */}
      {showCreateInvoiceModal && (
        <NewInvoiceModal
          isOpen={showCreateInvoiceModal}
          candidates={[liveCandidateSnapshot]}
          onClose={() => setShowCreateInvoiceModal(false)}
          onCreated={() => {
            refreshCandidateInvoices();
            setShowCreateInvoiceModal(false);
            showToast("Nova KIR faktura je uspešno kreirana.");
          }}
        />
      )}

      {/* MODAL ZA PREGLED DOKUMENTA */}
      {previewDoc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-xs">
          <div className="flex max-h-[94vh] w-full max-w-5xl xl:max-w-6xl 2xl:max-w-[1360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line bg-ink px-6 py-4 text-white">
              <div>
                <p className="text-xs font-semibold text-brand">
                  Pregled otpremljenog dokumenta
                </p>
                <h3 className="text-base font-semibold">{previewDoc.title} — {previewDoc.fileName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Zatvori
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-2 p-4 sm:p-6">
              {previewDoc.url ? (
                previewDoc.url.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(previewDoc.fileName) ? (
                  <div className="flex justify-center bg-white p-4 rounded-xl">
                    <img src={previewDoc.url} alt={previewDoc.fileName} className="max-h-[74vh] object-contain rounded-lg" />
                  </div>
                ) : (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.fileName}
                    className="h-[74vh] w-full rounded-xl border border-line bg-white"
                  />
                )
              ) : (
                <div className="rounded-xl bg-amber-50 p-8 text-center text-xs font-semibold text-amber-900">
                  Sadržaj fajla nije dostupan za direktan prikaz. Kandidat može ponovo otpremiti fajl.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-6 py-4">
              {previewDoc.url ? (
                <a
                  href={previewDoc.url}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line-strong px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-2"
                >
                  Preuzmi fajl ({previewDoc.fileName})
                </a>
              ) : <span />}

              <div className="flex items-center gap-2">
                {previewDoc.docCategory === "contract" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleVerifyContractAction(true);
                        setPreviewDoc(null);
                      }}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Odobri ugovor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = previewDoc;
                        setPreviewDoc(null);
                        setRejectionModal({
                          type: "contract",
                          title: `Odbijanje ugovora (${doc.fileName})`,
                          reason: contractRejectionReason || "",
                        });
                      }}
                      className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Odbij uz obrazloženje
                    </button>
                  </>
                )}
                {previewDoc.docCategory === "documents" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleVerifyDocumentsAction(true);
                        setPreviewDoc(null);
                      }}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Odobri dokumentaciju
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = previewDoc;
                        setPreviewDoc(null);
                        setRejectionModal({
                          type: "documents",
                          title: `Vraćanje dokumenta na dopunu (${doc.fileName})`,
                          reason: documentsRejectionReason || "",
                        });
                      }}
                      className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Vrati uz obrazloženje
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZA ODBIJANJE UZ OBRAZLOŽENJE */}
      {rejectionModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl lg:max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-red-900">{rejectionModal.title}</h3>
            <p className="text-xs text-ink-2">
              Unesite razlog vraćanja koji će odmah biti prikazan kandidatu na njegovom Dashboard profilu:
            </p>
            <textarea
              rows={4}
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
              placeholder="Npr. Sken nije čitljiv, nedostaje potpis na poslednjoj strani..."
              className={FIELD_CLS}
            />
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setRejectionModal(null)}>Odustani</SecondaryButton>
              <button
                type="button"
                onClick={() => {
                  const reasonText = rejectionModal.reason.trim() || "Dokument nije ispravan. Molimo pošaljite ponovo.";
                  if (rejectionModal.type === "contract") {
                    handleVerifyContractAction(false, reasonText);
                  } else {
                    handleVerifyDocumentsAction(false, reasonText);
                  }
                  setRejectionModal(null);
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Potvrdi i obavesti kandidata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV BUILDER MODAL */}
      {showProfileBuilder && (
        <ProfileBuilderModal
          candidate={liveCandidateSnapshot}
          onClose={() => setShowProfileBuilder(false)}
          onSave={(updatedFields) => {
            if (updatedFields.cvFileName) setCvFileName(updatedFields.cvFileName);
            if (updatedFields.youtubeUrl) setYoutubeUrl(updatedFields.youtubeUrl);
            const merged = buildUpdatedCandidate(updatedFields);
            onSave(merged, { keepOpen: true });
            setShowProfileBuilder(false);
            showToast("CV i profil kandidata su ažurirani.");
          }}
        />
      )}
    </Modal>
  );
}
