// front/src/data/candidateStore/discounts.js
// Promocije, popusti, afilijati (cashback) i grupni popusti (5+ uslov)

import { PROMOTIONS_KEY, loadData, saveData } from "./storage.js";
import { DEFAULT_PROMOTIONS, RETIRED_PROMOTION_IDS } from "../discounts.js";
import { saveCandidate } from "./candidates.js";
import { getCandidates } from "./session.js";

export function getPromotions() {
  const loaded = loadData(PROMOTIONS_KEY, null);
  if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
    saveData(PROMOTIONS_KEY, DEFAULT_PROMOTIONS);
    return DEFAULT_PROMOTIONS;
  }
  return loaded.filter((p) => !RETIRED_PROMOTION_IDS.includes(p.id));
}

export function savePromotions(promotions) {
  saveData(PROMOTIONS_KEY, promotions);
  fetch("/api/public/portal-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      action: "savePromotions",
      payload: { promotions },
    }),
  }).catch(() => {});
  return promotions;
}

export function addPromotion(newPromo) {
  const list = getPromotions();
  const slug = (newPromo.name || "promo")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
  const promo = {
    id: newPromo.id || `${slug}-${Date.now().toString().slice(-4)}`,
    code: (newPromo.code || `PROMO-${Math.floor(100 + Math.random() * 900)}`).trim().toUpperCase(),
    name: newPromo.name?.trim() || "Nova promocija",
    title: newPromo.title?.trim() || newPromo.name?.trim() || "Nova promocija",
    description: newPromo.description?.trim() || "",
    amount: Math.max(0, Number(newPromo.amount) || 0),
    currency: newPromo.currency || "USD",
    timing: newPromo.timing === "immediate" ? "immediate" : "end",
    timingLabel:
      newPromo.timing === "immediate"
        ? "Obračunava se odmah"
        : "Obračunava se na kraju (poslednja rata)",
    conditionType: newPromo.conditionType || "none",
    conditionText: newPromo.conditionText || "",
    minMembers: Number(newPromo.minMembers) || (newPromo.conditionType === "group" ? 5 : undefined),
    active: newPromo.active !== false,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  const updated = [promo, ...list];
  savePromotions(updated);
  return promo;
}

export function updatePromotion(updatedPromo) {
  const list = getPromotions();
  const index = list.findIndex((p) => p.id === updatedPromo.id);
  if (index >= 0) {
    const merged = { ...list[index], ...updatedPromo };
    merged.timingLabel =
      merged.timing === "immediate"
        ? "Obračunava se odmah"
        : "Obračunava se na kraju (poslednja rata)";
    list[index] = merged;
    savePromotions(list);
    return merged;
  }
  return addPromotion(updatedPromo);
}

export function deletePromotion(id) {
  const list = getPromotions();
  const updated = list.filter((p) => p.id !== id);
  savePromotions(updated);
  return updated;
}

/**
 * Pomoćna funkcija za proveru da li kandidat ima posao i vizu.
 */
export function getCandidateQualificationStatus(c) {
  if (!c) return { hasJob: false, hasVisa: false, isQualified: false };
  const hasJob = Boolean(
    c.hasJob ??
    (c.status === "job" || c.status === "departure" || c.status === "ready" || c.jobOfferConfirmed)
  );
  const hasVisa = Boolean(
    c.hasVisa ??
    (c.status === "departure" || c.status === "ready" || c.visaApproved)
  );
  return {
    hasJob,
    hasVisa,
    isQualified: hasJob && hasVisa,
  };
}

/**
 * Statistika preporučenih prijatelja za afilijata.
 * Pravilo: popust za svakog dovedenog se dobija samo ako on prođe viziranje i dobije posao!
 */
export function getCandidateAffiliateStats(candidateIdOrEmail) {
  const candidates = getCandidates();
  const candidate = candidates.find(
    (c) =>
      (candidateIdOrEmail && c.id === candidateIdOrEmail) ||
      (candidateIdOrEmail && c.email?.toLowerCase() === String(candidateIdOrEmail).toLowerCase())
  );

  const refCode = candidate?.referralCode || (candidate ? `AA-REF-${String(candidate.id).replace(/\D/g, '').slice(-4) || '842'}` : "");
  const normEmail = (candidate?.email || "").toLowerCase();

  // Pronađi sve kandidate koji su naveli ovaj referral kod ili email
  const referrals = candidates.filter((c) => {
    if (candidate && c.id === candidate.id) return false;
    if (candidate && c.email?.toLowerCase() === normEmail) return false;
    const ref = (c.referredBy || "").trim().toUpperCase();
    const byEmail = (c.referredByEmail || "").trim().toLowerCase();
    return (
      (ref && refCode && ref === refCode.toUpperCase()) ||
      (byEmail && normEmail && byEmail === normEmail) ||
      (ref && normEmail && ref === normEmail.toUpperCase())
    );
  });

  const detailedReferrals = referrals.map((r) => {
    const { hasJob, hasVisa, isQualified } = getCandidateQualificationStatus(r);
    return {
      id: r.id,
      name: `${r.firstName || ""} ${r.lastName || ""}`.trim() || r.email || "Prijatelj",
      email: r.email,
      registeredAt: r.createdAt || r.registeredAt,
      status: r.status,
      hasJob,
      hasVisa,
      isQualified, // i vizu i posao
    };
  });

  const qualifiedCount = detailedReferrals.filter((r) => r.isQualified).length;
  const withJobCount = detailedReferrals.filter((r) => r.hasJob).length;
  const withVisaCount = detailedReferrals.filter((r) => r.hasVisa).length;
  const earnedDiscount = qualifiedCount * 100; // $100 po kvalifikovanom prijatelju na poslednjoj rati

  return {
    referralCode: refCode,
    referralLink: typeof window !== "undefined" ? `${window.location.origin}/prijava?ref=${refCode}` : `?ref=${refCode}`,
    referrals: detailedReferrals,
    totalReferred: detailedReferrals.length,
    withJobCount,
    withVisaCount,
    qualifiedCount,
    earnedDiscount,
    rewardPerPerson: 100,
  };
}

/**
 * Statistika grupe.
 * Pravilo: popust za grupu se dobija samo ako preko 5+ dobije vizu i posao!
 */
export function getGroupDiscountStats(groupCode) {
  if (!groupCode || !groupCode.trim()) return null;
  const normCode = groupCode.trim().toUpperCase();
  const candidates = getCandidates();

  const members = candidates.filter((c) => (c.groupCode || "").trim().toUpperCase() === normCode);

  const detailedMembers = members.map((m) => {
    const { hasJob, hasVisa, isQualified } = getCandidateQualificationStatus(m);
    return {
      id: m.id,
      name: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email || "Član grupe",
      email: m.email,
      status: m.status,
      hasJob,
      hasVisa,
      isQualified, // i vizu i posao
    };
  });

  const qualifiedCount = detailedMembers.filter((m) => m.isQualified).length;
  const withJobCount = detailedMembers.filter((m) => m.hasJob).length;
  const withVisaCount = detailedMembers.filter((m) => m.hasVisa).length;
  const isGroupQualified = qualifiedCount >= 5; // najmanje 5 kandidata sa vizom i poslom

  return {
    groupCode: normCode,
    members: detailedMembers,
    totalMembers: detailedMembers.length,
    withJobCount,
    withVisaCount,
    qualifiedCount,
    minRequired: 5,
    isGroupQualified,
    discountPerMember: 100,
  };
}

/**
 * Promena popusta kandidata.
 * Pravilo: Može se koristiti samo JEDAN popust.
 * Ako je neko izabrao popust na početku, a posle želi da ga promeni u neki drugi na kraju,
 * on to može uraditi. Ova funkcija zamenjuje prethodni popust novim.
 */
export function changeCandidateDiscount(candidateIdOrEmail, promotionId, extraDetails = {}) {
  const candidates = getCandidates();
  const candidate = candidates.find(
    (c) =>
      (candidateIdOrEmail && c.id === candidateIdOrEmail) ||
      (candidateIdOrEmail && c.email?.toLowerCase() === String(candidateIdOrEmail).toLowerCase())
  );
  if (!candidate) return null;

  if (!promotionId || promotionId === "none") {
    // Uklanjanje popusta
    const updated = {
      ...candidate,
      discountId: null,
      discount: 0,
      discountTiming: null,
      discountNote: "",
      discountDetails: null,
      finalPrice: candidate.basePrice || 1850,
    };
    return saveCandidate(updated);
  }

  const promotions = getPromotions();
  const promo = promotions.find((p) => p.id === promotionId);
  if (!promo) return candidate;

  // Izračunaj iznos popusta (za afilijate i grupe može biti dinamičan)
  let discAmount = promo.amount;
  if (promo.conditionType === "affiliate") {
    const affStats = getCandidateAffiliateStats(candidate.id || candidate.email);
    discAmount = Math.max(100, affStats.earnedDiscount || 100);
  }

  const basePrice = Number(candidate.basePrice) || 1850;
  // Ako se obračunava odmah, umanjuje cenu ugovora odmah.
  // Ako se obračunava na kraju (poslednja rata), cena programa ostaje evidentirana, a popust ide na poslednju ratu.
  const finalPrice = promo.timing === "immediate"
    ? Math.max(0, basePrice - discAmount)
    : basePrice;

  const updatedCandidate = {
    ...candidate,
    discountId: promo.id,
    discountCode: promo.code,
    discountTiming: promo.timing,
    discount: discAmount,
    discountNote: `${promo.name} (${promo.timingLabel})`,
    discountDetails: {
      ...extraDetails,
      promoName: promo.name,
      timing: promo.timing,
      conditionType: promo.conditionType,
      selectedAt: new Date().toISOString(),
    },
    finalPrice,
    ...(extraDetails.groupCode ? { groupCode: extraDetails.groupCode.trim().toUpperCase() } : {}),
  };

  return saveCandidate(updatedCandidate);
}

/**
 * Ručno povezivanje afilijata preko emaila od strane administratora.
 * Povezuje preporučioca (referrer) i dovedenog prijatelja (referred).
 */
export function linkAffiliateByEmail(referrerEmail, referredEmail, options = {}) {
  const normReferrer = String(referrerEmail || "").trim().toLowerCase();
  const normReferred = String(referredEmail || "").trim().toLowerCase();

  if (!normReferrer || !normReferrer.includes("@")) {
    return { success: false, error: "Molimo unesite validnu email adresu preporučioca." };
  }
  if (!normReferred || !normReferred.includes("@")) {
    return { success: false, error: "Molimo unesite validnu email adresu dovedenog kandidata." };
  }
  if (normReferrer === normReferred) {
    return { success: false, error: "Kandidat ne može sam sebe navesti kao preporučioca." };
  }

  const list = getCandidates();
  let referrer = list.find((c) => c.email?.toLowerCase() === normReferrer);

  // Ako preporučilac još ne postoji, kreiramo nalog / profil za njega
  if (!referrer) {
    const newRefCode = `AA-REF-${Math.floor(1000 + Math.random() * 9000)}`;
    referrer = saveCandidate({
      id: "cand-" + Date.now() + "-ref",
      email: normReferrer,
      firstName: options.referrerName?.trim().split(" ")[0] || normReferrer.split("@")[0],
      lastName: options.referrerName?.trim().split(" ").slice(1).join(" ") || "",
      referralCode: newRefCode,
      status: "review",
      packageId: "swt-full",
      packageName: "Work & Travel USA — Full Placement",
      basePrice: 1850,
      finalPrice: 1850,
      createdAt: new Date().toISOString(),
    });
  }

  const referralCode = referrer.referralCode || `AA-REF-${Math.floor(1000 + Math.random() * 9000)}`;
  if (!referrer.referralCode) {
    referrer = saveCandidate({ ...referrer, referralCode });
  }

  let referred = list.find((c) => c.email?.toLowerCase() === normReferred);

  if (referred) {
    const updatedReferred = {
      ...referred,
      referredBy: referralCode,
      referredByEmail: normReferrer,
      ...(options.hasJob !== undefined ? { hasJob: Boolean(options.hasJob) } : {}),
      ...(options.hasVisa !== undefined ? { hasVisa: Boolean(options.hasVisa) } : {}),
      ...(options.referredName ? {
        firstName: options.referredName.trim().split(" ")[0] || referred.firstName,
        lastName: options.referredName.trim().split(" ").slice(1).join(" ") || referred.lastName,
      } : {}),
    };
    saveCandidate(updatedReferred);
  } else {
    const newReferred = {
      id: "cand-" + Date.now() + "-aff",
      email: normReferred,
      firstName: options.referredName?.trim().split(" ")[0] || normReferred.split("@")[0],
      lastName: options.referredName?.trim().split(" ").slice(1).join(" ") || "Prijatelj",
      referredBy: referralCode,
      referredByEmail: normReferrer,
      referralCode: `AA-REF-${Math.floor(1000 + Math.random() * 9000)}`,
      hasJob: Boolean(options.hasJob),
      hasVisa: Boolean(options.hasVisa),
      status: options.hasVisa && options.hasJob ? "ready" : options.hasJob ? "job" : "review",
      packageId: "swt-full",
      packageName: "Work & Travel USA — Full Placement",
      basePrice: 1850,
      finalPrice: 1850,
      createdAt: new Date().toISOString(),
    };
    saveCandidate(newReferred);
  }

  // Ažuriraj popust preporučioca ukoliko ima afilijate promociju
  const affStats = getCandidateAffiliateStats(normReferrer);
  if (referrer.discountId === "promo-affiliate" || referrer.discountDetails?.conditionType === "affiliate") {
    const updatedDiscount = Math.max(100, affStats.earnedDiscount || 100);
    saveCandidate({
      ...referrer,
      discount: updatedDiscount,
      discountNote: `Dovedi prijatelja — Afilijate (${affStats.qualifiedCount} kvalifikovanih)`,
    });
  }

  return {
    success: true,
    referrer,
    referralCode,
    stats: affStats,
    message: `Uspešno povezano: ${normReferrer} je evidentiran kao preporučilac za ${normReferred}.`,
  };
}

/**
 * Uklanjanje afilijat veze za određenog dovedenog kandidata.
 */
export function unlinkAffiliate(referredIdOrEmail) {
  const list = getCandidates();
  const cand = list.find(
    (c) =>
      c.id === referredIdOrEmail ||
      c.email?.toLowerCase() === String(referredIdOrEmail).toLowerCase()
  );
  if (!cand) return false;
  const oldReferrerEmail = cand.referredByEmail;
  const updated = {
    ...cand,
    referredBy: "",
    referredByEmail: "",
  };
  saveCandidate(updated);

  // Osveži popust starog preporučioca
  if (oldReferrerEmail) {
    const affStats = getCandidateAffiliateStats(oldReferrerEmail);
    const oldReferrer = list.find((c) => c.email?.toLowerCase() === oldReferrerEmail.toLowerCase());
    if (oldReferrer && (oldReferrer.discountId === "promo-affiliate" || oldReferrer.discountDetails?.conditionType === "affiliate")) {
      saveCandidate({
        ...oldReferrer,
        discount: affStats.earnedDiscount || 0,
        discountNote: affStats.earnedDiscount ? `Dovedi prijatelja — Afilijate (${affStats.qualifiedCount} kvalifikovanih)` : "",
      });
    }
  }

  return true;
}
