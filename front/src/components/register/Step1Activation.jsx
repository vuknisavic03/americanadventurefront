// front/src/components/register/Step1Activation.jsx
// Korak 1: Validacija verifikacionog koda i kreiranje lozinke

import { labelCls, inputCls, CheckIcon } from "./ui";

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
      <p className="text-[13px] font-semibold text-ink-3">
        Work and Travel 2027, korak 1 od 4
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {t("auth.activationTitle")}
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        {t("auth.codeHint")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="reg-email" className={labelCls}>
              {t("contact.email")}
            </label>
            {matchedInvitation && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
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
            className={`${inputCls} ${matchedInvitation ? "bg-surface text-ink font-semibold cursor-not-allowed" : ""}`}
            autoComplete="email"
          />
          {matchedInvitation && (
            <p className="mt-1 text-xs text-ink-3">
              Email je zaključan i vezan za kod <strong>{matchedInvitation.code}</strong>.{" "}
              <button
                type="button"
                onClick={() => {
                  setMatchedInvitation(null);
                  setCode("");
                  setCodeError("");
                }}
                className="font-semibold underline text-ink hover:opacity-80"
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
              placeholder="Unesi kod iz pozivnice"
              className={`${inputCls} tabular-nums uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal ${matchedInvitation ? "bg-surface cursor-not-allowed font-semibold" : ""}`}
            />
            <button
              type="button"
              onClick={onVerifyCode}
              className="mt-2 shrink-0 rounded-full border border-line-strong bg-surface-2 px-4 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-neutral-200"
            >
              {matchedInvitation ? "✓ Potvrđeno" : "Proveri"}
            </button>
          </div>
          {codeError && (
            <div className="mt-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {codeError}
            </div>
          )}
        </div>

        {/* Prikaz prepoznatog paketa i popusta nakon provere koda */}
        {matchedInvitation && (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <CheckIcon className="h-4 w-4" /> {t("auth.codeValidated")}
            </p>
            <div className="mt-2 space-y-1 text-xs text-emerald-800/90">
              <p>
                <span className="font-semibold">{t("auth.assignedPackage")}:</span> {matchedInvitation.packageName}
              </p>
              {matchedInvitation.discount > 0 && (
                <p>
                  <span className="font-semibold">{t("auth.discountApplied")}:</span> -{matchedInvitation.discount} €{" "}
                  {matchedInvitation.discountNote ? `(${matchedInvitation.discountNote})` : ""}
                </p>
              )}
              <p className="pt-1 font-semibold text-emerald-950">
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
          className="bg-brand text-ink mt-6 w-full rounded-full px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-brand-strong"
        >
          {t("reg.continue")}
        </button>
      </form>
    </div>
  );
}
