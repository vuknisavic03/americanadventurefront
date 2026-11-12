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
    <div className="mt-12 grid gap-4 sm:grid-cols-2">
      {/* Preferencije posla */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-ink">
          Vaše preferencije
        </h3>
        <dl className="mt-3 divide-y divide-line text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-ink-3">Željena lokacija:</dt>
            <dd className="font-semibold text-ink">
              {candidate.preferences?.location || "Nije navedeno"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-ink-3">Željena pozicija:</dt>
            <dd className="font-semibold text-ink">
              {candidate.preferences?.position || "Nije navedeno"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-ink-3">Nivo engleskog:</dt>
            <dd className="font-semibold text-ink">
              {candidate.preferences?.englishLevel || "B2"}
            </dd>
          </div>
          {candidate.preferences?.testLink && (
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-3">Test link:</dt>
              <dd className="truncate text-right">
                <a
                  href={candidate.preferences.testLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-ink underline"
                >
                  Pogledaj rezultat
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Arhiva dokumenata */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-ink">
          {t("dash.docsRepo")}
        </h3>
        <ul className="mt-2.5 space-y-2 text-[13px] font-semibold">
          <li className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-600" />
              <span>Skenirani pasoš ({candidate.jmbg})</span>
            </span>
            <span className="text-ink-3">Priložen</span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  candidate.cvFileName ? "bg-emerald-600" : "bg-black/20"
                }`}
              />
              <span>Radna biografija (CV)</span>
            </span>
            <span className={candidate.cvFileName ? "text-emerald-700" : "text-ink-3"}>
              {candidate.cvFileName ? "Spreman" : "Čeka se"}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  aiTranslationReady ? "bg-emerald-600" : "bg-black/20"
                }`}
              />
              <span>Uverenje sa fakulteta (prevod)</span>
            </span>
            <span className={aiTranslationReady ? "text-emerald-700" : "text-ink-3"}>
              {aiTranslationReady ? "Prevedeno" : "Čeka se"}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isStep4Done
                    ? "bg-emerald-600"
                    : status === "job"
                    ? "bg-amber-500"
                    : "bg-black/20"
                }`}
              />
              <span>DS-2019 Obrazac (Sponzor)</span>
            </span>
            <span
              className={
                isStep4Done
                  ? "text-emerald-700 font-semibold"
                  : status === "job"
                  ? "text-amber-700 font-semibold"
                  : "text-ink-3"
              }
            >
              {isStep4Done ? "Izdat ✓" : status === "job" ? "U pripremi" : "Čeka se"}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isStep5Done
                    ? "bg-emerald-600"
                    : status === "departure"
                    ? "bg-amber-500"
                    : "bg-black/20"
                }`}
              />
              <span>J-1 Viza u pasošu</span>
            </span>
            <span
              className={
                isStep5Done
                  ? "text-emerald-700 font-semibold"
                  : status === "departure"
                  ? "text-amber-700 font-semibold"
                  : "text-ink-3"
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
