import React, { useState, useMemo } from "react";
import { getOfferedJobsForCandidate } from "../data/jobsStore";

export default function JobFairModal({
  isOpen,
  onClose,
  candidate,
  currentJobId = null,
  onSelectJob = () => {},
}) {
  if (!isOpen) return null;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const jobsList = useMemo(() => {
    return getOfferedJobsForCandidate(candidate);
  }, [candidate]);

  const [viewingJob, setViewingJob] = useState(
    currentJobId ? jobsList.find((j) => j.id === currentJobId) || jobsList[0] : null
  );

  const categories = useMemo(() => {
    const set = new Set(jobsList.map((j) => j.category).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [jobsList]);

  const filteredJobs = useMemo(() => {
    return jobsList.filter((j) => {
      if (selectedCategory !== "ALL" && j.category !== selectedCategory) return false;
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
  }, [jobsList, selectedCategory, search]);

  const handleApply = (job) => {
    onSelectJob(job);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-4 flex max-h-[94vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-line overflow-hidden">
        {/* Header */}
        <div className="border-b border-line bg-ink px-6 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-ink">
                2.2
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight sm:text-lg">
                    Ponuđeni poslovi u SAD (Katalog radnih ponuda)
                  </h2>
                  <span className="rounded-full bg-white/10 text-white/85 px-3 py-1 text-xs font-medium">
                    Provereni poslodavci
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Izaberite radnu ponudu za koju ste zainteresovani. Agencija će vam nakon izbora organizovati i zakazati intervju sa poslodavcem.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-white/20 hover:text-white transition-colors"
            >
              Zatvori
            </button>
          </div>
        </div>

        {/* Filteri */}
        <div className="border-b border-line bg-surface px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraga po nazivu, poslodavcu, gradu..."
            className="w-full sm:w-80 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink-3/70 focus:outline-hidden focus:border-ink"
          />

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink focus:outline-hidden"
            >
              <option value="ALL">Sve kategorije</option>
              {categories.filter((c) => c !== "ALL").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold text-ink-3">
              Ponuđeno: {filteredJobs.length}
            </span>
          </div>
        </div>

        {/* Lista poslova */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-ink-3 text-sm font-medium">
              Trenutno nema poslova koji odgovaraju kriterijumima pretrage.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                const isSelected = candidate?.selectedJobId === job.id || candidate?.selectedJobTitle === job.title;
                return (
                  <div
                    key={job.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-ink bg-surface ring-1 ring-ink/10"
                        : "border-line bg-white hover:border-line-strong"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2">
                            {job.category || "Posao u SAD"}
                          </span>
                          <h3 className="text-base font-bold text-ink mt-1">
                            {job.title}
                          </h3>
                          <p className="text-xs font-semibold text-ink-2">
                            {job.employer}
                          </p>
                        </div>
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 shrink-0">
                          {job.wage}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-xs font-semibold text-neutral-400 block">Lokacija</span>
                          <span className="font-semibold text-ink">{job.city}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-neutral-400 block">Radno vreme</span>
                          <span className="font-semibold text-ink">{job.hoursPerWeek || "35-40 h"}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-neutral-400 block">Smeštaj</span>
                          <span className="font-semibold text-ink truncate block" title={job.housing}>
                            {job.housing}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-neutral-400 block">Period</span>
                          <span className="font-semibold text-ink">{job.period || "Leto 2026"}</span>
                        </div>
                      </div>

                      {job.summary && (
                        <p className="text-xs text-ink-2 line-clamp-2 pt-1 border-t border-line">
                          {job.summary}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-xs font-semibold text-ink-3">
                        Engleski: {job.englishLevel || "B2"}
                      </span>
                      {isSelected ? (
                        <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                          Trenutno izabrano
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApply(job)}
                          className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-950 transition-colors"
                        >
                          Prijavi se za ovaj posao
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
