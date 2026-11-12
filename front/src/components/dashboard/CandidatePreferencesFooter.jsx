// front/src/components/dashboard/CandidatePreferencesFooter.jsx
import { CheckIcon } from "./icons";

export default function CandidatePreferencesFooter({
  candidate,
  aiTranslationReady,
  isStep4Done,
  isStep5Done,
  status,
  t,
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {/* Preferencije posla */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 sm:p-4 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand-ink)]/45">
          Vaše preferencije
        </h3>
        <dl className="mt-2.5 space-y-2 text-sm">
          <div className="flex justify-between border-b border-black/[0.05] pb-1.5">
            <dt className="text-[var(--brand-ink)]/60">Željena lokacija:</dt>
            <dd className="font-semibold text-[var(--brand-ink)]">
              {candidate.preferences?.location || "Nije navedeno"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-black/[0.05] pb-1.5">
            <dt className="text-[var(--brand-ink)]/60">Željena pozicija:</dt>
            <dd className="font-semibold text-[var(--brand-ink)]">
              {candidate.preferences?.position || "Nije navedeno"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-black/[0.05] pb-1.5">
            <dt className="text-[var(--brand-ink)]/60">Nivo engleskog:</dt>
            <dd className="font-bold text-[var(--brand-ink)]">
              {candidate.preferences?.englishLevel || "B2"}
            </dd>
          </div>
          {candidate.preferences?.testLink && (
            <div className="flex justify-between">
              <dt className="text-[var(--brand-ink)]/60">Test link:</dt>
              <dd className="truncate text-right">
                <a
                  href={candidate.preferences.testLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-700 underline"
                >
                  Pogledaj rezultat
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Arhiva dokumenata */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 sm:p-4 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand-ink)]/45">
          {t("dash.docsRepo")}
        </h3>
        <ul className="mt-2.5 space-y-2 text-xs font-semibold">
          <li className="flex items-center justify-between rounded-lg border border-black/10 p-2">
            <span className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-600" />
              <span>Skenirani pasoš ({candidate.jmbg})</span>
            </span>
            <span className="text-[var(--brand-ink)]/50">Priložen</span>
          </li>
          <li className="flex items-center justify-between rounded-lg border border-black/10 p-2">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  candidate.cvFileName ? "bg-green-600" : "bg-black/20"
                }`}
              />
              <span>Radna biografija (CV)</span>
            </span>
            <span className={candidate.cvFileName ? "text-green-700" : "text-black/40"}>
              {candidate.cvFileName ? "Spreman" : "Čeka se"}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-lg border border-black/10 p-2">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  aiTranslationReady ? "bg-green-600" : "bg-black/20"
                }`}
              />
              <span>Uverenje sa fakulteta (prevod)</span>
            </span>
            <span className={aiTranslationReady ? "text-green-700" : "text-black/40"}>
              {aiTranslationReady ? "Prevedeno" : "Čeka se"}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-lg border border-black/10 p-2">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isStep4Done
                    ? "bg-green-600"
                    : status === "job"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-black/20"
                }`}
              />
              <span>DS-2019 Obrazac (Sponzor)</span>
            </span>
            <span
              className={
                isStep4Done
                  ? "text-green-700 font-bold"
                  : status === "job"
                  ? "text-amber-700 font-bold"
                  : "text-black/40"
              }
            >
              {isStep4Done ? "Izdat ✓" : status === "job" ? "U pripremi" : "Čeka se"}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-lg border border-black/10 p-2">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isStep5Done
                    ? "bg-green-600"
                    : status === "departure"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-black/20"
                }`}
              />
              <span>J-1 Viza u pasošu</span>
            </span>
            <span
              className={
                isStep5Done
                  ? "text-green-700 font-bold"
                  : status === "departure"
                  ? "text-amber-700 font-bold"
                  : "text-black/40"
              }
            >
              {isStep5Done
                ? "Odobrena ✓"
                : status === "departure"
                ? "Termin u ambasadi"
                : "Faza 5"}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
