// front/src/components/Register.jsx
// Glavni orkestrator za registraciju kandidata u 4 koraka

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import {
  verifyInvitationWithBackend,
  scanPassportWithBackend,
  registerCandidateWithBackend,
  uploadDocumentWithBackend,
  getCandidates,
  syncFromBackend,
} from "../data/candidateStore";
import { RegisterStepper } from "./register/ui";
import Step1Activation from "./register/Step1Activation";
import Step2PassportOcr from "./register/Step2PassportOcr";
import Step3PaymentGuarantor from "./register/Step3PaymentGuarantor";
import Step4PreferencesJob from "./register/Step4PreferencesJob";

export default function Register({
  onSubmit = () => {},
  onNavigate = () => {},
  loginHref = "/prijava",
  applyHref = "/prijava-online",
  logoHref = "/",
}) {
  const { t } = useTranslation();

  // Koraci: 1 = Aktivacija i lozinka, 2 = Pasoš & OCR, 3 = Plaćanje & Jemac, 4 = Posao & Test
  const [step, setStep] = useState(1);

  // Korak 1 stanja
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [matchedInvitation, setMatchedInvitation] = useState(null);
  const [codeError, setCodeError] = useState("");

  // Korak 2 stanja (Pasoš & OCR)
  const [passportImage, setPassportImage] = useState(null);
  const [passportFileName, setPassportFileName] = useState("");
  const [passportFileUrl, setPassportFileUrl] = useState("");
  const [ocrBirthDate, setOcrBirthDate] = useState("");
  const [ocrExpiryDate, setOcrExpiryDate] = useState("");
  const [ocrGender, setOcrGender] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [ocrStatusMessage, setOcrStatusMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jmbg, setJmbg] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const passportInputRef = useRef(null);

  // Korak 3 stanja (Plaćanje & Jemac)
  const [paymentMethod, setPaymentMethod] = useState("now"); // now | installments | later
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorIdCard, setGuarantorIdCard] = useState("");
  const [guarantorJmbg, setGuarantorJmbg] = useState("");
  const [promissoryNotesCount, setPromissoryNotesCount] = useState("2");

  // Korak 4 stanja (Preferencije & Engleski)
  const [prefLocation, setPrefLocation] = useState("");
  const [prefPosition, setPrefPosition] = useState("");
  const [englishLevel, setEnglishLevel] = useState("B2");
  const [englishTestLink, setEnglishTestLink] = useState("");

  // Afilijate & Grupni popust
  const [referredBy, setReferredBy] = useState("");
  const [groupCode, setGroupCode] = useState("");

  useEffect(() => {
    syncFromBackend();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("refCode") || params.get("referral");
      if (ref) setReferredBy(ref.trim().toUpperCase());
      const grp = params.get("group") || params.get("groupCode");
      if (grp) setGroupCode(grp.trim().toUpperCase());
    }
  }, []);

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  const applyInvitationDetails = (inv) => {
    setMatchedInvitation(inv);
    setEmail(inv.email);
    if (inv.referredBy && !referredBy) setReferredBy(inv.referredBy);
    if (inv.groupCode && !groupCode) setGroupCode(inv.groupCode);
    if (inv.candidateName) {
      const parts = inv.candidateName.split(" ");
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      } else {
        setFirstName(parts[0]);
      }
    }
    // Povuci broj telefona i postojeće podatke iz pre-aplikacije kandidata (Faza 0)
    const existingPreApp = getCandidates().find(
      (c) => c.email && inv.email && c.email.toLowerCase() === inv.email.toLowerCase()
    );
    if (existingPreApp) {
      if (existingPreApp.phone && !phone) setPhone(existingPreApp.phone);
      if (existingPreApp.firstName && !firstName) setFirstName(existingPreApp.firstName);
      if (existingPreApp.lastName && !lastName) setLastName(existingPreApp.lastName);
      if (existingPreApp.birthDate && !ocrBirthDate) setOcrBirthDate(existingPreApp.birthDate);
    }
  };

  // Provera verifikacionog koda preko backend API-ja
  const handleVerifyCode = async (e) => {
    if (e) e.preventDefault();
    setCodeError("");

    if (!email.trim()) {
      setCodeError("Morate uneti email adresu na koju vam je poslat verifikacioni kod.");
      setMatchedInvitation(null);
      return null;
    }
    if (!code.trim()) {
      setCodeError("Morate uneti verifikacioni kod iz pozivnice.");
      setMatchedInvitation(null);
      return null;
    }

    const res = await verifyInvitationWithBackend(email, code);
    if (!res.valid) {
      setCodeError(res.error);
      setMatchedInvitation(null);
      return null;
    }

    applyInvitationDetails(res.invitation);
    return res.invitation;
  };

  // Korak 1 nastavak
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t("auth.passwordMismatch") || "Lozinke se ne poklapaju.");
      return;
    }

    let inv = matchedInvitation;
    if (!inv) {
      inv = await handleVerifyCode();
      if (!inv) return;
    }

    if (email.trim().toLowerCase() !== inv.email.toLowerCase()) {
      setCodeError(`Registracija je dozvoljena isključivo sa email adresom: ${inv.email}`);
      return;
    }

    setStep(2);
  };

  const formatMrzName = (val) => {
    if (!val) return "";
    const lower = String(val).trim().toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const applyOcrResponse = (ocrRes) => {
    setIsScanning(false);
    setScanCompleted(true);

    if (ocrRes?.previewDataUrl) {
      setPassportImage(ocrRes.previewDataUrl);
    }

    const ext = ocrRes?.extracted;
    if (ext) {
      if (ext.firstName) setFirstName(formatMrzName(ext.firstName));
      if (ext.lastName) setLastName(formatMrzName(ext.lastName));
      const extractedJmbg = ext.personalNumber || ext.visualFields?.jmbg;
      if (extractedJmbg && /^\d{13}$/.test(extractedJmbg)) {
        setJmbg(extractedJmbg);
      }
      const docNum = ext.documentNumber || ext.visualFields?.passportNumber;
      if (docNum) {
        setIdCardNumber(docNum);
      }
      if (ext.birthDate) {
        setOcrBirthDate(ext.birthDate);
      }
      if (ext.expirationDate) {
        setOcrExpiryDate(ext.expirationDate);
      }
      if (ext.sex === "F") {
        setOcrGender("Ženski");
      } else if (ext.sex === "M") {
        setOcrGender("Muški");
      }
      const confStr = ocrRes.confidence ? ` (pouzdanost OCR očitavanja: ${ocrRes.confidence}%)` : "";
      setOcrStatusMessage(
        `${ocrRes.message || "Pasoš je uspešno očitan putem OCR-a!"}${confStr}`
      );
    } else {
      if (!firstName && matchedInvitation?.candidateName) {
        setFirstName(matchedInvitation.candidateName.split(" ")[0]);
      }
      if (!lastName && matchedInvitation?.candidateName) {
        setLastName(matchedInvitation.candidateName.split(" ").slice(1).join(" "));
      }
      setOcrStatusMessage(ocrRes?.message || "Fotografija pasoša je učitana. Molimo proverite i potvrdite očitane podatke ispod.");
    }
  };

  // Pravi upload pasoša i pozivanje backend Tesseract + MRZ OCR-a
  const handlePassportUpload = async (file) => {
    if (!file) return;
    setPassportFileName(file.name || "Sken_Pasosa.png");
    const reader = new FileReader();
    reader.onload = () => {
      setPassportImage(reader.result);
    };
    reader.readAsDataURL(file);

    setIsScanning(true);
    setScanCompleted(false);
    setOcrStatusMessage("");

    // Sačuvaj fajl pasoša u dokumentima kandidata
    const targetEmail = (matchedInvitation?.email || email || "").trim().toLowerCase();
    uploadDocumentWithBackend(file, "passport", targetEmail)
      .then((res) => {
        if (res?.fileUrl) setPassportFileUrl(res.fileUrl);
      })
      .catch(() => {});

    const ocrRes = await scanPassportWithBackend({ file });
    applyOcrResponse(ocrRes);
  };

  const runSamplePassportOcr = async () => {
    setIsScanning(true);
    setScanCompleted(false);
    setOcrStatusMessage("");
    setPassportFileName("Sken_Pasosa_OCR.png");

    const ocrRes = await scanPassportWithBackend({
      sample: true,
      candidateName: matchedInvitation?.candidateName || `${firstName} ${lastName}`.trim() || "Luka Jovanović",
    });
    applyOcrResponse(ocrRes);
  };

  // Korak 2 nastavak
  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (!passportImage) {
      alert(t("reg.passportUpload"));
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !jmbg.trim() || !idCardNumber.trim()) {
      alert(t("reg.passportExtractSuccess"));
      return;
    }
    setStep(3);
  };

  // Korak 3 nastavak
  const handleStep3Submit = (e) => {
    e.preventDefault();
    if (paymentMethod === "later") {
      if (!guarantorName.trim() || !guarantorIdCard.trim() || !guarantorJmbg.trim() || !promissoryNotesCount.trim()) {
        alert("Molimo unesite sve podatke o jemcu i broju menica.");
        return;
      }
    }
    setStep(4);
  };

  // Završetak registracije i kreiranje profila na backendu i u lokalnom store-u
  const handleStep4Submit = async (e) => {
    e.preventDefault();

    const verifiedEmail = (matchedInvitation?.email || email).trim().toLowerCase();
    const existingPreApp = getCandidates().find(
      (c) => c.email && c.email.toLowerCase() === verifiedEmail
    );
    const resolvedPhone = phone.trim() || existingPreApp?.phone || "";
    const resolvedPassportFileName =
      passportFileName ||
      existingPreApp?.passportScanFileName ||
      (passportImage ? "Sken_Pasosa_OCR.png" : "");

    const candidateProfile = {
      id: existingPreApp?.id && !String(existingPreApp.id).startsWith("preapp-")
        ? existingPreApp.id
        : `cand-${Date.now()}`,
      code: matchedInvitation?.code || code.trim().toUpperCase(),
      email: verifiedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: resolvedPhone,
      jmbg: jmbg.trim(),
      idCardNumber: idCardNumber.trim(),
      passportNumber: idCardNumber.trim(),
      passportImage,
      passportScanFileName: resolvedPassportFileName,
      passportScanDataUrl: passportImage || existingPreApp?.passportScanDataUrl || "",
      passportScanUrl: passportFileUrl || existingPreApp?.passportScanUrl || "",
      birthDate: ocrBirthDate || existingPreApp?.birthDate || "",
      passportExpiryDate: ocrExpiryDate || existingPreApp?.passportExpiryDate || "",
      gender: ocrGender || existingPreApp?.gender || "",
      address: existingPreApp?.address || "",
      faculty: existingPreApp?.faculty || "",
      studyCity: existingPreApp?.studyCity || "",
      studyYear: existingPreApp?.studyYear || "",
      ectsPoints: existingPreApp?.ectsPoints,
      packageId: matchedInvitation?.packageId || "swt-full",
      packageName: matchedInvitation?.packageName || "Work & Travel USA — Full Placement",
      basePrice: matchedInvitation?.basePrice || 1850,
      discountId: matchedInvitation?.discountId || null,
      discountTiming: matchedInvitation?.discountTiming || null,
      discount: matchedInvitation?.discount || 0,
      discountNote: matchedInvitation?.discountNote || "",
      finalPrice: matchedInvitation?.finalPrice || 1850,
      referredBy: referredBy.trim().toUpperCase() || matchedInvitation?.referredBy || "",
      groupCode: groupCode.trim().toUpperCase() || matchedInvitation?.groupCode || "",
      paymentMethod,
      guarantor:
        paymentMethod === "later"
          ? {
              name: guarantorName.trim(),
              idCardNumber: guarantorIdCard.trim(),
              jmbg: guarantorJmbg.trim(),
              promissoryNotesCount: Number(promissoryNotesCount) || 2,
            }
          : null,
      preferences: {
        location: prefLocation.trim(),
        position: prefPosition.trim(),
        englishLevel,
        testLink: englishTestLink.trim(),
      },
      youtubeUrl: "",
      cvFileName: "",
      facultyCertFileName: "",
      facultyCertAiTranslation: false,
      status: "review",
      progress: 40,
      isRegistered: true,
      registeredAt: new Date().toISOString(),
      createdAt: existingPreApp?.createdAt || new Date().toISOString(),
    };

    const saved = await registerCandidateWithBackend(candidateProfile);
    onSubmit(saved);
  };

  return (
    <section className="bg-surface px-5 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-xl">
        {/* Stepper progress */}
        <RegisterStepper step={step} t={t} />

        <div className="mt-8 rounded-3xl border border-line bg-white p-7 sm:p-10">
          {step === 1 && (
            <Step1Activation
              email={email}
              setEmail={setEmail}
              code={code}
              setCode={setCode}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              matchedInvitation={matchedInvitation}
              setMatchedInvitation={setMatchedInvitation}
              codeError={codeError}
              setCodeError={setCodeError}
              onVerifyCode={handleVerifyCode}
              onSubmit={handleStep1Submit}
              t={t}
            />
          )}

          {step === 2 && (
            <Step2PassportOcr
              passportImage={passportImage}
              isScanning={isScanning}
              scanCompleted={scanCompleted}
              ocrStatusMessage={ocrStatusMessage}
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              phone={phone}
              setPhone={setPhone}
              jmbg={jmbg}
              setJmbg={setJmbg}
              idCardNumber={idCardNumber}
              setIdCardNumber={setIdCardNumber}
              passportInputRef={passportInputRef}
              onPassportUpload={handlePassportUpload}
              onRunSampleOcr={runSamplePassportOcr}
              onBack={() => setStep(1)}
              onSubmit={handleStep2Submit}
              t={t}
            />
          )}

          {step === 3 && (
            <Step3PaymentGuarantor
              matchedInvitation={matchedInvitation}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              guarantorName={guarantorName}
              setGuarantorName={setGuarantorName}
              guarantorIdCard={guarantorIdCard}
              setGuarantorIdCard={setGuarantorIdCard}
              guarantorJmbg={guarantorJmbg}
              setGuarantorJmbg={setGuarantorJmbg}
              promissoryNotesCount={promissoryNotesCount}
              setPromissoryNotesCount={setPromissoryNotesCount}
              onBack={() => setStep(2)}
              onSubmit={handleStep3Submit}
              t={t}
            />
          )}

          {step === 4 && (
            <Step4PreferencesJob
              prefLocation={prefLocation}
              setPrefLocation={setPrefLocation}
              prefPosition={prefPosition}
              setPrefPosition={setPrefPosition}
              englishLevel={englishLevel}
              setEnglishLevel={setEnglishLevel}
              englishTestLink={englishTestLink}
              setEnglishTestLink={setEnglishTestLink}
              referredBy={referredBy}
              setReferredBy={setReferredBy}
              groupCode={groupCode}
              setGroupCode={setGroupCode}
              onBack={() => setStep(3)}
              onSubmit={handleStep4Submit}
              t={t}
            />
          )}
        </div>

        {/* Link za prijavu ako korisnik već ima nalog */}
        <div className="mt-6 space-y-2 text-center text-sm text-ink-2">
          <p>
            {t("reg.haveAccount")}{" "}
            <a
              href={loginHref}
              onClick={go(loginHref)}
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              {t("auth.loginAccount")}
            </a>
          </p>
          <p className="text-xs text-ink-3">
            {t("login.notInterviewed")}{" "}
            <a
              href={applyHref}
              onClick={go(applyHref)}
              className="font-semibold text-ink underline hover:opacity-80"
            >
              {t("login.applyFree")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
