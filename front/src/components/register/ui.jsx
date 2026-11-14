// front/src/components/register/ui.jsx
// Ikonice, stilovi i koračni indikator (stepper) za registraciju

// Polja dele izgled sa ostatkom sistema (src/components/ui) — ovde samo razmak ispod oznake.
import { labelCls as baseLabelCls, inputCls as baseInputCls } from "../ui";

export const labelCls = baseLabelCls;
export const inputCls = `mt-2 ${baseInputCls}`;

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

/** Koračni indikator registracije — četiri segmenta sa linijom iznad (isti obrazac kao u portalu). */
export function RegisterStepper({ step, t }) {
  const steps = [t("reg.stepActivation"), t("reg.stepPassport"), t("reg.stepPayment"), t("reg.stepPreferences")];
  return (
    <ol className="grid grid-cols-4 gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li
            key={label}
            aria-current={current ? "step" : undefined}
            className={`border-t-2 pt-2.5 ${current ? "border-ink" : done ? "border-ink/40" : "border-line-strong"}`}
          >
            <span className={`flex items-center gap-1.5 text-xs tabular-nums ${current || done ? "text-ink" : "text-ink-3"}`}>
              {done ? <CheckIcon className="h-3.5 w-3.5" /> : n}
            </span>
            <span
              className={`mt-0.5 hidden text-[13px] leading-snug sm:block ${
                current ? "font-semibold text-ink" : "text-ink-3"
              }`}
            >
              {label.replace(/^\d+\.\s*/, "")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
