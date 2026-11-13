// front/src/components/admin/ui.jsx
import { useEffect } from "react";

export const FIELD_CLS =
  "w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-3/70 focus:border-ink focus:outline-hidden focus:ring-2 focus:ring-ink/10";

/* ---------- IKONICE ---------- */
const ic = "h-[18px] w-[18px]";

export function CheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SiteIcon({ className = ic }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 6.5h.01" />
    </svg>
  );
}

export function UsersIcon({ className = ic }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14c2.3.4 4 2.3 4 5" />
    </svg>
  );
}

export function BanknotesIcon({ className = ic }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export function CommsIcon({ className = ic }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 5 8-5" />
    </svg>
  );
}

export function KnowledgeIcon({ className = ic }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v15.5H5.5A1.5 1.5 0 0 1 4 18V5.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H12v15.5h6.5A1.5 1.5 0 0 0 20 18V5.5z" />
    </svg>
  );
}

export function TagNavIcon({ className = ic }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function LogoutIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}

export function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function EditIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function TrashIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function MailIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function UserCheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

export function UserXIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

export function XIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

/* ---------- STATUSI I TOK ---------- */
export const STATUS = {
  applying: { labelKey: "admin.statusApplying", defaultLabel: "Prijava i selekcija", tone: "slate" },
  review: { labelKey: "admin.statusReview", defaultLabel: "Registracija", tone: "amber" },
  registered: { labelKey: "admin.statusReview", defaultLabel: "Registracija", tone: "amber" },
  docs: { labelKey: "admin.statusDocs", defaultLabel: "Korak 1: Dokumenta", tone: "blue" },
  in_review: { labelKey: "admin.statusDocs", defaultLabel: "Korak 1: Dokumenta", tone: "blue" },
  job: { labelKey: "admin.statusJob", defaultLabel: "Korak 2: Posao", tone: "violet" },
  departure: { labelKey: "admin.statusDeparture", defaultLabel: "Čekanje na vizu", tone: "amber" },
  ready: { labelKey: "admin.statusReady", defaultLabel: "Viza odobrena", tone: "green" },
  rejected: { labelKey: "admin.statusRejected", defaultLabel: "Prijava odbijena", tone: "red" },
};

export const STATUS_FLOW = {
  applying: {
    nextId: "review",
    nextLabel: "Odobri prijavu & Pozovi",
    actionDesc: "Prebaci u fazu Registracije",
    stepIndex: 0,
  },
  review: {
    nextId: "docs",
    nextLabel: "Prebaci na Korak 1",
    actionDesc: "Potvrdi ugovor i I ratu (otključaj dokumenta)",
    stepIndex: 1,
  },
  registered: {
    nextId: "docs",
    nextLabel: "Prebaci na Korak 1",
    actionDesc: "Potvrdi ugovor i I ratu (otključaj dokumenta)",
    stepIndex: 1,
  },
  docs: {
    nextId: "job",
    nextLabel: "Prebaci na Korak 2",
    actionDesc: "Odobri dosije i prebaci na izbor posla",
    stepIndex: 2,
  },
  in_review: {
    nextId: "job",
    nextLabel: "Prebaci na Korak 2",
    actionDesc: "Odobri dosije i prebaci na izbor posla",
    stepIndex: 2,
  },
  job: {
    nextId: "departure",
    nextLabel: "Prebaci na Čekanje vize",
    actionDesc: "Potvrdi Job Offer i II ratu (DS-2019 & Ambasada)",
    stepIndex: 3,
  },
  departure: {
    nextId: "ready",
    nextLabel: "Odobri vizu (Spreman)",
    actionDesc: "Potvrdi odobrenu J-1 vizu i spreman polazak",
    stepIndex: 4,
  },
  ready: {
    nextId: null,
    nextLabel: null,
    actionDesc: "Viza odobrena — spreman za polazak",
    stepIndex: 5,
  },
};

export const PIPELINE_STEPS = [
  { id: "review", label: "Registracija", stepIndex: 1 },
  { id: "docs", label: "Korak 1: Dokumenta", stepIndex: 2 },
  { id: "job", label: "Korak 2: Posao", stepIndex: 3 },
  { id: "departure", label: "Čekanje na vizu", stepIndex: 4 },
  { id: "ready", label: "Viza odobrena", stepIndex: 5 },
];

export const TONE = {
  slate: "bg-surface-2 text-ink-2",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-surface-2 text-ink",
  violet: "bg-surface-2 text-ink",
  green: "bg-emerald-100 text-emerald-700",
};

export function BriefcaseIcon({ className = ic }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

export const NAV = [
  { id: "users", labelKey: "admin.navUsers", defaultLabel: "Korisnici", Icon: UsersIcon },
  { id: "jobs", labelKey: "admin.navJobs", defaultLabel: "Baza poslova", Icon: BriefcaseIcon },
  { id: "finances", labelKey: "admin.navFinances", Icon: BanknotesIcon },
  { id: "discounts", labelKey: "admin.navDiscounts", Icon: TagNavIcon },
  { id: "site", labelKey: "admin.navSite", Icon: SiteIcon },
  { id: "comms", labelKey: "admin.navComms", Icon: CommsIcon },
  { id: "chatbot", labelKey: "admin.navChat", Icon: KnowledgeIcon },
];

/* ---------- UI KOMPONENTE ---------- */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold leading-[1.1] text-ink">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({ children, onClick, type = "button", disabled = false, className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-line bg-white ${className}`}>{children}</div>;
}

export function EmptyState({ children }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="max-w-sm text-sm text-ink-3">{children}</p>
    </Card>
  );
}

export function StatCard({ label, value, accent = false }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-ink">{value}</span>
        {accent && <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />}
      </p>
    </Card>
  );
}

export function Badge({ tone = "slate", children }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${TONE[tone] || TONE.slate}`}>{children}</span>;
}

export function GhostIconButton({ onClick, label, children, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ${
        danger ? "text-red-500 hover:bg-red-50" : "text-ink-3 hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-ink">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function Modal({ title, onClose, children, footer, wide = false, extraWide = false, panel = false, header = null, bodyClassName = "" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const widthClass = panel
    ? "max-w-[1320px]"
    : extraWide
    ? "max-w-5xl xl:max-w-6xl 2xl:max-w-[1380px]"
    : wide
    ? "max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl"
    : "max-w-xl lg:max-w-2xl xl:max-w-3xl";

  return (
    <div className={`fixed inset-0 z-[80] flex justify-center ${panel ? "items-stretch p-0 sm:p-4 lg:p-6" : "items-center p-3 sm:p-5 lg:p-8"}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex w-full flex-col overflow-hidden bg-white shadow-2xl transition-all ${panel ? "h-full sm:rounded-2xl" : "max-h-[92vh] rounded-2xl border border-line"} ${widthClass}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4 sm:px-8">
          {header || <h2 className="text-lg font-semibold leading-snug text-ink">{title}</h2>}
          <GhostIconButton label="Zatvori" onClick={onClose}><XIcon /></GhostIconButton>
        </div>
        <div className={bodyClassName || "flex-1 overflow-y-auto p-6 sm:p-8"}>{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-6 py-4 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
