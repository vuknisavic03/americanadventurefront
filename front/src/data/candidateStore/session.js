// front/src/data/candidateStore/session.js
// Sesija i lokalni keš: ko je prijavljen, lista kandidata i sinhronizacija sa backendom.
// Namerno mali modul bez zavisnosti — jedino što javni deo sajta mora da učita iz store-a.

import { CANDIDATES_KEY, INVITATIONS_KEY, CURRENT_USER_KEY, PROMOTIONS_KEY, loadData, saveData } from "./storage.js";
import { INITIAL_CANDIDATES } from "./mockSeed.js";

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
