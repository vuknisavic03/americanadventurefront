export const SWT_PRE_APPLICATION = {
  campaignCode: 'SWT_MVP',
  formSchemaVersion: 'swt-pre-application-v1',
  newsletterConsentText:
    'Želim da primam novosti, ponude i informacije o programima American Adventure. Saglasnost mogu da povučem u bilo kom trenutku.',
  newsletterConsentTextVersion: 'newsletter-swt-mvp-v1',
  privacyConsentText:
    'Saglasan/na sam da American Adventure DOO obrađuje podatke iz ove prijave radi razmatranja prijave, kontakta i organizacije konsultacija, u skladu sa Politikom privatnosti.',
  privacyConsentTextVersion: 'privacy-swt-mvp-v1',
  programCode: 'SWT',
  source: 'PUBLIC_WEB',
  sourcePage: '/prijava/work-and-travel',
  submissionLanguage: 'sr',
} as const

export const studyYearOptions = [
  { label: '1. godina', value: 'YEAR_1' },
  { label: '2. godina', value: 'YEAR_2' },
  { label: '3. godina', value: 'YEAR_3' },
  { label: '4. godina', value: 'YEAR_4' },
  { label: '5. godina', value: 'YEAR_5' },
  { label: '6. godina', value: 'YEAR_6' },
  { label: 'Master studije', value: 'MASTER' },
  { label: 'Doktorske studije', value: 'DOCTORAL' },
  { label: 'Drugo', value: 'OTHER' },
] as const

export const studyInterruptionOptions = [
  { label: 'Nisam obnavljao/la niti pauzirao/la godinu', value: 'NONE' },
  { label: 'Obnavljao/la sam godinu', value: 'RENEWED_YEAR' },
  { label: 'Pauzirao/la sam godinu', value: 'PAUSED_YEAR' },
  { label: 'Drugo', value: 'OTHER' },
] as const
