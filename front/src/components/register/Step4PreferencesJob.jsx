// front/src/components/register/Step4PreferencesJob.jsx
// Korak 4: Preferencije posla, nivo engleskog jezika, afilijati i šifra grupe

import { BRAND_YELLOW, INK, labelCls, inputCls, BackIcon } from "./ui";

export default function Step4PreferencesJob({
  prefLocation,
  setPrefLocation,
  prefPosition,
  setPrefPosition,
  englishLevel,
  setEnglishLevel,
  englishTestLink,
  setEnglishTestLink,
  referredBy,
  setReferredBy,
  groupCode,
  setGroupCode,
  onBack,
  onSubmit,
  t,
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-ink)]/60 hover:text-[var(--brand-ink)]"
      >
        <BackIcon /> {t("reg.back")}
      </button>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
        {t("reg.prefTitle")}
      </h1>
      <p className="mt-2 text-sm text-[var(--brand-ink)]/65">
        {t("reg.prefSubtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="p-loc" className={labelCls}>
            {t("reg.prefLocation")}
          </label>
          <input
            id="p-loc"
            type="text"
            required
            value={prefLocation}
            onChange={(e) => setPrefLocation(e.target.value)}
            placeholder={t("reg.prefLocationPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="p-pos" className={labelCls}>
            {t("reg.prefPosition")}
          </label>
          <input
            id="p-pos"
            type="text"
            required
            value={prefPosition}
            onChange={(e) => setPrefPosition(e.target.value)}
            placeholder={t("reg.prefPositionPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="p-eng" className={labelCls}>
            {t("reg.englishLevel")}
          </label>
          <select
            id="p-eng"
            value={englishLevel}
            onChange={(e) => setEnglishLevel(e.target.value)}
            className={`${inputCls} appearance-none font-medium`}
          >
            <option value="B1">B1 — Srednji (Intermediate)</option>
            <option value="B2">B2 — Viši srednji (Upper Intermediate - preporučeno)</option>
            <option value="C1">C1 — Napredni (Advanced)</option>
            <option value="C2">C2 — Tečni / Maternji nivo (Proficient)</option>
          </select>
        </div>

        <div>
          <label htmlFor="p-link" className={labelCls}>
            {t("reg.englishTestLink")}
          </label>
          <input
            id="p-link"
            type="url"
            required
            value={englishTestLink}
            onChange={(e) => setEnglishTestLink(e.target.value)}
            placeholder={t("reg.englishTestLinkPlaceholder")}
            className={inputCls}
          />
        </div>

        {/* Opciona preporuka / Afilijate i Grupna prijava */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4.5 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/70">
              Popusti i preporuke (opciono)
            </h3>
            <p className="mt-0.5 text-xs text-black/55 leading-relaxed">
              Ukoliko vas je preporučio prijatelj ili se prijavljujete sa studentskom grupom, unesite kodove ispod:
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-ref" className="block text-xs font-bold text-[var(--brand-ink)]">
                Kod preporuke (Afilijate)
              </label>
              <input
                id="reg-ref"
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value.toUpperCase())}
                placeholder="npr. REF-PETAR1"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-black/45 leading-tight">
                Prijatelj dobija $100 popusta na poslednjoj rati ukoliko prođete vizu i dobijete posao.
              </p>
            </div>
            <div>
              <label htmlFor="reg-group" className="block text-xs font-bold text-[var(--brand-ink)]">
                Šifra grupe (Grupni popust)
              </label>
              <input
                id="reg-group"
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                placeholder="npr. BG-SUMMER-2026"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-black/45 leading-tight">
                Popust od $150 se obračunava ako 5+ kandidata iz grupe dobije posao i vizu.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            style={{ backgroundColor: BRAND_YELLOW, color: INK }}
          >
            {t("reg.completeRegistration")}
          </button>
        </div>
      </form>
    </div>
  );
}
