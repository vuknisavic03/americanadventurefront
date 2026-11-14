// front/src/components/admin/JobsSection.jsx
// Kartica "Baza poslova" na Admin portalu: pregled, dodavanje, izmena i brisanje radnih ponuda

import { useState, useMemo, useEffect } from "react";
import {
  PageHeader,
  Card,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  XIcon,
} from "./ui";
import { getJobs, saveJob, deleteJob } from "../../data/jobsStore";

const EMPTY_JOB_FORM = {
  id: "",
  title: "",
  employer: "",
  category: "Ugostiteljstvo / Restoran",
  city: "",
  wage: "$16.00 / sat",
  hoursPerWeek: "35-40 h",
  housing: "Obezbeđen smeštaj ($120/ned)",
  period: "jun - septembar",
  englishLevel: "B2",
  summary: "",
  description: "",
};

const CATEGORIES = [
  "Bazen / Spasilačka služba",
  "Hotel / Domaćinstvo",
  "Restoran / Kuhinja",
  "Ugostiteljstvo / Posluživanje",
  "Trgovina / Prodaja",
  "Zabavni i nacionalni parkovi",
  "Ostalo",
];

export default function JobsSection() {
  const [jobs, setJobs] = useState(getJobs);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(EMPTY_JOB_FORM);
  const [toastMessage, setToastMessage] = useState("");

  const refreshJobs = () => {
    setJobs(getJobs());
  };

  useEffect(() => {
    const handleUpdate = () => refreshJobs();
    window.addEventListener("aa_jobs_updated", handleUpdate);
    return () => window.removeEventListener("aa_jobs_updated", handleUpdate);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (categoryFilter !== "ALL" && j.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (j.title || "").toLowerCase().includes(q);
        const matchEmployer = (j.employer || "").toLowerCase().includes(q);
        const matchCity = (j.city || "").toLowerCase().includes(q);
        const matchSummary = (j.summary || "").toLowerCase().includes(q);
        if (!matchTitle && !matchEmployer && !matchCity && !matchSummary) return false;
      }
      return true;
    });
  }, [jobs, categoryFilter, search]);

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setForm(EMPTY_JOB_FORM);
    setModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setForm({
      id: job.id,
      title: job.title || "",
      employer: job.employer || "",
      category: job.category || "Ugostiteljstvo / Restoran",
      city: job.city || "",
      wage: job.wage || "",
      hoursPerWeek: job.hoursPerWeek || "35-40 h",
      housing: job.housing || "",
      period: job.period || "jun - septembar",
      englishLevel: job.englishLevel || "B2",
      summary: job.summary || "",
      description: job.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete posao "${title}" iz baze?`)) {
      deleteJob(id);
      refreshJobs();
      showToast(`Posao "${title}" je uspešno obrisan iz baze.`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.employer.trim() || !form.city.trim()) {
      alert("Molimo unesite naziv pozicije, poslodavca i lokaciju.");
      return;
    }

    const saved = saveJob(form);
    refreshJobs();
    setModalOpen(false);
    showToast(
      editingJob
        ? `Uspešno sačuvane izmene za posao "${saved.title}".`
        : `Novi posao "${saved.title}" je dodat u bazu.`
    );
  };

  const upd = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const fieldCls =
    "w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-xs text-ink transition-colors placeholder:text-ink-3/70 focus:border-ink focus:outline-hidden focus:ring-1 focus:ring-ink";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Baza poslova u SAD"
        subtitle="Evidencija, unos i izmena radnih ponuda američkih poslodavaca koje se nude kandidatima"
        action={
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-950"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Dodaj novi posao</span>
          </button>
        }
      />

      {toastMessage && (
        <div className="rounded-xl border border-line bg-white px-4 py-3 text-xs font-semibold text-emerald-700">
          {toastMessage}
        </div>
      )}

      {/* Filteri i pretraga */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži poslove po nazivu, poslodavcu, gradu..."
              className="w-full rounded-lg border border-line-strong bg-white py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-3/70 focus:border-ink focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-medium text-ink focus:border-ink focus:outline-hidden"
            >
              <option value="ALL">Sve kategorije</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold text-ink-3 shrink-0">
              Ukupno: {filteredJobs.length}
            </span>
          </div>
        </div>
      </Card>

      {/* Grid kartica poslova */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm font-semibold text-ink-2">
            Nema pronađenih poslova po unetim kriterijumima pretrage.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-950"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Dodaj prvi posao</span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="p-4 flex flex-col justify-between hover:border-line-strong transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span className="rounded-lg bg-surface border border-line px-3 py-1 text-xs font-medium text-ink">
                      {job.category || "Opšti posao"}
                    </span>
                    <h3 className="text-base font-bold text-ink mt-1">
                      {job.title}
                    </h3>
                    <p className="text-xs font-semibold text-ink-2">
                      {job.employer}
                    </p>
                  </div>
                  <span className="rounded-md border-line bg-white px-2 py-1 text-xs font-bold text-amber-700 shrink-0">
                    {job.wage || "Satnica po dogovoru"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-xs font-semibold text-ink-3 block">Lokacija</span>
                    <span className="font-semibold text-ink-2">{job.city || "SAD"}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-ink-3 block">Radno vreme</span>
                    <span className="font-semibold text-ink-2">{job.hoursPerWeek || "35-40 h"}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-ink-3 block">Smeštaj</span>
                    <span className="font-semibold text-ink-2 truncate block" title={job.housing}>
                      {job.housing || "Obezbeđen"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-ink-3 block">Period</span>
                    <span className="font-semibold text-ink-2">{job.period || "Letnja sezona"}</span>
                  </div>
                </div>

                {job.summary && (
                  <p className="text-xs text-ink-3 line-clamp-2 pt-1 border-t border-line">
                    {job.summary}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs font-semibold text-ink-3">
                  Nivo engleskog: {job.englishLevel || "B2"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(job)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                    <span>Izmeni</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(job.id, job.title)}
                    className="inline-flex items-center gap-1 rounded-lg border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 hover:bg-surface transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>Obriši</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal za unos i izmenu posla */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-6 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-line space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {editingJob ? "Izmena radne ponude" : "Unos novog posla u bazu"}
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  Popunite detalje o poslodavcu i poziciji koja će se nuditi kandidatima.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Naziv radne pozicije
                  </label>
                  <input
                    value={form.title}
                    onChange={upd("title")}
                    placeholder="npr. Spasilac na bazenu / Lifeguard"
                    className={fieldCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Naziv poslodavca / kompanije
                  </label>
                  <input
                    value={form.employer}
                    onChange={upd("employer")}
                    placeholder="npr. Ocean Breeze Resort LLC"
                    className={fieldCls}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Kategorija posla
                  </label>
                  <select value={form.category} onChange={upd("category")} className={fieldCls}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Grad i savezna država
                  </label>
                  <input
                    value={form.city}
                    onChange={upd("city")}
                    placeholder="npr. Ocean City, MD"
                    className={fieldCls}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Satnica (USD/h)
                  </label>
                  <input
                    value={form.wage}
                    onChange={upd("wage")}
                    placeholder="npr. $16.50 / sat"
                    className={fieldCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Nedeljno radnih sati
                  </label>
                  <input
                    value={form.hoursPerWeek}
                    onChange={upd("hoursPerWeek")}
                    placeholder="npr. 35-40 h"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Potreban nivo engleskog
                  </label>
                  <select value={form.englishLevel} onChange={upd("englishLevel")} className={fieldCls}>
                    <option value="B1">B1 (Srednji)</option>
                    <option value="B2">B2 (Viši srednji)</option>
                    <option value="C1">C1 (Napredni)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Smeštaj (opis i cena)
                  </label>
                  <input
                    value={form.housing}
                    onChange={upd("housing")}
                    placeholder="npr. Obezbeđen smeštaj ($110/nedeljno)"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Period rada (od - do)
                  </label>
                  <input
                    value={form.period}
                    onChange={upd("period")}
                    placeholder="npr. 25. maj - 25. septembar"
                    className={fieldCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">
                  Kratak sažetak pozicije
                </label>
                <input
                  value={form.summary}
                  onChange={upd("summary")}
                  placeholder="Kratak opis posla u jednoj ili dve rečenice"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">
                  Detaljan opis zaduženja i uslova
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={upd("description")}
                  placeholder="Opis radnih dužnosti, lokacije, pogodnosti i zahteva poslodavca..."
                  className={`${fieldCls} resize-y`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-line-strong bg-white px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-2"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-ink px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-950"
                >
                  {editingJob ? "Sačuvaj izmene" : "Kreiraj posao"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
