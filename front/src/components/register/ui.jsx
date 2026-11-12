// front/src/components/register/ui.jsx
// Ikonice, stilovi i koračni indikator (stepper) za registraciju

export const BRAND_YELLOW = "#FDD503";
export const INK = "#231f20";

export const labelCls = "block text-sm font-semibold text-[var(--brand-ink)]";
export const inputCls =
  "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-[var(--brand-ink)] transition-colors duration-150 placeholder:text-black/35 focus:border-[var(--brand-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-ink)]/15";

export function CheckIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function BackIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

export function CameraIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function ScanIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

export function RegisterStepper({ step, t }) {
  return (
    <div className="mt-8 flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/55 sm:px-4">
      <span className={`flex items-center gap-1.5 ${step === 1 ? "text-[var(--brand-ink)] font-extrabold" : ""}`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 1 ? "bg-[var(--brand-yellow)] text-black font-black" : step > 1 ? "bg-[var(--brand-ink)] text-white" : "bg-black/10"}`}>
          {step > 1 ? "✓" : "1"}
        </span>
        <span className="hidden sm:inline">{t("reg.stepActivation")}</span>
      </span>
      <span className="h-0.5 w-6 bg-black/15 sm:w-10" />

      <span className={`flex items-center gap-1.5 ${step === 2 ? "text-[var(--brand-ink)] font-extrabold" : ""}`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 2 ? "bg-[var(--brand-yellow)] text-black font-black" : step > 2 ? "bg-[var(--brand-ink)] text-white" : "bg-black/10"}`}>
          {step > 2 ? "✓" : "2"}
        </span>
        <span className="hidden sm:inline">{t("reg.stepPassport")}</span>
      </span>
      <span className="h-0.5 w-6 bg-black/15 sm:w-10" />

      <span className={`flex items-center gap-1.5 ${step === 3 ? "text-[var(--brand-ink)] font-extrabold" : ""}`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 3 ? "bg-[var(--brand-yellow)] text-black font-black" : step > 3 ? "bg-[var(--brand-ink)] text-white" : "bg-black/10"}`}>
          {step > 3 ? "✓" : "3"}
        </span>
        <span className="hidden sm:inline">{t("reg.stepPayment")}</span>
      </span>
      <span className="h-0.5 w-6 bg-black/15 sm:w-10" />

      <span className={`flex items-center gap-1.5 ${step === 4 ? "text-[var(--brand-ink)] font-extrabold" : ""}`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 4 ? "bg-[var(--brand-yellow)] text-black font-black" : "bg-black/10"}`}>
          4
        </span>
        <span className="hidden sm:inline">{t("reg.stepPreferences")}</span>
      </span>
    </div>
  );
}
