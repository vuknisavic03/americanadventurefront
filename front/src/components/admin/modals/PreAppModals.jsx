// front/src/components/admin/modals/PreAppModals.jsx
import { useState } from "react";
import { useTranslation } from "../../../i18n/LanguageContext";
import {
  PROGRAM_PACKAGES,
  createInvitation,
  downloadContractPdf,
  downloadResponsibilityStatementPdf,
} from "../../../data/candidateStore";
import {
  Modal,
  Field,
  FIELD_CLS,
  PrimaryButton,
  SecondaryButton,
  CheckIcon,
  Badge,
} from "../ui";

/**
 * FR-006 – Status inicijalnog poziva kandidatu sa datumom i vremenom poslednjeg kontakta.
 */
export function RecordCallModal({ candidate, onSave, onClose }) {
  const [outcome, setOutcome] = useState(candidate.latestContactOutcome || "REACHED");
  const [note, setNote] = useState(candidate.contactNotes || "");
  const [contactAt, setContactAt] = useState(
    candidate.latestContactAt ? candidate.latestContactAt.slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [nextContactAt, setNextContactAt] = useState(
    candidate.nextContactAt ? candidate.nextContactAt.slice(0, 16) : ""
  );
  const [sendMaterials, setSendMaterials] = useState(!candidate.infoMaterialsSent);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      outcome,
      note,
      contactAt,
      nextContactAt: nextContactAt || null,
      sendMaterials,
    });
  };

  return (
    <Modal
      title="Evidencija inicijalnog poziva kandidatu"
      onClose={onClose}
      wide
      footer={
        <div className="flex w-full items-center justify-between">
          <SecondaryButton onClick={onClose}>Otkaži</SecondaryButton>
          <PrimaryButton onClick={handleSubmit}>Sačuvaj evidenciju poziva</PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <p className="text-base font-semibold leading-snug text-ink">
            {candidate.name || `${candidate.firstName} ${candidate.lastName}`}
          </p>
          <p className="text-ink-2 mt-0.5">
            Tel: <strong className="text-ink font-semibold">{candidate.phone || "Nije unet"}</strong> · Email: {candidate.email}
          </p>
          <p className="mt-1 text-ink-3">
            {candidate.faculty || "Fakultet"} ({candidate.studyCity || "Beograd"}) · Godina: {candidate.studyYear || "2"} · Nivo engleskog: {candidate.preferences?.englishLevel || "B2"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Ishod telefonskog razgovora (FR-006)">
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className={FIELD_CLS}
            >
              <option value="REACHED">Razgovor obavljen</option>
              <option value="NO_ANSWER">Bez odgovora / Zauzeto</option>
              <option value="CALLBACK_REQUESTED">Zatražen ponovni poziv</option>
              <option value="INVALID_CONTACT">Pogrešan broj / Nedostupan</option>
            </select>
          </Field>

          <Field label="Datum i vreme obavljenog poziva">
            <input
              type="datetime-local"
              value={contactAt}
              onChange={(e) => setContactAt(e.target.value)}
              className={FIELD_CLS}
            />
          </Field>
        </div>

        <Field label="Planiran sledeći kontakt (opciono)">
          <input
            type="datetime-local"
            value={nextContactAt}
            onChange={(e) => setNextContactAt(e.target.value)}
            className={FIELD_CLS}
          />
        </Field>

        <Field label="Beleška koordinatora o razgovoru">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Unesite utiske iz razgovora, nivo motivacije, položene ispite, željeni datum polaska..."
            className={`${FIELD_CLS} resize-y`}
          />
        </Field>

        <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-line bg-surface p-3 font-semibold text-ink-2 hover:bg-surface">
          <input
            type="checkbox"
            checked={sendMaterials}
            onChange={(e) => setSendMaterials(e.target.checked)}
            className="h-4 w-4 rounded border-line-strong text-ink"
          />
          <span>Automatski pošalji informativni paket (katalog programa i vodič) na email</span>
        </label>
      </div>
    </Modal>
  );
}

/**
 * FR-007, FR-008, FR-009, FR-010, FR-011 – Selekcija i automatsko slanje ugovora i poziva na konsultacije.
 */
export function CandidateSelectionModal({ candidate, onSave, onClose }) {
  const [decision, setDecision] = useState(
    candidate.selectionDecision === "REJECTED" || candidate.status === "rejected" ? "REJECTED" : "QUALIFIED"
  );
  const [rejectionReason, setRejectionReason] = useState(
    candidate.decisionNote || "Ne ispunjava uslov redovnog studenta (nema status ili obnovljena godina)"
  );
  const [rejectionNote, setRejectionNote] = useState("");
  const [sendDocuments, setSendDocuments] = useState(true);
  const [inviteConsultations, setInviteConsultations] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (decision === "REJECTED" && !rejectionReason.trim() && !rejectionNote.trim()) {
      alert("Obavezno je uneti razlog ili napomenu za kandidata koji ne ispunjava uslove.");
      return;
    }
    onSave({
      eligible: decision === "QUALIFIED",
      rejectionReason,
      rejectionNote,
      sendDocuments,
      inviteConsultations,
    });
  };

  return (
    <Modal
      title="Selekcija kandidata i automatski tok"
      onClose={onClose}
      wide
      footer={
        <div className="flex w-full items-center justify-between">
          <SecondaryButton onClick={onClose}>Otkaži</SecondaryButton>
          <PrimaryButton onClick={handleSubmit}>
            {decision === "QUALIFIED" ? "Potvrdi selekciju i Pokreni tok" : "Potvrdi odbijanje prijave"}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <p className="text-base font-semibold leading-snug text-ink">
            {candidate.name || `${candidate.firstName} ${candidate.lastName}`}
          </p>
          <p className="text-ink-2 mt-0.5">
            Email: {candidate.email} · Tel: {candidate.phone || "Nema telefona"} · {candidate.faculty || "Fakultet"} ({candidate.studyCity || "Beograd"})
          </p>
          <p className="mt-1 text-ink-3">
            Godina studija: {candidate.studyYear || "/"} · ESPB: {candidate.ectsPoints || 0} · Engleski: {candidate.preferences?.englishLevel || "/"}
          </p>
        </div>

        {/* Radio izbor: Ispunjava uslove (FR-007) vs Ne ispunjava uslove (FR-009) */}
        <div className="space-y-2">
          <label className="block text-[13px] font-semibold text-ink-2">
            Selekciona odluka radnika agencije:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                decision === "QUALIFIED"
                  ? "bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-line bg-white hover:bg-surface"
              }`}
            >
              <input
                type="radio"
                name="decision"
                value="QUALIFIED"
                checked={decision === "QUALIFIED"}
                onChange={() => setDecision("QUALIFIED")}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <div>
                <p className="font-bold text-sm text-emerald-950">
                  Ispunjava uslove
                </p>
                <p className="mt-0.5 text-xs text-emerald-900/80">
                  Kandidat zadovoljava kriterijume redovnog studenta i J-1 vize. Pokreće se automatsko slanje ugovora i poziv na konsultacije.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                decision === "REJECTED"
                  ? "bg-red-50 ring-2 ring-red-500/20"
                  : "border-line bg-white hover:bg-surface"
              }`}
            >
              <input
                type="radio"
                name="decision"
                value="REJECTED"
                checked={decision === "REJECTED"}
                onChange={() => setDecision("REJECTED")}
                className="mt-0.5 h-4 w-4 accent-red-600"
              />
              <div>
                <p className="font-bold text-sm text-red-950">
                  Ne ispunjava uslove
                </p>
                <p className="mt-0.5 text-xs text-red-900/80">
                  Kandidat ne ispunjava uslove za prijem na program. Zaustavlja se automatski tok uz obaveznu napomenu.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Ako ISPUNJAVA uslove: FR-008 & FR-011 */}
        {decision === "QUALIFIED" && (
          <div className="space-y-3 rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[13px] text-emerald-950">
                Automatski tok nakon selekcije
              </span>
              <Badge tone="green">Spremno za slanje</Badge>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-emerald-950">
              <input
                type="checkbox"
                checked={sendDocuments}
                onChange={(e) => setSendDocuments(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-emerald-600"
              />
              <div>
                <p className="font-semibold text-xs">
                  Automatsko slanje obavezne dokumentacije na email kandidata
                </p>
                <p className="text-xs text-emerald-900/80 mt-0.5">
                  Šalje se zvanični Ugovor 2027 (Full / Self Placement), Izjava o odgovornosti i Pravila programa koja kandidat mora pročitati pre konsultacija.
                </p>
              </div>
            </label>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-200/60">
              <button
                type="button"
                onClick={() => downloadContractPdf(candidate.id, candidate.email)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                Pregledaj Ugovor (PDF)
              </button>
              <button
                type="button"
                onClick={() => downloadResponsibilityStatementPdf(candidate.id, candidate.email)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                Pregledaj Izjavu o odgovornosti (PDF)
              </button>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-emerald-950 pt-2 border-t border-emerald-200/60">
              <input
                type="checkbox"
                checked={inviteConsultations}
                onChange={(e) => setInviteConsultations(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-emerald-600"
              />
              <div>
                <p className="font-semibold text-xs">
                  Drugi email — link za zakazivanje konsultacija (Calendly)
                </p>
                <p className="text-xs text-emerald-900/80 mt-0.5">
                  Kandidatu se šalje personalizovani link za rezervaciju termina online ili uživo konsultacija.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Ako NE ISPUNJAVA uslove: FR-010 & BR-005 */}
        {decision === "REJECTED" && (
          <div className="space-y-3 rounded-xl bg-red-50 p-4">
            <span className="font-bold text-[13px] text-red-950">
              Obavezna napomena za kandidata koji ne ispunjava uslove
            </span>

            <Field label="Razlog neispunjavanja uslova *">
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={FIELD_CLS}
              >
                <option value="Ne ispunjava uslov redovnog studenta (nema status ili obnovljena godina)">
                  Ne ispunjava uslov redovnog studenta (obnovljena godina / apsolvent bez uslova)
                </option>
                <option value="Nedovoljan broj položenih ispita / ESPB bodova">
                  Nedovoljan broj položenih ispita / ESPB bodova
                </option>
                <option value="Nedovoljan nivo znanja engleskog jezika za J-1 radnu vizu">
                  Nedovoljan nivo znanja engleskog jezika za radnu vizu
                </option>
                <option value="Kandidat je odustao iz ličnih ili finansijskih razloga">
                  Kandidat je odustao iz ličnih ili finansijskih razloga
                </option>
                <option value="Ostalo (definisano u administrativnoj zabelešci)">
                  Ostalo (definisano u administrativnoj zabelešci)
                </option>
              </select>
            </Field>

            <Field label="Dodatno obrazloženje i zapažanja koordinatora *">
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={3}
                placeholder="Unesite detaljno obrazloženje (npr. obnovljena prva godina sa samo 18 ESPB, neophodan status redovnog studenta prema pravilima sponzora)..."
                className={`${FIELD_CLS} resize-y`}
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * FR-012, FR-013, FR-014 – Evidencija zakazanih konsultacija, prisustva i utisaka.
 */
export function ScheduleConsultationModal({ candidate, onSave, onClose }) {
  const [scheduledAt, setScheduledAt] = useState(
    candidate.consultationStartsAt ? candidate.consultationStartsAt.slice(0, 16) : ""
  );
  const [consultationType, setConsultationType] = useState(candidate.consultationType || "ONLINE");
  const [attendanceStatus, setAttendanceStatus] = useState(
    candidate.consultationStatus === "NOT_SCHEDULED" ? "SCHEDULED" : candidate.consultationStatus || "SCHEDULED"
  );
  const [notes, setNotes] = useState(candidate.consultationNotes || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ scheduledAt, consultationType, attendanceStatus, notes });
  };

  return (
    <Modal
      title="Konsultacije sa kandidatom — Evidencija termina i prisustva"
      onClose={onClose}
      wide
      footer={
        <div className="flex w-full items-center justify-between">
          <SecondaryButton onClick={onClose}>Otkaži</SecondaryButton>
          <PrimaryButton onClick={handleSubmit}>Sačuvaj konsultacije</PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <p className="text-base font-semibold leading-snug text-ink">
            {candidate.name || `${candidate.firstName} ${candidate.lastName}`}
          </p>
          <p className="text-ink-2 mt-0.5">
            Email: {candidate.email} · Tel: {candidate.phone || "Nema telefona"} · {candidate.faculty || "Fakultet"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tačan datum i vreme konsultacija">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={FIELD_CLS}
              required
            />
          </Field>

          <Field label="Format konsultacija">
            <select
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value)}
              className={FIELD_CLS}
            >
              <option value="ONLINE">Online video sastanak</option>
              <option value="IN_PERSON">Uživo u agenciji</option>
            </select>
          </Field>
        </div>

        <Field label="Evidencija prisustva konsultacijama">
          <select
            value={attendanceStatus}
            onChange={(e) => setAttendanceStatus(e.target.value)}
            className={FIELD_CLS}
          >
            <option value="SCHEDULED">Zakazane</option>
            <option value="ATTENDED">Održane</option>
            <option value="NO_SHOW">Kandidat se nije pojavio</option>
            <option value="CANCELLED">Otkazane konsultacije</option>
          </select>
        </Field>

        <Field label="Opšte napomene i utisci sa konsultacija">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Unesite procenu nivoa engleskog jezika, motivaciju studenta, položene ispite, preporučene poslove i lokacije u SAD..."
            className={`${FIELD_CLS} resize-y`}
          />
        </Field>
      </div>
    </Modal>
  );
}

/**
 * FR-015 & BR-002 – Preduslovi za kreiranje profila (Selekcioni Readiness Gate).
 * Proverava da li kandidat zadovoljava 3 striktna preduslova pre izdavanja koda i aktivacije.
 */
export function ProfileReadinessModal({ candidate, onSave, onActivateDirectly, onClose }) {
  const [packageId, setPackageId] = useState(candidate.packageId || PROGRAM_PACKAGES[0].id);
  const [discount, setDiscount] = useState(String(candidate.discount || 100));
  const [discountNote, setDiscountNote] = useState(candidate.discountNote || "Rana prijava na konsultacijama");
  const [bypassPrerequisites, setBypassPrerequisites] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const selectedPkg = PROGRAM_PACKAGES.find((p) => p.id === packageId) || PROGRAM_PACKAGES[0];
  const finalPrice = Math.max(0, selectedPkg.basePrice - (Number(discount) || 0));

  // Provera 3 preduslova prema specifikaciji (FR-015, BR-002)
  const isSelectionPassed = candidate.selectionDecision === "QUALIFIED";
  const isDocsSent = Boolean(candidate.infoMaterialsSent);
  const isConsultationAttended = candidate.consultationStatus === "ATTENDED";
  const allPrerequisitesMet = isSelectionPassed && isDocsSent && isConsultationAttended;
  const canProceed = allPrerequisitesMet || bypassPrerequisites;

  const handleApprove = (e) => {
    e.preventDefault();
    if (!canProceed) return;
    const res = onSave({
      packageId,
      discount: Number(discount) || 0,
      discountNote,
      basePrice: selectedPkg.basePrice,
      bypassPrerequisites,
    });
    if (res?.invitation) {
      setResult(res.invitation);
    }
  };

  const handleActivateNow = () => {
    if (onActivateDirectly) {
      onActivateDirectly(candidate);
      onClose();
    }
  };

  const copyCode = () => {
    if (!result) return;
    navigator.clipboard?.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      title="Preduslovi za kreiranje profila (FR-015, BR-002)"
      onClose={onClose}
      wide
      footer={
        result ? (
          <div className="flex w-full items-center justify-between">
            <SecondaryButton onClick={onClose}>Zatvori</SecondaryButton>
            <PrimaryButton onClick={handleActivateNow}>
              Aktiviraj nalog odmah (Prebaci u Fazu 1)
            </PrimaryButton>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <SecondaryButton onClick={onClose}>Otkaži</SecondaryButton>
            <div className="flex items-center gap-2">
              <PrimaryButton onClick={handleApprove} disabled={!canProceed}>
                Odobri i generiši aktivacioni kod
              </PrimaryButton>
            </div>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-4 text-center py-4 text-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckIcon className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-ink">
            Kandidat je spreman za profil!
          </h3>
          <p className="text-ink-2">
            Student <strong>{candidate.name}</strong> je ispunio sve preduslove.
            Aktivacioni kod je uspešno generisan:
          </p>

          <div className="my-4 rounded-2xl border-dashed bg-amber-50 p-5">
            <p className="text-[13px] font-semibold text-amber-800">Verifikacioni kod za registraciju naloga</p>
            <p className="mt-2 tabular-nums text-3xl font-bold tracking-widest text-ink">
              {result.code}
            </p>
            <p className="mt-1 text-xs text-ink-3">
              Paket: {result.packageName} · Konačna cena: €{result.finalPrice} EUR
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 py-2 text-xs font-semibold hover:bg-surface-2"
            >
              {copied ? "Kod je kopiran!" : "Kopiraj aktivacioni kod"}
            </button>
            <button
              type="button"
              onClick={handleActivateNow}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all"
            >
              Aktiviraj nalog odmah
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <p className="text-base font-semibold leading-snug text-ink">
              {candidate.name || `${candidate.firstName} ${candidate.lastName}`}
            </p>
            <p className="text-ink-2 mt-0.5">
              Email: {candidate.email} · Tel: {candidate.phone || "Nema telefona"} · {candidate.faculty || "Fakultet"}
            </p>
          </div>

          {/* CHECKLIST PREDUSLOVA PREMA BR-002 i FR-015 */}
          <div className="rounded-xl border border-line bg-white p-4 space-y-3">
            <span className="block font-bold text-[13px] text-ink-3">
              Provera preduslova za kreiranje profila:
            </span>

            <div className="space-y-2">
              <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                isSelectionPassed ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    isSelectionPassed ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"
                  }`}>
                    {isSelectionPassed ? "✓" : "!"}
                  </span>
                  <span className="font-semibold">1. Inicijalna selekcija: Kandidat ispunjava uslove</span>
                </div>
                <Badge tone={isSelectionPassed ? "green" : "amber"}>
                  {isSelectionPassed ? "Ispunjava uslove" : "Nije označeno"}
                </Badge>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                isDocsSent ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    isDocsSent ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"
                  }`}>
                    {isDocsSent ? "✓" : "!"}
                  </span>
                  <span className="font-semibold">2. Obavezna dokumenta poslata kandidatu</span>
                </div>
                <Badge tone={isDocsSent ? "green" : "amber"}>
                  {isDocsSent ? "Poslata dokumenta" : "Nisu poslata"}
                </Badge>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                isConsultationAttended ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    isConsultationAttended ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"
                  }`}>
                    {isConsultationAttended ? "✓" : "!"}
                  </span>
                  <span className="font-semibold">3. Konsultacije održane i kandidat je prisustvovao</span>
                </div>
                <Badge tone={isConsultationAttended ? "green" : "amber"}>
                  {isConsultationAttended ? "Održane (prisustvovao)" : candidate.consultationStatus === "SCHEDULED" ? "Samo zakazane" : "Nisu održane"}
                </Badge>
              </div>
            </div>

            {!allPrerequisitesMet && (
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-950">
                <p className="font-semibold">
                  Prema poslovnom pravilu BR-002, kandidat ne može biti označen kao spreman za kreiranje profila dok ne prođe selekciju, primi ugovor i održi konsultacije.
                </p>
                <label className="mt-2.5 flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={bypassPrerequisites}
                    onChange={(e) => setBypassPrerequisites(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-400 text-amber-900"
                  />
                  <span>Ručno administratorsko odobrenje (Override — ručni unos kandidata mimo toka)</span>
                </label>
              </div>
            )}
          </div>

          {/* PARAMETRI PAKETA I CENE */}
          <div className="space-y-3">
            <Field label="Izbor paketa programa">
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className={FIELD_CLS}
              >
                {PROGRAM_PACKAGES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (€{p.basePrice})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Ugovoreni popust (EUR)">
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className={FIELD_CLS}
                />
              </Field>

              <Field label="Osnov popusta">
                <input
                  value={discountNote}
                  onChange={(e) => setDiscountNote(e.target.value)}
                  placeholder="npr. Rana prijava na konsultacijama"
                  className={FIELD_CLS}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-surface p-3.5 flex items-center justify-between">
              <span className="text-ink-2">Konačna ugovorena cena programa:</span>
              <span className="text-base font-bold text-ink">
                €{finalPrice} EUR
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Kompatibilni export za stari modal
 */
export function QualifyCandidateModal(props) {
  return <ProfileReadinessModal {...props} />;
}

export function RejectPreAppModal({ candidate, onSave, onClose }) {
  const [reason, setReason] = useState("Ne ispunjava uslov redovnog studenta (nema status ili obnovljena godina)");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ reason, note });
  };

  return (
    <Modal
      title="Odbijanje prijave kandidata"
      onClose={onClose}
      wide
      footer={
        <div className="flex w-full items-center justify-between">
          <SecondaryButton onClick={onClose}>Otkaži</SecondaryButton>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Potvrdi odbijanje prijave
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl bg-red-50 p-3 text-red-950">
          <p className="font-semibold">
            Da li ste sigurni da želite da odbijete prijavu za {candidate.name}?
          </p>
          <p className="mt-1 text-xs text-red-900/80">
            Prijava će biti označena kao odbijena i arhivirana, bez izdavanja registracionog koda.
          </p>
        </div>

        <Field label="Razlog odbijanja prijave">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={FIELD_CLS}
          >
            <option value="Ne ispunjava uslov redovnog studenta (nema status ili obnovljena godina)">
              Ne ispunjava uslov redovnog studenta (obnovljena godina / apsolvent bez uslova)
            </option>
            <option value="Nedovoljan broj položenih ispita / ESPB bodova">
              Nedovoljan broj položenih ispita / ESPB bodova
            </option>
            <option value="Nedovoljan nivo znanja engleskog jezika za J-1 radnu vizu">
              Nedovoljan nivo znanja engleskog jezika za radnu vizu
            </option>
            <option value="Kandidat je odustao iz ličnih ili finansijskih razloga">
              Kandidat je odustao iz ličnih ili finansijskih razloga
            </option>
            <option value="Ostalo (definisano u administrativnoj zabelešci)">
              Ostalo (definisano u administrativnoj zabelešci)
            </option>
          </select>
        </Field>

        <Field label="Dodatno obrazloženje / interna zabeleška">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Unesite detalje zašto student ne ispunjava kriterijume..."
            className={`${FIELD_CLS} resize-y`}
          />
        </Field>
      </div>
    </Modal>
  );
}

export function NewPreAppModal({ onCreated, onClose }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    faculty: "",
    studyCity: "Beograd",
    studyYear: "YEAR_2",
    ectsPoints: "120",
    englishLevel: "B2",
    program: "Work & Travel USA",
    initialNote: "",
  });

  const upd = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) {
      alert("Ime i email su obavezni!");
      return;
    }
    onCreated(form);
  };

  return (
    <Modal
      title="Ručni unos nove prijave (Walk-in / Telefonski upit)"
      onClose={onClose}
      wide
      footer={
        <div className="flex w-full items-center justify-between">
          <SecondaryButton onClick={onClose}>Otkaži</SecondaryButton>
          <PrimaryButton onClick={handleSubmit}>Sačuvaj novu prijavu</PrimaryButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Ime kandidata *">
            <input required value={form.firstName} onChange={upd("firstName")} className={FIELD_CLS} />
          </Field>
          <Field label="Prezime kandidata *">
            <input required value={form.lastName} onChange={upd("lastName")} className={FIELD_CLS} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email adresa *">
            <input type="email" required value={form.email} onChange={upd("email")} className={FIELD_CLS} />
          </Field>
          <Field label="Broj telefona">
            <input value={form.phone} onChange={upd("phone")} placeholder="+381 6..." className={FIELD_CLS} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Fakultet">
            <input value={form.faculty} onChange={upd("faculty")} placeholder="npr. FON, ETF, Pravni" className={FIELD_CLS} />
          </Field>
          <Field label="Grad studiranja">
            <input value={form.studyCity} onChange={upd("studyCity")} className={FIELD_CLS} />
          </Field>
          <Field label="Godina studija">
            <select value={form.studyYear} onChange={upd("studyYear")} className={FIELD_CLS}>
              <option value="YEAR_1">1. godina</option>
              <option value="YEAR_2">2. godina</option>
              <option value="YEAR_3">3. godina</option>
              <option value="YEAR_4">4. godina</option>
              <option value="MASTER">Master</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Program">
            <select value={form.program} onChange={upd("program")} className={FIELD_CLS}>
              <option value="Work & Travel USA">Work & Travel USA</option>
              <option value="Internship & Training USA">Internship & Training USA</option>
              <option value="Au Pair USA">Au Pair USA</option>
              <option value="High School USA">High School USA</option>
              <option value="H-2B Program">H-2B Program</option>
            </select>
          </Field>

          <Field label="Nivo engleskog jezika">
            <select value={form.englishLevel} onChange={upd("englishLevel")} className={FIELD_CLS}>
              <option value="A2">A2 (Osnovni)</option>
              <option value="B1">B1 (Srednji)</option>
              <option value="B2">B2 (Viši srednji - standard)</option>
              <option value="C1">C1 (Napredni)</option>
            </select>
          </Field>
        </div>

        <Field label="Početna zabeleška koordinatora">
          <textarea
            value={form.initialNote}
            onChange={upd("initialNote")}
            rows={2}
            placeholder="Kandidat došao lično u agenciju..."
            className={`${FIELD_CLS} resize-y`}
          />
        </Field>
      </form>
    </Modal>
  );
}

export function GenerateCodeModal({ onCreated, onClose }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [packageId, setPackageId] = useState(PROGRAM_PACKAGES[0].id);
  const [discount, setDiscount] = useState("100");
  const [discountNote, setDiscountNote] = useState("Rana prijava na razgovoru");
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const selectedPkg = PROGRAM_PACKAGES.find((p) => p.id === packageId) || PROGRAM_PACKAGES[0];
  const finalPrice = Math.max(0, selectedPkg.basePrice - (Number(discount) || 0));

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    const inv = createInvitation({
      email,
      candidateName,
      packageId,
      discount: Number(discount) || 0,
      discountNote,
    });
    setGeneratedResult(inv);
    if (onCreated) onCreated(inv);
  };

  const copyCode = () => {
    if (!generatedResult) return;
    navigator.clipboard?.writeText(generatedResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      title={t("admin.generateCodeTitle")}
      onClose={onClose}
      wide
      footer={
        generatedResult ? (
          <PrimaryButton onClick={onClose}>Zatvori</PrimaryButton>
        ) : (
          <>
            <span />
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={onClose}>{t("admin.cancel")}</SecondaryButton>
              <PrimaryButton type="submit" onClick={handleGenerate}>
                {t("admin.generateCodeBtn")}
              </PrimaryButton>
            </div>
          </>
        )
      }
    >
      {generatedResult ? (
        <div className="space-y-4 text-center py-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckIcon className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-ink">
            {t("admin.codeCreatedSuccess")}
          </h3>
          <p className="text-xs text-ink-2">
            Kod je generisan i simulirano poslat na: <strong>{generatedResult.email}</strong>
          </p>

          <div className="my-5 rounded-2xl border-dashed bg-amber-50 p-6">
            <p className="text-[13px] font-semibold text-amber-800">Verifikacioni kod kandidata</p>
            <p className="mt-2 tabular-nums text-3xl font-bold tracking-widest text-ink">
              {generatedResult.code}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 py-1.5 text-[13px] font-semibold hover:bg-surface-2"
            >
              {copied ? "✓ Kopirano!" : "Kopiraj kod"}
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 text-left text-xs space-y-1 sm:p-6">
            <p><span className="font-semibold">Paket:</span> {generatedResult.packageName}</p>
            <p><span className="font-semibold">Redovna cena:</span> {generatedResult.basePrice} €</p>
            {generatedResult.discount > 0 && (
              <p className="text-emerald-700 font-semibold">
                <span>Popust:</span> -{generatedResult.discount} € ({generatedResult.discountNote})
              </p>
            )}
            <p className="font-semibold text-sm text-ink pt-1">
              Konačna cena: {generatedResult.finalPrice} €
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-4">
          <p className="text-xs text-ink-3">
            {t("admin.generateCodeDesc")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("admin.candidateEmail")}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className={FIELD_CLS}
              />
            </Field>

            <Field label={t("admin.candidateName")}>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Ime i prezime"
                className={FIELD_CLS}
              />
            </Field>
          </div>

          <Field label={t("admin.selectPackage")}>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className={`${FIELD_CLS} appearance-none font-semibold`}
            >
              {PROGRAM_PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — {pkg.basePrice} €
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("admin.discount")}>
              <input
                type="number"
                min="0"
                step="25"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="100"
                className={FIELD_CLS}
              />
            </Field>

            <Field label={t("admin.discountNote")}>
              <input
                type="text"
                value={discountNote}
                onChange={(e) => setDiscountNote(e.target.value)}
                placeholder="npr. Sajamski popust"
                className={FIELD_CLS}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-line bg-brand/10 p-3.5 text-xs">
            <div className="flex justify-between items-center font-semibold text-ink">
              <span>Ukupno za uplatu kandidata:</span>
              <span className="text-sm">{finalPrice} €</span>
            </div>
            {Number(discount) > 0 && (
              <p className="mt-0.5 text-emerald-700">
                Uračunat popust od {discount} € ({discountNote || "Odobren popust"})
              </p>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
