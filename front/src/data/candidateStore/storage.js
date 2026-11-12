// front/src/data/candidateStore/storage.js
// Pomoćne funkcije i ključevi za lokalni keš u localStorage / memoriji

try {
  if (typeof localStorage !== 'undefined') {
    [
      'aa_invitations_v6', 'aa_candidates_v6', 'aa_current_user_v6', 'aa_promotions_v6', 'aa_invoices_v1',
      'aa_invitations_v5', 'aa_candidates_v5', 'aa_current_user_v5', 'aa_promotions_v5',
      'aa_invitations_v4', 'aa_candidates_v4', 'aa_current_user_v4',
      'aa_invitations_v3', 'aa_candidates_v3', 'aa_current_user_v3',
      'aa_is_admin_v4'
    ].forEach((k) => localStorage.removeItem(k));
  }
} catch {}

export const INVITATIONS_KEY = 'aa_invitations_v7';
export const CANDIDATES_KEY = 'aa_candidates_v7';
export const CURRENT_USER_KEY = 'aa_current_user_v7';
export const PROMOTIONS_KEY = 'aa_promotions_v7';

export const memoryStore = {};

export function loadData(key, fallback) {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : fallback;
  } catch {
    return fallback;
  }
}

export function saveData(key, val) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(val));
    } else {
      memoryStore[key] = val;
    }
  } catch (err) {
    console.warn("Storage write failed", err);
  }
}
