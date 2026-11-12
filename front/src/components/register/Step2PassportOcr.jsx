// front/src/components/register/Step2PassportOcr.jsx
// Korak 2: Upload pasoša, OCR skeniranje sa MRZ parserom i potvrda ličnih podataka

import { labelCls, inputCls, BackIcon, CameraIcon, ScanIcon } from "./ui";

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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink"
      >
        <BackIcon /> {t("reg.back")}
      </button>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {t("reg.passportTitle")}
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        {t("reg.passportSubtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {/* Zona za slikanje / upload pasoša */}
        <div>
          <label className={labelCls}>{t("reg.passportUpload")}</label>
          <div
            onClick={() => passportInputRef.current?.click()}
            className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            {passportImage ? (
              <div className="relative w-full">
                <img
                  src={passportImage}
                  alt="Skenirani pasoš"
                  className="mx-auto max-h-48 rounded-xl object-contain"
                />
                <span className="mt-2 inline-block text-xs font-semibold text-ink underline">
                  Zameni sliku pasoša
                </span>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/30 text-ink">
                  <CameraIcon />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">
                  Kliknite da slikate ili otpremite fotografiju pasoša
                </p>
                <p className="mt-1 text-xs text-ink-3">
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
              className="mt-2 text-xs font-semibold text-ink-2 underline hover:text-ink"
            >
              Ili upotrebi primerak pasoša sa MRZ kodom za OCR skeniranje
            </button>
          )}
        </div>

        {/* Status skeniranja */}
        {isScanning && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-900">
            <ScanIcon className="h-5 w-5 text-amber-600" />
            <span>{t("reg.passportScanning")}</span>
          </div>
        )}

        {scanCompleted && (
          <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900">
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
              {t("app.jmbg")} <span className="font-normal text-ink-3">(13 cifara)</span>
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
          className="bg-brand text-ink mt-6 w-full rounded-full px-7 py-3.5 text-sm font-semibold disabled:opacity-40 transition-colors hover:bg-brand-strong"
        >
          {t("reg.continue")}
        </button>
      </form>
    </div>
  );
}
