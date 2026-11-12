// front/src/components/register/Step2PassportOcr.jsx
// Korak 2: Upload pasoša, OCR skeniranje sa MRZ parserom i potvrda ličnih podataka

import { BRAND_YELLOW, INK, labelCls, inputCls, BackIcon, CameraIcon, ScanIcon } from "./ui";

export default function Step2PassportOcr({
  passportImage,
  isScanning,
  scanCompleted,
  ocrStatusMessage,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  jmbg,
  setJmbg,
  idCardNumber,
  setIdCardNumber,
  passportInputRef,
  onPassportUpload,
  onRunSampleOcr,
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
        {t("reg.passportTitle")}
      </h1>
      <p className="mt-2 text-sm text-[var(--brand-ink)]/65">
        {t("reg.passportSubtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {/* Zona za slikanje / upload pasoša */}
        <div>
          <label className={labelCls}>{t("reg.passportUpload")}</label>
          <div
            onClick={() => passportInputRef.current?.click()}
            className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/20 bg-black/[0.02] p-6 text-center transition-colors hover:border-black/40 hover:bg-black/[0.04]"
          >
            {passportImage ? (
              <div className="relative w-full">
                <img
                  src={passportImage}
                  alt="Skenirani pasoš"
                  className="mx-auto max-h-48 rounded-xl object-contain shadow-sm"
                />
                <span className="mt-2 inline-block text-xs font-bold text-[var(--brand-ink)] underline">
                  Zameni sliku pasoša
                </span>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-yellow)]/30 text-[var(--brand-ink)]">
                  <CameraIcon />
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--brand-ink)]">
                  Kliknite da slikate ili otpremite fotografiju pasoša
                </p>
                <p className="mt-1 text-xs text-[var(--brand-ink)]/50">
                  JPG, PNG ili PDF stranice sa fotografijom i MRZ kodom
                </p>
              </>
            )}
          </div>
          <input
            ref={passportInputRef}
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(e) => onPassportUpload(e.target.files?.[0])}
          />

          {/* Dugme za testiranje pravog OCR-a pomoću generisanog pasoša sa MRZ zonom */}
          {!passportImage && (
            <button
              type="button"
              onClick={onRunSampleOcr}
              className="mt-2 text-xs font-semibold text-[var(--brand-ink)]/65 underline hover:text-[var(--brand-ink)]"
            >
              Ili upotrebi primerak pasoša sa MRZ kodom za OCR skeniranje
            </button>
          )}
        </div>

        {/* Status skeniranja */}
        {isScanning && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
            <ScanIcon className="h-5 w-5 animate-pulse text-amber-600" />
            <span>{t("reg.passportScanning")}</span>
          </div>
        )}

        {scanCompleted && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs font-semibold text-green-900">
            {ocrStatusMessage || t("reg.passportExtractSuccess")}
          </div>
        )}

        {/* Formular sa izvučenim podacima */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-fn" className={labelCls}>
              {t("reg.firstName")}
            </label>
            <input
              id="reg-fn"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="reg-ln" className={labelCls}>
              {t("reg.lastName")}
            </label>
            <input
              id="reg-ln"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-jmbg" className={labelCls}>
              {t("app.jmbg")} <span className="font-normal text-black/50">(13 cifara)</span>
            </label>
            <input
              id="reg-jmbg"
              type="text"
              inputMode="numeric"
              maxLength={13}
              required
              value={jmbg}
              onChange={(e) => setJmbg(e.target.value.replace(/\D/g, ""))}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="reg-idcard" className={labelCls}>
              {t("reg.idCardNumber")}
            </label>
            <input
              id="reg-idcard"
              type="text"
              required
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
              placeholder="npr. 010948212"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-phone" className={labelCls}>
            Broj mobilnog telefona
          </label>
          <input
            id="reg-phone"
            type="tel"
            required
            value={phone || ""}
            onChange={(e) => setPhone && setPhone(e.target.value)}
            placeholder="npr. +381 64 123 4567"
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={!passportImage || isScanning}
          className="mt-6 w-full rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-40"
          style={{ backgroundColor: BRAND_YELLOW, color: INK }}
        >
          {t("reg.continue")}
        </button>
      </form>
    </div>
  );
}
