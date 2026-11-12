// front/src/components/register/Step1Activation.jsx
// Korak 1: Validacija verifikacionog koda i kreiranje lozinke

import { BRAND_YELLOW, INK, labelCls, inputCls, CheckIcon } from "./ui";

export default function Step1Activation({
  email,
  setEmail,
  code,
  setCode,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  matchedInvitation,
  setMatchedInvitation,
  codeError,
  setCodeError,
  onVerifyCode,
  onSubmit,
  t,
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-ink)]/45">
        Work & Travel 2026 · Korak 1/4
      </p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
        {t("auth.activationTitle")}
      </h1>
      <p className="mt-2 text-sm text-[var(--brand-ink)]/65">
        {t("auth.codeHint")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="reg-email" className={labelCls}>
              {t("contact.email")}
            </label>
            {matchedInvitation && (
              <span className="text-[0.7rem] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                ✓ Verifikovana email adresa
              </span>
            )}
          </div>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            readOnly={Boolean(matchedInvitation)}
            onChange={(e) => {
              setEmail(e.target.value);
              setMatchedInvitation(null);
              setCodeError("");
            }}
            placeholder="student@example.com"
            className={`${inputCls} ${matchedInvitation ? "bg-black/[0.03] text-[var(--brand-ink)] font-semibold cursor-not-allowed" : ""}`}
            autoComplete="email"
          />
          {matchedInvitation && (
            <p className="mt-1 text-xs text-[var(--brand-ink)]/55">
              Email je zaključan i vezan za kod <strong>{matchedInvitation.code}</strong>.{" "}
              <button
                type="button"
                onClick={() => {
                  setMatchedInvitation(null);
                  setCode("");
                  setCodeError("");
                }}
                className="font-bold underline text-[var(--brand-ink)] hover:opacity-80"
              >
                Promeni email ili kod
              </button>
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="reg-code" className={labelCls}>
              {t("auth.enterCode")}
            </label>
          </div>
          <div className="flex gap-2">
            <input
              id="reg-code"
              type="text"
              required
              value={code}
              readOnly={Boolean(matchedInvitation)}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setMatchedInvitation(null);
                setCodeError("");
              }}
              placeholder="Unesite kod iz pozivnice"
              className={`${inputCls} font-mono uppercase tracking-wider ${matchedInvitation ? "bg-black/[0.03] cursor-not-allowed font-bold" : ""}`}
            />
            <button
              type="button"
              onClick={onVerifyCode}
              className="mt-2 shrink-0 rounded-xl border border-black/15 bg-black/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] transition-colors hover:bg-black/[0.08]"
            >
              {matchedInvitation ? "✓ Potvrđeno" : "Proveri"}
            </button>
          </div>
          {codeError && (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {codeError}
            </div>
          )}
        </div>

        {/* Prikaz prepoznatog paketa i popusta nakon provere koda */}
        {matchedInvitation && (
          <div className="rounded-xl border border-green-200 bg-green-50/70 p-4 text-sm text-green-900">
            <p className="flex items-center gap-1.5 font-bold text-green-800">
              <CheckIcon className="h-4 w-4" /> {t("auth.codeValidated")}
            </p>
            <div className="mt-2 space-y-1 text-xs text-green-800/90">
              <p>
                <span className="font-semibold">{t("auth.assignedPackage")}:</span> {matchedInvitation.packageName}
              </p>
              {matchedInvitation.discount > 0 && (
                <p>
                  <span className="font-semibold">{t("auth.discountApplied")}:</span> -{matchedInvitation.discount} €{" "}
                  {matchedInvitation.discountNote ? `(${matchedInvitation.discountNote})` : ""}
                </p>
              )}
              <p className="pt-1 font-bold text-green-950">
                Cena programa: {matchedInvitation.finalPrice} € (redovno {matchedInvitation.basePrice} €)
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-pass" className={labelCls}>
              {t("auth.passwordCreate")}
            </label>
            <input
              id="reg-pass"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="reg-pass-conf" className={labelCls}>
              {t("auth.passwordConfirm")}
            </label>
            <input
              id="reg-pass-conf"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          style={{ backgroundColor: BRAND_YELLOW, color: INK }}
        >
          {t("reg.continue")}
        </button>
      </form>
    </div>
  );
}
