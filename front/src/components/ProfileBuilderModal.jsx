import React, { useState } from "react";
import { calculateProfileScore } from "../data/candidateStore";

export default function ProfileBuilderModal({ candidate, isOpen = true, onClose, onSave }) {
  if (!isOpen || !candidate) return null;

  const [activeTab, setActiveTab] = useState("personal");

  const [f, setF] = useState({
    firstName: candidate.firstName || candidate.name?.split(" ")[0] || "",
    lastName: candidate.lastName || candidate.name?.split(" ").slice(1).join(" ") || "",
    email: candidate.email || "",
    phone: candidate.phone || "",
    faculty: candidate.faculty || "",
    studyCity: candidate.studyCity || "Beograd",
    studyYear: candidate.studyYear || "YEAR_2",
    studyMajor: candidate.studyMajor || "",
    gpa: candidate.gpa || "",
    englishLevel: candidate.englishLevel || candidate.preferences?.englishLevel || "B2",
    // Dostupnost
    startDate: candidate.availability?.startDate || "2026-05-25",
    endDate: candidate.availability?.endDate || "2026-09-25",
    travelUntil: candidate.availability?.travelUntil || "2026-10-20",
    availabilityNotes: candidate.availability?.notes || "",
    // Radno iskustvo
    workExperience: Array.isArray(candidate.workExperience) ? candidate.workExperience : [],
    // Veštine
    skills: Array.isArray(candidate.skills) ? candidate.skills : [],
    // Preferencije
    position: candidate.preferences?.position || "",
    jobType: candidate.preferences?.jobType || "",
    location: candidate.preferences?.location || "",
    locationType: candidate.preferences?.locationType || "",
    preferredStates: Array.isArray(candidate.preferences?.preferredStates) ? candidate.preferences.preferredStates : [],
    housingPreference: candidate.preferences?.housingPreference || "Smeštaj obezbeđen od poslodavca",
    travelingWith: candidate.preferences?.travelingWith || "Samostalno",
    // Video
    youtubeUrl: candidate.youtubeUrl || candidate.videoUrl || "",
    cvFileName: candidate.cvFileName || "CV_Biografija.pdf",
  });

  const [newExp, setNewExp] = useState({
    position: "",
    employer: "",
    city: "",
    period: "",
    duties: "",
  });
  const [showAddExp, setShowAddExp] = useState(false);
  const [customSkill, setCustomSkill] = useState("");

  const upd = (key) => (e) => {
    setF((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Proračun skora
  const candidatePreview = {
    ...candidate,
    ...f,
    availability: { startDate: f.startDate, endDate: f.endDate, travelUntil: f.travelUntil },
    preferences: {
      ...candidate.preferences,
      position: f.position,
      location: f.location,
      locationType: f.locationType,
      jobType: f.jobType,
      preferredStates: f.preferredStates,
      housingPreference: f.housingPreference,
      travelingWith: f.travelingWith,
      englishLevel: f.englishLevel,
    },
  };
  const profileScore = calculateProfileScore(candidatePreview);

  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExp.position.trim() || !newExp.employer.trim()) return;
    const expItem = {
      ...newExp,
      id: `exp-${Date.now()}`,
    };
    setF((prev) => ({
      ...prev,
      workExperience: [...prev.workExperience, expItem],
    }));
    setNewExp({ position: "", employer: "", city: "", period: "", duties: "" });
    setShowAddExp(false);
  };

  const handleRemoveExperience = (id) => {
    setF((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((x) => x.id !== id),
    }));
  };

  const handleToggleSkill = (skill) => {
    setF((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!customSkill.trim() || f.skills.includes(customSkill.trim())) return;
    setF((prev) => ({
      ...prev,
      skills: [...prev.skills, customSkill.trim()],
    }));
    setCustomSkill("");
  };

  const handleToggleState = (st) => {
    setF((prev) => {
      const exists = prev.preferredStates.includes(st);
      return {
        ...prev,
        preferredStates: exists
          ? prev.preferredStates.filter((s) => s !== st)
          : [...prev.preferredStates, st],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      name: `${f.firstName.trim()} ${f.lastName.trim()}`,
      phone: f.phone.trim(),
      faculty: f.faculty.trim(),
      studyCity: f.studyCity.trim(),
      studyYear: f.studyYear,
      studyMajor: f.studyMajor.trim(),
      gpa: f.gpa.trim(),
      englishLevel: f.englishLevel,
      availability: {
        startDate: f.startDate,
        endDate: f.endDate,
        travelUntil: f.travelUntil,
        notes: f.availabilityNotes,
      },
      workExperience: f.workExperience,
      skills: f.skills,
      preferences: {
        ...candidate.preferences,
        position: f.position,
        location: f.location,
        locationType: f.locationType,
        jobType: f.jobType,
        preferredStates: f.preferredStates,
        housingPreference: f.housingPreference,
        travelingWith: f.travelingWith,
        englishLevel: f.englishLevel,
      },
      youtubeUrl: f.youtubeUrl.trim(),
      videoUrl: f.youtubeUrl.trim(),
      cvFileName: f.cvFileName,
      profileCompleted: profileScore >= 80,
      profileCompletionScore: profileScore,
    };
    onSave(payload);
    onClose();
  };

  // Pomoćni YouTube embed parser
  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.includes("loom.com/share/")) {
        const id = url.split("loom.com/share/")[1]?.split("?")[0];
        return `https://www.loom.com/embed/${id}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const embedVideoUrl = getEmbedUrl(f.youtubeUrl);

  const TABS = [
    { id: "personal", label: "1. Lični & Fakultet", icon: "👤" },
    { id: "availability", label: "2. Datumi u SAD", icon: "📅" },
    { id: "experience", label: "3. CV & Radno iskustvo", icon: "" },
    { id: "preferences", label: "4. Posao & Lokacija", icon: "🎯" },
    { id: "video", label: "5. Video prezentacija", icon: "🎥" },
  ];

  const POPULAR_SKILLS = [
    "Customer Service & Komunikacija sa gostima",
    "Rad na kasi (POS)",
    "Spasilac na vodi (Crveni Krst)",
    "Pružanje prve pomoći i CPR",
    "Usluživanje hrane i pića (Food & Beverage)",
    "Priprema hrane i higijena (Food Prep)",
    "Održavanje soba (Housekeeping)",
    "Timski rad u dinamičnom okruženju",
    "Brzo učenje i fleksibilnost",
    "Tečan engleski jezik",
  ];

  const US_STATES = [
    "Massachusetts",
    "Maryland",
    "California",
    "Alaska",
    "Montana",
    "Maine",
    "New Jersey",
    "Colorado",
    "South Carolina",
    "Texas",
    "Wisconsin",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-4 flex max-h-[92vh] w-full max-w-5xl xl:max-w-6xl 2xl:max-w-[1320px] flex-col rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden">
        {/* Header modala */}
        <div className="border-b border-black/[0.08] bg-slate-900 px-6 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-sm font-black text-[var(--brand-ink)] shadow-xs">
                2.1
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight sm:text-lg">
                    Studentski profil & CV Builder za poslodavce u SAD
                  </h2>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold">
                    FAZA 2
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Popunite profil, radno iskustvo i video pre izbora posla i zakazivanja intervjua.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status profila */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Status profila
                </span>
                <span className="text-xs font-black text-[var(--brand-yellow)]">
                  {profileScore >= 80 ? "Kompletiran ✓" : "U pripremi"}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>


        </div>

        {/* Tab navigacija */}
        <div className="flex border-b border-black/[0.08] bg-slate-50 overflow-x-auto px-4 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? "border-[var(--brand-ink)] text-[var(--brand-ink)] bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-black/[0.02]"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Sadržaj tabova */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-slate-900">
          {/* TAB 1: LIČNI I AKADEMSKI PODACI */}
          {activeTab === "personal" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
                💡 <strong>Napomena:</strong> Ovi podaci se direktno prikazuju u DS-7002 obrascu i američkom poslodavcu tokom intervjua.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ime:</label>
                  <input
                    type="text"
                    required
                    value={f.firstName}
                    onChange={upd("firstName")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prezime:</label>
                  <input
                    type="text"
                    required
                    value={f.lastName}
                    onChange={upd("lastName")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email adresa:</label>
                  <input
                    type="email"
                    required
                    value={f.email}
                    onChange={upd("email")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Broj telefona (WhatsApp):</label>
                  <input
                    type="tel"
                    required
                    value={f.phone}
                    onChange={upd("phone")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-black/[0.06] pt-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fakultet / Univerzitet:</label>
                  <input
                    type="text"
                    required
                    value={f.faculty}
                    onChange={upd("faculty")}
                    placeholder="npr. Fakultet organizacionih nauka, Beograd"
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grad studiranja:</label>
                  <input
                    type="text"
                    required
                    value={f.studyCity}
                    onChange={upd("studyCity")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Smer / Departman:</label>
                  <input
                    type="text"
                    value={f.studyMajor}
                    onChange={upd("studyMajor")}
                    placeholder="npr. Menadžment i IT"
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Godina studija:</label>
                  <select
                    value={f.studyYear}
                    onChange={upd("studyYear")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="YEAR_1">1. godina</option>
                    <option value="YEAR_2">2. godina</option>
                    <option value="YEAR_3">3. godina</option>
                    <option value="YEAR_4">4. godina</option>
                    <option value="MASTER">Master studije</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nivo engleskog jezika:</label>
                  <select
                    value={f.englishLevel}
                    onChange={upd("englishLevel")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm font-bold text-amber-900 bg-amber-50 focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper Intermediate - Preporučeno)</option>
                    <option value="C1">C1 (Advanced)</option>
                    <option value="C2">C2 (Proficient / Fluent)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATUMI DOSTUPNOSTI ZA RAD U SAD */}
          {activeTab === "availability" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
                <span className="font-bold">Važno za J-1 vizu:</span> Datumi rada moraju biti usklađeni sa zvaničnim letnjim raspustom na vašem fakultetu (najranije od 20. maja do najkasnije 1. oktobra za studente iz Srbije).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Najraniji početak rada
                  </span>
                  <label className="block text-xs font-bold text-slate-800 mt-1 mb-1">
                    Start Date (SAD):
                  </label>
                  <input
                    type="date"
                    required
                    value={f.startDate}
                    onChange={upd("startDate")}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-mono font-bold"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Dan kada ste spremni da počnete rad kod poslodavca.
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Poslednji dan rada
                  </span>
                  <label className="block text-xs font-bold text-slate-800 mt-1 mb-1">
                    End Date (SAD):
                  </label>
                  <input
                    type="date"
                    required
                    value={f.endDate}
                    onChange={upd("endDate")}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-mono font-bold"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Zvaničan završetak radnog angažmana.
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Grace period za putovanje
                  </span>
                  <label className="block text-xs font-bold text-slate-800 mt-1 mb-1">
                    Povratak u Srbiju:
                  </label>
                  <input
                    type="date"
                    required
                    value={f.travelUntil}
                    onChange={upd("travelUntil")}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-mono font-bold"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Maksimalno 30 dana nakon isteka DS-2019 za putovanja.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Napomena o ispitnom roku i fleksibilnosti:
                </label>
                <textarea
                  rows={3}
                  value={f.availabilityNotes}
                  onChange={upd("availabilityNotes")}
                  placeholder="npr. Ispite u junskom roku polažem u predroku do 20. maja. Moguće produženje rada za još nedelju dana po dogovoru sa menadžerom."
                  className="w-full rounded-xl border border-black/15 bg-white p-3 text-xs focus:border-slate-900 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CV BUILDER & RADNO ISKUSTVO */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Radno iskustvo na engleskom jeziku (CV Timeline)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unesite sve poslove, prakse ili sezonske poslove koje ste radili.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExp(!showAddExp)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-ink)] px-3 py-1.5 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  <span>{showAddExp ? "✕ Zatvori unos" : "+ Dodaj radno iskustvo"}</span>
                </button>
              </div>

              {/* Forma za dodavanje nove pozicije */}
              {showAddExp && (
                <div className="rounded-xl border-2 border-slate-900 bg-slate-50 p-4 space-y-3">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Nova radna pozicija
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Pozicija (na engleskom):
                      </label>
                      <input
                        type="text"
                        placeholder="npr. Server / Waiter, Lifeguard, Front Desk..."
                        value={newExp.position}
                        onChange={(e) => setNewExp({ ...newExp, position: e.target.value })}
                        className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Poslodavac / Firma:
                      </label>
                      <input
                        type="text"
                        placeholder="npr. Hotel Hyatt Regency, Caffe Bar..."
                        value={newExp.employer}
                        onChange={(e) => setNewExp({ ...newExp, employer: e.target.value })}
                        className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Grad i država:
                      </label>
                      <input
                        type="text"
                        placeholder="npr. Beograd, Srbija"
                        value={newExp.city}
                        onChange={(e) => setNewExp({ ...newExp, city: e.target.value })}
                        className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Period rada:
                      </label>
                      <input
                        type="text"
                        placeholder="npr. Jun 2024 - Septembar 2024"
                        value={newExp.period}
                        onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                        className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Ključna zaduženja i veštine (Duties & Responsibilities):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="npr. Taking orders, managing table turnover, handling cash & card payments, communicating with international guests in English."
                      value={newExp.duties}
                      onChange={(e) => setNewExp({ ...newExp, duties: e.target.value })}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExp(false)}
                      className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      Odustani
                    </button>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Sačuvaj poziciju u CV
                    </button>
                  </div>
                </div>
              )}

              {/* Lista unetih radnih iskustava */}
              <div className="space-y-3">
                {f.workExperience.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/15 p-6 text-center text-xs text-slate-500">
                    Nema unetog radnog iskustva. Kliknite na "+ Dodaj radno iskustvo" iznad kako biste uneli svoje prethodne poslove.
                  </div>
                ) : (
                  f.workExperience.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-2xs hover:border-black/20 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{exp.position}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {exp.employer} ({exp.city})
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500">🗓️ {exp.period}</p>
                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{exp.duties}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0 self-end sm:self-start"
                        title="Ukloni poziciju"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Veštine (Skills) */}
              <div className="border-t border-black/[0.08] pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Ključne veštine (Skills for US employers):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map((sk) => {
                    const isSelected = f.skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => handleToggleSkill(sk)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {sk}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Dodajte sopstvenu specifičnu veštinu..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-300"
                  >
                    Dodaj veštinu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREFERENCIJE POSLA I LOKACIJE U SAD */}
          {activeTab === "preferences" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                🎯 <strong>Matchmaking sa poslodavcima:</strong> Na osnovu ovih preferencija agencija vam predlaže odgovarajuće opcije na Sajmu poslova (Job Fair).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Željeni tip posla:</label>
                  <select
                    value={f.jobType}
                    onChange={upd("jobType")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="Food & Beverage / Lifeguard">Restorani & Ugostiteljstvo / Spasioci</option>
                    <option value="Hotelijerstvo & Housekeeping">Hotelijerstvo & Housekeeping</option>
                    <option value="Spasilac na bazenu (Lifeguard)">Spasilac na bazenu (Lifeguard)</option>
                    <option value="Zabavni parkovi & Atrakcije">Zabavni parkovi & Resort atrakcije</option>
                    <option value="Maloprodaja / Retail & Trgovina">Maloprodaja / Retail & Gift shops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tip geografske lokacije:</label>
                  <select
                    value={f.locationType}
                    onChange={upd("locationType")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="Morska obala & Plaže">Morska obala & Plaže (East/West Coast)</option>
                    <option value="Nacionalni parkovi i planinska jezera">Nacionalni parkovi i planinska jezera (Rocky Mtns, Alaska)</option>
                    <option value="Poznata turistička ostrva">Ostrva (Martha's Vineyard, Nantucket, Block Island)</option>
                    <option value="Gradske i univerzitetske sredine">Gradske i turističke sredine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferirane savezne države u SAD (izaberite jednu ili više):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {US_STATES.map((st) => {
                    const isSelected = f.preferredStates.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleToggleState(st)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "✓ " : ""}
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-black/[0.06] pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferencija smeštaja:</label>
                  <select
                    value={f.housingPreference}
                    onChange={upd("housingPreference")}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="Smeštaj obezbeđen od poslodavca">Smeštaj obezbeđen od poslodavca (Preporučeno)</option>
                    <option value="Asistirani smeštaj od strane sponzora">Asistirani smeštaj od strane sponzora</option>
                    <option value="Sopstveni smeštaj">Imam sopstveni smeštaj (kod rođaka/prijatelja)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Putujem sa cimerom / prijateljem:</label>
                  <input
                    type="text"
                    value={f.travelingWith}
                    onChange={upd("travelingWith")}
                    placeholder="npr. Ana Jovanović (Ime i prezime para)"
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500">Ostavite prazno ako se prijavljujete samostalno.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO PREZENTACIJA */}
          {activeTab === "video" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🎥</span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-red-950 uppercase tracking-wide">
                      60-sekundni video na engleskom jeziku
                    </h4>
                    <p className="text-xs text-red-900 leading-relaxed">
                      Američki poslodavci donose odluku o intervjuu prvenstveno na osnovu vašeg videa! Video treba da traje između 60 i 90 sekundi.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Link ka video snimku (YouTube / Loom / Vimeo):
                </label>
                <input
                  type="url"
                  required
                  value={f.youtubeUrl}
                  onChange={upd("youtubeUrl")}
                  placeholder="npr. https://www.youtube.com/watch?v=... ili https://www.loom.com/share/..."
                  className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm font-mono focus:border-slate-900 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Možete okačiti video kao "Unlisted" (Nelistiran) na YouTube-u kako bi ga videli samo poslodavci i agencija.
                </span>
              </div>

              {/* Live Preview */}
              {embedVideoUrl ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Preview vašeg videa:</span>
                  <div className="aspect-video w-full max-w-xl overflow-hidden rounded-xl border-2 border-slate-900 bg-black shadow-md">
                    <iframe
                      src={embedVideoUrl}
                      title="Video prezentacija"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 block">
                    ✓ Video je ispravno prepoznat i spreman za američke poslodavce!
                  </span>
                </div>
              ) : f.youtubeUrl ? (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                  Link je sačuvan: <a href={f.youtubeUrl} target="_blank" rel="noreferrer" className="underline font-bold">{f.youtubeUrl}</a>
                </div>
              ) : null}

              {/* Uputstvo za snimanje */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wide">
                  Struktura idealnog 60-sekundnog videa:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li><strong>0:00 – 0:15:</strong> Predstavite se na engleskom (Ime, grad, fakultet i hobi).</li>
                  <li><strong>0:15 – 0:35:</strong> Zašto želite da dođete u SAD i zašto ste izabrali Work & Travel program.</li>
                  <li><strong>0:35 – 0:50:</strong> Prethodno radno iskustvo i zašto ste pouzdan, vredan radnik.</li>
                  <li><strong>0:50 – 1:00:</strong> Pozdrav poslodavcu sa osmehom (<i>"Looking forward to meeting you this summer in the US!"</i>).</li>
                </ol>
              </div>
            </div>
          )}

          {/* Footer akcije */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-black/5 transition-colors"
            >
              Odustani
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-black/5 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Štampaj CV (PDF)</span>
              </button>

              <button
                type="submit"
                className="rounded-xl bg-[var(--brand-ink)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-black transition-all"
              >
                Sačuvaj studentski profil & CV (Korak 2.1) ✓
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
