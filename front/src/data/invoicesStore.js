// invoicesStore.js
// Centralizovana evidencija faktura, Knjige izdatih računa (KIR) i obračuna po srednjem kursu NBS.

const INVOICES_KEY = "aa_invoices_v2";

export const AGENCY_INFO = {
  name: "American Adventure d.o.o. Beograd",
  activity: "Delatnost putničkih i obrazovnih agencija (79.11)",
  address: "Knez Mihailova 21/III, 11000 Beograd, Srbija",
  pib: "108425678",
  maticniBroj: "20987654",
  bankName: "Banca Intesa a.d. Beograd",
  bankAccount: "160-0000000534928-32",
  bankAccountFormatted: "160-534928-32",
  modelNumber: "97",
  licenseNumber: "OTP 45/2022 (Ministarstvo turizma i omladine RS)",
  email: "finansije@americanadventure.rs",
  phone: "+381 11 3284 555",
  web: "www.americanadventure.rs",
  taxNote:
    "Oslobođeno plaćanja PDV-a na osnovu člana 24. stav 1. tačka 1. Zakona o porezu na dodatu vrednost Republike Srbije (usluge neposredno povezane sa izvozom i međunarodnim programima kulturno-obrazovne razmene).",
};

// Srednji kursevi NBS sa 6 decimala
export const NBS_RATES = {
  EUR: 117.1524,
  USD: 108.4230,
};

let cachedNbsRates = {
  EUR: 117.1524,
  USD: 108.4230,
};
let lastFetchedNbs = 0;

/**
 * Dohvata aktuelni srednji kurs NBS za odabranu valutu (EUR / USD).
 * Koristi provereni javni servis sa keširanjem ili pada na zvanični statički kurs NBS.
 */
export async function fetchCurrentNbsRate(currency = "EUR") {
  const curr = String(currency || "EUR").toUpperCase();
  const now = Date.now();
  if (now - lastFetchedNbs < 30 * 60 * 1000 && cachedNbsRates[curr]) {
    return cachedNbsRates[curr];
  }
  try {
    if (curr === "EUR" && typeof fetch !== "undefined") {
      const res = await fetch("https://kurs.resenje.org/api/v1/currencies/eur/rates/today");
      if (res.ok) {
        const data = await res.json();
        if (data && data.exchange_middle) {
          cachedNbsRates.EUR = Number(data.exchange_middle);
          lastFetchedNbs = now;
          return cachedNbsRates.EUR;
        }
      }
    }
  } catch {
    // Fallback na zvanični statički srednji kurs NBS
  }
  return cachedNbsRates[curr] || NBS_RATES[curr] || 117.1524;
}

export function getCurrentNbsRate(currency = "EUR") {
  const curr = String(currency || "EUR").toUpperCase();
  return cachedNbsRates[curr] || NBS_RATES[curr] || 117.1524;
}

/**
 * Formatira devizni iznos u dinarsku protivvrednost po kursu NBS u standardnom formatu (npr. 46.860,96).
 */
export function formatRsdAmount(amountInCurrency, exchangeRate = null, currency = "EUR") {
  const rate = Number(exchangeRate) || getCurrentNbsRate(currency);
  const totalRsd = Math.round(Number(amountInCurrency || 0) * rate * 100) / 100;
  const parts = totalRsd.toFixed(2).split(".");
  const intFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intFormatted},${parts[1]}`;
}

export const PAYMENT_STATUSES = {
  PAID: { id: "PAID", label: "Plaćeno", badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PENDING: { id: "PENDING", label: "Na čekanju", badgeCls: "bg-amber-100 text-amber-800 border-amber-200" },
  PKZ_DEFERRED: { id: "PKZ_DEFERRED", label: "PKZ odloženo (SAD)", badgeCls: "bg-blue-100 text-blue-800 border-blue-200" },
  CANCELLED: { id: "CANCELLED", label: "Stornirano", badgeCls: "bg-red-100 text-red-800 border-red-200" },
};

export const PAYMENT_METHODS = {
  IPS_QR: "IPS QR nalog / Mobilno bankarstvo",
  BANK_TRANSFER: "Uplata na tekući račun",
  PKZ: "PKZ (Plaćanje Kroz Zaradu u SAD)",
  FOREIGN_TRANSFER: "Devizni priliv (Inostranstvo)",
};

const INITIAL_INVOICES = [];

const memoryStore = {};

function loadData(key, fallback) {
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

function saveData(key, val) {
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

export function getInvoices() {
  return loadData(INVOICES_KEY, INITIAL_INVOICES);
}

export function getInvoicesForCandidate(candidateId, email) {
  const all = getInvoices();
  const cId = String(candidateId || "");
  const em = (email || "").trim().toLowerCase();

  return all.filter((inv) => {
    if (cId && String(inv.candidateId) === cId) return true;
    if (em && inv.candidateEmail?.toLowerCase() === em) return true;
    return false;
  });
}

export function createInvoice(payload) {
  const all = getInvoices();
  const nextNum = all.length + 1;
  const invoiceNumber = `FAKT-2026-${String(nextNum).padStart(4, "0")}`;
  const id = `inv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const currency = payload.currency || "EUR";
  const rate = Number(payload.exchangeRate) || NBS_RATES[currency] || 117.1524;
  const originalAmount = Number(payload.originalAmount) || 0;
  const totalRsd = Number((originalAmount * rate).toFixed(2));

  const newInv = {
    id,
    invoiceNumber,
    candidateId: payload.candidateId || "",
    candidateName: payload.candidateName || "Kandidat",
    candidateEmail: payload.candidateEmail || "",
    candidateAddress: payload.candidateAddress || "Beograd",
    candidateCity: payload.candidateCity || "Beograd",
    candidateJmbg: payload.candidateJmbg || "",
    candidatePassport: payload.candidatePassport || "",
    programName: payload.programName || "Work & Travel USA",
    purpose: payload.purpose || "Uplata rate programa",
    serviceType: payload.serviceType || "RATE_1",
    currency,
    originalAmount,
    exchangeRate: rate,
    totalRsd,
    vatBaseRsd: totalRsd,
    vatRate: 0,
    vatAmountRsd: 0.0,
    issueDate: payload.issueDate || new Date().toISOString().slice(0, 10),
    deliveryDate: payload.deliveryDate || payload.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: payload.dueDate || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    paidDate: payload.status === "PAID" ? (payload.paidDate || new Date().toISOString().slice(0, 10)) : null,
    paymentMethod: payload.paymentMethod || "IPS_QR",
    status: payload.status || "PENDING",
    referenceNumber: `26-${String(1000 + nextNum)}`,
    notes: payload.notes || "",
  };

  const updated = [newInv, ...all];
  saveData(INVOICES_KEY, updated);
  return newInv;
}

/**
 * Automatski kreira ili ažurira KIR fakturu kada student prijavi ili admin potvrdi ratu (1, 2 ili 3).
 */
export function ensureCandidateInstallmentInvoice(candidate, installmentNumber, status = "PAID", options = {}) {
  if (!candidate) return null;
  const isFull =
    installmentNumber === "FULL" ||
    installmentNumber === "full" ||
    installmentNumber === 0 ||
    (candidate.paymentMethod === "now" && (installmentNumber === 1 || installmentNumber === "1"));

  const serviceType = isFull ? "RATE_FULL" : `RATE_${installmentNumber}`;
  const existingList = getInvoicesForCandidate(candidate.id, candidate.email);
  const existing = existingList.find((inv) => inv.serviceType === serviceType && inv.status !== "CANCELLED");

  const finalPrice = Number(candidate.finalPrice) || Number(candidate.basePrice) || 1750;
  const r1Amount = Number(candidate.firstInstallmentAmount) || 250;
  const r2Amount = Number(candidate.secondInstallmentAmount) || 400;
  const r3Amount = Number(candidate.thirdInstallmentAmount) || Math.max(0, finalPrice - r1Amount - r2Amount);

  const amountMap = {
    1: r1Amount,
    2: r2Amount,
    3: r3Amount,
    FULL: finalPrice,
    full: finalPrice,
    0: finalPrice,
  };
  const purposeMap = {
    1: "Uplata I rate programa — Registracija i potpisivanje ugovora (Work & Travel USA)",
    2: `Uplata II rate programa — Potvrđena radna ponuda (${candidate.selectedJobEmployer || "Job Offer"})`,
    3: candidate.paymentMethod === "later" || candidate.paymentMethod === "installments"
      ? "III rata programa — Završna rata / PKZ aranžman pred viziranje"
      : "Uplata III (završne) rate programa pred viziranje u Ambasadi SAD",
    FULL: "Uplata programa u celosti — Work & Travel USA (Jednokratno plaćanje)",
    full: "Uplata programa u celosti — Work & Travel USA (Jednokratno plaćanje)",
    0: "Uplata programa u celosti — Work & Travel USA (Jednokratno plaćanje)",
  };

  const today = options.paidDate || new Date().toISOString().slice(0, 10);
  const originalAmount = amountMap[isFull ? "FULL" : installmentNumber] || finalPrice;
  const rate = Number(options.exchangeRate) || getCurrentNbsRate("EUR");

  if (existing) {
    if (existing.status !== status) {
      updateInvoiceStatus(
        existing.id,
        status,
        status === "PAID" ? today : null,
        status === "PAID"
          ? isFull
            ? "Uplata programa u celosti potvrđena od strane administratora."
            : `Uplata ${installmentNumber}. rate potvrđena od strane administratora.`
          : existing.notes,
        rate
      );
    }
    return existing;
  }

  return createInvoice({
    candidateId: candidate.id,
    candidateName: candidate.name || `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || candidate.email,
    candidateEmail: candidate.email || "",
    candidateCity: candidate.studyCity || "Beograd",
    candidateJmbg: candidate.jmbg || "",
    candidatePassport: candidate.passportNumber || candidate.idCardNumber || "",
    programName: candidate.packageName || candidate.program || "Work & Travel USA — Full Placement",
    purpose: purposeMap[isFull ? "FULL" : installmentNumber] || `Uplata ${installmentNumber}. rate programa`,
    serviceType,
    currency: "EUR",
    originalAmount,
    exchangeRate: rate,
    status,
    paidDate: status === "PAID" ? today : null,
    paymentMethod: installmentNumber === 3 && status === "PKZ_DEFERRED" ? "PKZ" : "IPS_QR",
    notes:
      status === "PAID"
        ? isFull
          ? "Automatski evidentirana KIR faktura za uplatu programa u celosti."
          : `Automatski evidentirana KIR faktura nakon potvrde ${installmentNumber}. rate.`
        : isFull
        ? "Generisano po prijavi uplate programa u celosti od strane kandidata."
        : `Generisano po prijavi uplate ${installmentNumber}. rate od strane kandidata.`,
  });
}

export function updateInvoiceStatus(invoiceId, newStatus, paidDate = null, notes = null, exchangeRate = null) {
  const all = getInvoices();
  const updated = all.map((inv) => {
    if (inv.id === invoiceId) {
      const finalPaidDate = newStatus === "PAID" ? (paidDate || new Date().toISOString().slice(0, 10)) : inv.paidDate;
      const finalRate = Number(exchangeRate) || inv.exchangeRate || 117.1524;
      const totalRsd = Number((inv.originalAmount * finalRate).toFixed(2));
      return {
        ...inv,
        status: newStatus,
        paidDate: finalPaidDate,
        notes: notes !== null ? notes : inv.notes,
        exchangeRate: finalRate,
        totalRsd,
        vatBaseRsd: totalRsd,
        exchangeRateLocked: newStatus === "PAID",
      };
    }
    return inv;
  });
  saveData(INVOICES_KEY, updated);
  return updated;
}

export function cancelInvoice(invoiceId, cancellationReason = "") {
  const all = getInvoices();
  const updated = all.map((inv) => {
    if (inv.id === invoiceId) {
      return {
        ...inv,
        status: "CANCELLED",
        notes: cancellationReason
          ? `STORNIRANO: ${cancellationReason} (${inv.notes || ""})`
          : `STORNIRANO (${inv.notes || ""})`,
      };
    }
    return inv;
  });
  saveData(INVOICES_KEY, updated);
  return updated;
}

/**
 * Formatira broj kao srpski dinarski iznos sa separatorima hiljada: 52.718,58 RSD
 */
export function formatRsd(num) {
  const n = Number(num) || 0;
  return (
    n.toLocaleString("sr-RS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RSD"
  );
}

/**
 * Formatira broj kao EUR iznos: 450,00 EUR
 */
export function formatEur(num) {
  const n = Number(num) || 0;
  return (
    n.toLocaleString("sr-RS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

/**
 * Pretvara novčani iznos u reči na srpskom jeziku za zvanične račune.
 * Primer: 52718.58 -> "pedeset dve hiljade sedamsto osamnaest dinara i 58/100"
 */
export function numberToWordsSr(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  const dec = Math.round((Math.abs(Number(amount) || 0) - num) * 100);
  const decStr = String(dec).padStart(2, "0");

  if (num === 0) return `nula dinara i ${decStr}/100`;

  const jed = ["", "jedan", "dva", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet"];
  const jedZ = ["", "jedna", "dve", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet"];
  const des10 = [
    "deset",
    "jedanaest",
    "dvanaest",
    "trinaest",
    "četrnaest",
    "petnaest",
    "šesnaest",
    "sedamnaest",
    "osamnaest",
    "devetnaest",
  ];
  const des = ["", "deset", "dvadeset", "trideset", "četrdeset", "pedeset", "šezdeset", "sedamdeset", "osamdeset", "devedeset"];
  const sto = ["", "sto", "dvesta", "trista", "četiristo", "petsto", "šeststo", "sedamsto", "osamsto", "devetsto"];

  function convertTriplet(n, isFemale = false) {
    let res = "";
    const s = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const j = n % 10;

    if (s > 0) res += sto[s] + " ";

    if (d === 1) {
      res += des10[j] + " ";
    } else {
      if (d > 1) res += des[d] + " ";
      if (j > 0) res += (isFemale ? jedZ[j] : jed[j]) + " ";
    }
    return res.trim();
  }

  let words = "";
  const mil = Math.floor(num / 1000000);
  const hilj = Math.floor((num % 1000000) / 1000);
  const osn = num % 1000;

  if (mil > 0) {
    const milWords = convertTriplet(mil, false);
    const lastDigit = mil % 10;
    const lastTwo = mil % 100;
    let milSuffix = "miliona";
    if (lastDigit === 1 && lastTwo !== 11) milSuffix = "milion";
    else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwo)) milSuffix = "miliona";
    words += `${milWords} ${milSuffix} `;
  }

  if (hilj > 0) {
    const hiljWords = convertTriplet(hilj, true);
    const lastDigit = hilj % 10;
    const lastTwo = hilj % 100;
    let hiljSuffix = "hiljada";
    if (lastDigit === 1 && lastTwo !== 11) hiljSuffix = "hiljada";
    else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwo)) hiljSuffix = "hiljade";
    words += `${hiljWords} ${hiljSuffix} `;
  }

  if (osn > 0) {
    words += convertTriplet(osn, false) + " ";
  }

  const cleanWords = words.trim().toLowerCase();
  return `${cleanWords} dinara i ${decStr}/100`;
}

/**
 * Eksportuje KIR knjigu u CSV format sa UTF-8 BOM-om za direktno otvaranje u Excelu
 */
export function exportKirToCsv(invoicesList) {
  const headers = [
    "Redni broj",
    "Broj fakture",
    "Datum izdavanja",
    "Datum prometa",
    "Kupac / Student",
    "JMBG",
    "Grad i adresa",
    "Svrha / Usluga",
    "Iznos u devizama",
    "Valuta",
    "Srednji kurs NBS",
    "Osnovica RSD",
    "Stopa PDV",
    "Iznos PDV RSD",
    "Ukupno RSD",
    "Nacin placanja",
    "Status",
    "Datum uplate",
    "Poziv na broj",
  ];

  const rows = (invoicesList || []).map((inv, idx) => [
    idx + 1,
    `"${inv.invoiceNumber || ""}"`,
    inv.issueDate || "",
    inv.deliveryDate || "",
    `"${inv.candidateName || ""}"`,
    `"${inv.candidateJmbg || ""}"`,
    `"${inv.candidateCity || ""} - ${inv.candidateAddress || ""}"`,
    `"${(inv.purpose || "").replace(/"/g, '""')}"`,
    (Number(inv.originalAmount) || 0).toFixed(2),
    inv.currency || "EUR",
    (Number(inv.exchangeRate) || 0).toFixed(6),
    (Number(inv.vatBaseRsd) || 0).toFixed(2),
    "0%",
    "0.00",
    (Number(inv.totalRsd) || 0).toFixed(2),
    `"${PAYMENT_METHODS[inv.paymentMethod] || inv.paymentMethod || ""}"`,
    `"${PAYMENT_STATUSES[inv.status]?.label || inv.status || ""}"`,
    inv.paidDate || "",
    `"${inv.referenceNumber || ""}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `KIR_American_Adventure_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


/**
 * Generiše standardni NBS IPS QR tekstualni payload prema zvaničnoj specifikaciji Narodne banke Srbije za instant plaćanja.
 */
export function generateNbsIpsString({
  account = "160600000072871784",
  recipient = "American Adventure d.o.o. Beograd",
  amountRsd = "46860,96",
  payer = "Student Kandidat",
  code = "289",
  purpose = "Uplata II rate programa",
  model = "97",
  reference = "AA2026R21042",
} = {}) {
  const cleanAccount = String(account).replace(/[^0-9]/g, "");
  const cleanAmount = String(amountRsd).replace(/\./g, "").trim();
  const cleanPayer = String(payer || "Student Kandidat").replace(/\|/g, "").slice(0, 70);
  const cleanPurpose = String(purpose || "Uplata rate programa").replace(/\|/g, "").slice(0, 35);
  const cleanReference = `${model}${String(reference || "").replace(/[^A-Za-z0-9]/g, "")}`;

  return `K:PR|V:01|C:1|R:${cleanAccount}|N:${recipient}|I:RSD${cleanAmount}|P:${cleanPayer}|SF:${code}|S:${cleanPurpose}|RO:${cleanReference}`;
}