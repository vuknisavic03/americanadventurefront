// front/src/data/jobsStore.js
// Perzistentno skladište za Bazu poslova u SAD (CRUD operacije i dodela kandidatima)

import defaultJobItems from "./jobItems";

const JOBS_STORAGE_KEY = "aa_us_jobs_catalog";

function loadStoredJobs() {
  if (typeof window === "undefined") return defaultJobItems;
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(defaultJobItems));
      return defaultJobItems;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return defaultJobItems;
  } catch (err) {
    console.warn("Greška pri učitavanju poslova iz localStorage:", err);
    return defaultJobItems;
  }
}

function persistJobs(jobs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    window.dispatchEvent(new Event("aa_jobs_updated"));
  } catch (err) {
    console.warn("Greška pri čuvanju poslova u localStorage:", err);
  }
}

export function getJobs() {
  return loadStoredJobs();
}

export function getJobById(id) {
  const jobs = loadStoredJobs();
  return jobs.find((j) => String(j.id) === String(id)) || null;
}

export function saveJob(jobData) {
  const jobs = loadStoredJobs();
  const now = new Date().toISOString();

  if (jobData.id) {
    const idx = jobs.findIndex((j) => String(j.id) === String(jobData.id));
    if (idx >= 0) {
      const updated = {
        ...jobs[idx],
        ...jobData,
        updatedAt: now,
      };
      jobs[idx] = updated;
      persistJobs(jobs);
      return updated;
    }
  }

  const newId = jobData.id || `job-${Date.now()}`;
  const newJob = {
    ...jobData,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  jobs.unshift(newJob);
  persistJobs(jobs);
  return newJob;
}

export function deleteJob(id) {
  const jobs = loadStoredJobs();
  const filtered = jobs.filter((j) => String(j.id) !== String(id));
  persistJobs(filtered);
  return filtered;
}

export function resetJobsToDefault() {
  persistJobs(defaultJobItems);
  return defaultJobItems;
}

/**
 * Vraća listu poslova koji su ponuđeni određenom kandidatu.
 * Ako je candidate.offerAllJobs === false i postoji candidate.offeredJobIds, vraća samo te poslove.
 * U suprotnom podrazumevano vraća sve poslove.
 */
export function getOfferedJobsForCandidate(candidate) {
  const allJobs = getJobs();
  if (!candidate) return allJobs;

  if (candidate.offerAllJobs === false && Array.isArray(candidate.offeredJobIds)) {
    return allJobs.filter((j) => candidate.offeredJobIds.includes(j.id));
  }

  return allJobs;
}
