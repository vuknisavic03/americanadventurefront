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
      <div className="relative my-4 flex max-h-[94vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden">
        {/* Header */}
        <div className="border-b border-black/[0.08] bg-slate-900 px-6 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-sm font-black text-[var(--brand-ink)] shadow-xs">
                2.2
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight sm:text-lg">
                    Ponuđeni poslovi u SAD (Katalog radnih ponuda)
                  </h2>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold">
                    PROVERENI POSLODAVCI
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Izaberite radnu ponudu za koju ste zainteresovani. Agencija će vam nakon izbora organizovati i zakazati intervju sa poslodavcem.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
            >
              Zatvori
            </button>
          </div>
        </div>

        {/* Filteri */}
        <div className="border-b border-black/[0.06] bg-slate-50 px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraga po nazivu, poslodavcu, gradu..."
            className="w-full sm:w-80 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800"
          />

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="ALL">Sve kategorije</option>
              {categories.filter((c) => c !== "ALL").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-slate-500">
              Ponuđeno: {filteredJobs.length}
            </span>
          </div>
        </div>

        {/* Lista poslova */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
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
                        ? "border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400"
                        : "border-black/10 bg-white hover:border-black/25"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-black/[0.06] pb-2.5">
                        <div>
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                            {job.category || "Posao u SAD"}
                          </span>
                          <h3 className="text-base font-black text-slate-950 mt-1">
                            {job.title}
                          </h3>
                          <p className="text-xs font-bold text-slate-600">
                            {job.employer}
                          </p>
                        </div>
                        <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-black text-amber-900 shrink-0">
                          {job.wage}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Lokacija</span>
                          <span className="font-semibold text-slate-800">{job.city}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Radno vreme</span>
                          <span className="font-semibold text-slate-800">{job.hoursPerWeek || "35-40 h"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Smeštaj</span>
                          <span className="font-semibold text-slate-800 truncate block" title={job.housing}>
                            {job.housing}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Period</span>
                          <span className="font-semibold text-slate-800">{job.period || "Leto 2026"}</span>
                        </div>
                      </div>

                      {job.summary && (
                        <p className="text-xs text-slate-600 line-clamp-2 pt-1 border-t border-black/[0.04]">
                          {job.summary}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3">
                      <span className="text-[11px] font-bold text-slate-500">
                        Engleski: {job.englishLevel || "B2"}
                      </span>
                      {isSelected ? (
                        <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs">
                          Trenutno izabrano
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApply(job)}
                          className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-black transition-colors shadow-2xs"
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
