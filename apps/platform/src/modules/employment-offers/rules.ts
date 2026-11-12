import { createHash } from 'node:crypto'

export const EMPLOYMENT_OFFER_ACCEPTANCE_STATEMENT_VERSION = '1.0'

export type EmploymentOfferTerms = {
  candidateInstructions: string
  employerName: string
  endDate: string
  expectedWeeklyHours: number
  hourlyWageCents: number
  housingCostCents?: number
  housingDescription?: string
  housingProvided: boolean
  jobTitle: string
  responseDueAt?: string
  startDate: string
  workCity: string
  workState: string
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function validateEmploymentOfferTerms(terms: EmploymentOfferTerms, now: Date) {
  const boundedText: Array<[string, number, number, string]> = [
    [terms.employerName, 2, 200, 'Naziv poslodavca'],
    [terms.jobTitle, 2, 160, 'Naziv radne pozicije'],
    [terms.workCity, 2, 120, 'Grad'],
    [terms.workState, 2, 100, 'Savezna država'],
    [terms.candidateInstructions, 2, 2_000, 'Uputstvo za kandidata'],
  ]
  for (const [value, minimum, maximum, label] of boundedText) {
    const length = value.trim().length
    if (length < minimum || length > maximum) throw new Error(`${label} nema dozvoljenu dužinu.`)
  }
  if (terms.housingDescription && terms.housingDescription.length > 1_000) {
    throw new Error('Informacije o smeštaju ne mogu biti duže od 1000 znakova.')
  }
  const start = new Date(terms.startDate)
  const end = new Date(terms.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error('Kraj rada mora biti posle početka rada.')
  }
  if (!Number.isSafeInteger(terms.hourlyWageCents) || terms.hourlyWageCents < 1) {
    throw new Error('Satnica mora biti pozitivan iznos.')
  }
  if (!Number.isSafeInteger(terms.expectedWeeklyHours) || terms.expectedWeeklyHours < 1 || terms.expectedWeeklyHours > 80) {
    throw new Error('Očekivani broj sati mora biti između 1 i 80 nedeljno.')
  }
  if (terms.housingCostCents !== undefined && (!Number.isSafeInteger(terms.housingCostCents) || terms.housingCostCents < 0)) {
    throw new Error('Trošak smeštaja nije ispravan.')
  }
  if (!terms.housingProvided && terms.housingCostCents !== undefined) {
    throw new Error('Trošak smeštaja se unosi samo kada poslodavac obezbeđuje smeštaj.')
  }
  if (terms.responseDueAt) {
    const deadline = new Date(terms.responseDueAt)
    if (Number.isNaN(deadline.getTime()) || deadline <= now || deadline >= start) {
      throw new Error('Rok za prihvatanje mora biti u budućnosti i pre početka rada.')
    }
  }
}

export function employmentOfferSnapshot(terms: EmploymentOfferTerms, offerVersion: number) {
  return JSON.stringify({
    candidateInstructions: terms.candidateInstructions,
    currency: 'USD',
    employerName: terms.employerName,
    endDate: terms.endDate,
    expectedWeeklyHours: terms.expectedWeeklyHours,
    hourlyWageCents: terms.hourlyWageCents,
    housingCostCents: terms.housingCostCents ?? null,
    housingDescription: terms.housingDescription ?? null,
    housingProvided: terms.housingProvided,
    jobTitle: terms.jobTitle,
    offerVersion,
    responseDueAt: terms.responseDueAt ?? null,
    startDate: terms.startDate,
    workCity: terms.workCity,
    workState: terms.workState,
  })
}

export function employmentOfferAcceptanceStatement(offerVersion: number, employerName: string, jobTitle: string) {
  return `Potvrđujem da sam pročitao/la radnu ponudu verzije ${offerVersion} za poziciju ${jobTitle} kod poslodavca ${employerName}, da razumem navedene uslove i da ih prihvatam.`
}
