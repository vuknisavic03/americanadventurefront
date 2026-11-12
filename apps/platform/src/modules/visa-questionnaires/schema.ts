import { z } from 'zod'

export const questionnaireVersion = 2

export type QuestionnaireSection = {
  id: string
  title: string
  description?: string
}

export const questionnaireSections: readonly QuestionnaireSection[] = [
  { id: 'personal', title: '1. Osnovni lični podaci' },
  { id: 'travel', title: '2. Viza, poslodavac u SAD i putovanje' },
  { id: 'previousUs', title: '3. Prethodna putovanja u SAD' },
  { id: 'contact', title: '4. Adresni podaci i kontakt' },
  { id: 'socialMedia', title: '5. Društvene mreže' },
  { id: 'passport', title: '6. Podaci važećeg pasoša' },
  { id: 'family', title: '7. Podaci o roditeljima i rodbini' },
  { id: 'education', title: '8. Podaci o obrazovanju' },
  { id: 'additional', title: '9. Dodatna pitanja i bezbednost' },
  { id: 'references', title: '10. Dve kontakt osobe u Srbiji (van srodstva)' },
  { id: 'emergency', title: '11. Kontakt za hitne slučajeve i napomene' },
] as const

export const questionnaireFields = [
  // 1. Osnovni lični podaci
  { section: 'personal', key: 'lastNameAndMaiden', label: 'Prezime i devojačko prezime (ukoliko ste udati)', required: true, maxLength: 200 },
  { section: 'personal', key: 'firstName', label: 'Ime', required: true, maxLength: 100 },
  { section: 'personal', key: 'gender', label: 'Pol (Muški / Ženski)', required: true, maxLength: 100 },
  { section: 'personal', key: 'maritalStatus', label: 'Bračno stanje (Neoženjen/Neudata, U braku, Udovac/Udovica, Razveden/Razvedena, Veren/Verena)', required: true, maxLength: 100 },
  { section: 'personal', key: 'dateOfBirth', label: 'Datum rođenja (dd/mm/yyyy)', required: true, maxLength: 100 },
  { section: 'personal', key: 'birthPlace', label: 'Mesto rođenja', required: true, maxLength: 160 },
  { section: 'personal', key: 'birthCountry', label: 'Država rođenja', required: true, maxLength: 100 },
  { section: 'personal', key: 'citizenship', label: 'Državljanstvo', required: true, maxLength: 100 },
  { section: 'personal', key: 'otherCitizenship', label: 'Drugo državljanstvo (ako posedujete, naziv države)', required: false, maxLength: 100 },
  { section: 'personal', key: 'otherPassportNumber', label: 'Broj stranog pasoša (ako posedujete)', required: false, maxLength: 100 },
  { section: 'personal', key: 'ssn', label: 'Social Security Number (SSN, ako imate)', required: false, maxLength: 100 },
  { section: 'personal', key: 'jmbg', label: 'JMBG', required: true, maxLength: 100 },

  // 2. Viza, poslodavac u SAD i putovanje
  { section: 'travel', key: 'visaType', label: 'Za koju vrstu vize aplicirate (npr. J-1)', required: true, maxLength: 100 },
  { section: 'travel', key: 'expectedTravelDate', label: 'Očekivani datum putovanja (okvirno dd/mm/yyyy)', required: true, maxLength: 100 },
  { section: 'travel', key: 'intendedStayDuration', label: 'Planirana dužina boravka (dana, nedelja ili meseci)', required: true, maxLength: 100 },
  { section: 'travel', key: 'employerInfo', label: 'Podaci o poslodavcu u SAD (naziv kompanije)', required: true, maxLength: 250 },
  { section: 'travel', key: 'supervisorName', label: 'Ime i prezime supervizora', required: true, maxLength: 150 },
  { section: 'travel', key: 'stayAddress', label: 'Adresa gde ćete odsesti u SAD (adresa smeštaja ili poslodavca)', required: true, maxLength: 300 },
  { section: 'travel', key: 'employerPhone', label: 'Broj telefona kompanije u SAD', required: true, maxLength: 100 },
  { section: 'travel', key: 'employerEmail', label: 'Email adresa kompanije u SAD', required: true, maxLength: 100 },
  { section: 'travel', key: 'tripFunder', label: 'Ko Vam finansira put (Ime i prezime, srodstvo - otac/majka, telefon, adresa, email)', required: true, maxLength: 400 },
  { section: 'travel', key: 'travelCompanions', label: 'Sa kim putujete (Ime i prezime, srodstvo ili „Putujem sam/a“)', required: true, maxLength: 250 },

  // 3. Putovanja u SAD
  { section: 'previousUs', key: 'previousUsTravel', label: 'Prethodni boravci u SAD (datumi i dužine boravaka, ili „Nisam boravio/la“)', required: true, maxLength: 1000 },
  { section: 'previousUs', key: 'usDriverLicense', label: 'SAD vozačka dozvola (broj i savezna država gde je izdata, ako posedujete)', required: false, maxLength: 100 },
  { section: 'previousUs', key: 'previousUsVisas', label: 'Prethodne SAD vize (vrsta, datumi izdavanja i isteka, crveni broj vize)', required: false, maxLength: 500 },
  { section: 'previousUs', key: 'sameVisaApplication', label: 'Aplicirate li za istu vrstu vize i u istoj zemlji kao ranije (Da/Ne)', required: false, maxLength: 100 },
  { section: 'previousUs', key: 'lostOrRevokedVisa', label: 'Izgubljena, ukradena ili poništena SAD viza (objašnjenje ako postoji)', required: false, maxLength: 500 },
  { section: 'previousUs', key: 'visaRefusal', label: 'Da li ste ikada odbijeni za SAD vizu (navedite razlog ako jeste, ili „Ne“)', required: true, maxLength: 500 },

  // 4. Adresni podaci i kontakt
  { section: 'contact', key: 'homeAddress', label: 'Adresa stanovanja / prebivališta (iz pasoša ili lične karte)', required: true, maxLength: 300 },
  { section: 'contact', key: 'homeCity', label: 'Grad prebivališta', required: true, maxLength: 100 },
  { section: 'contact', key: 'homePostalCode', label: 'Poštanski broj', required: true, maxLength: 100 },
  { section: 'contact', key: 'homeCountry', label: 'Država prebivališta', required: true, maxLength: 100 },
  { section: 'contact', key: 'mailingAddress', label: 'Adresa na kojoj primate poštu (trenutna adresa gde živite sa brojem stana)', required: true, maxLength: 300 },
  { section: 'contact', key: 'mobilePhone', label: 'Mobilni telefon', required: true, maxLength: 100 },
  { section: 'contact', key: 'landlinePhone', label: 'Fiksni telefon (opciono)', required: false, maxLength: 100 },
  { section: 'contact', key: 'allPhonesLast5Years', label: 'Svi brojevi telefona korišćeni u prethodnih 5 godina', required: true, maxLength: 300 },
  { section: 'contact', key: 'primaryEmail', label: 'Primarni e-mail', required: true, maxLength: 100 },
  { section: 'contact', key: 'allEmailsLast5Years', label: 'Sve e-mail adrese korišćene u proteklih 5 godina', required: true, maxLength: 500 },

  // 5. Socijalne mreže
  { section: 'socialMedia', key: 'socialMediaAccounts', label: 'Svi nalozi na društvenim mrežama u poslednjih 5 godina (naziv + link ka profilu; profili moraju biti otključani)', required: true, maxLength: 1000 },

  // 6. Podaci važećeg pasoša
  { section: 'passport', key: 'passportNumber', label: 'Broj važećeg pasoša', required: true, maxLength: 100 },
  { section: 'passport', key: 'passportCountry', label: 'Država izdavanja pasoša', required: true, maxLength: 100 },
  { section: 'passport', key: 'passportIssueCity', label: 'Grad izdavanja pasoša', required: true, maxLength: 100 },
  { section: 'passport', key: 'passportIssueDate', label: 'Datum izdavanja pasoša (dd/mm/yyyy)', required: true, maxLength: 100 },
  { section: 'passport', key: 'passportExpiryDate', label: 'Datum isteka važenja pasoša (dd/mm/yyyy)', required: true, maxLength: 100 },
  { section: 'passport', key: 'lostOrStolenPassport', label: 'Da li ste ikada izgubili pasoš ili je ukraden (broj, država i objašnjenje ako jeste)', required: false, maxLength: 500 },

  // 7. Podaci o roditeljima i rodbini
  { section: 'family', key: 'fatherInfo', label: 'Otac (Ime, prezime, datum rođenja, da li je u SAD i status)', required: true, maxLength: 300 },
  { section: 'family', key: 'motherInfo', label: 'Majka (Ime, prezime, datum rođenja, da li je u SAD i status)', required: true, maxLength: 300 },
  { section: 'family', key: 'immediateRelativesInUs', label: 'Uža rodbina u SAD (supružnik, brat/sestra, dete — ime, srodstvo, status)', required: false, maxLength: 500 },
  { section: 'family', key: 'otherRelativesInUs', label: 'Dalja rodbina u SAD (srodstvo i status)', required: false, maxLength: 500 },

  // 8. Podaci o obrazovanju
  { section: 'education', key: 'highSchoolInfo', label: 'Srednja škola (naziv, adresa, smer, period pohađanja od-do)', required: true, maxLength: 400 },
  { section: 'education', key: 'university', label: 'Fakultet / visokoškolska ustanova', required: true, maxLength: 200 },
  { section: 'education', key: 'universityAddress', label: 'Adresa fakulteta (ulica i broj, grad, poštanski broj, država)', required: true, maxLength: 300 },
  { section: 'education', key: 'studyProgram', label: 'Studijski program / smer na fakultetu', required: true, maxLength: 200 },
  { section: 'education', key: 'universityDates', label: 'Datum upisa i orijentacioni datum završetka studija', required: true, maxLength: 100 },

  // 9. Dodatna pitanja i bezbednost
  { section: 'additional', key: 'spokenLanguages', label: 'Svi strani jezici koje govorite', required: true, maxLength: 300 },
  { section: 'additional', key: 'traveledAbroadLast5Years', label: 'Države koje ste posetili u inostranstvu u poslednjih 5 godina', required: true, maxLength: 500 },
  { section: 'additional', key: 'charityExperience', label: 'Rad u humanitarnoj ili socijalnoj organizaciji (naziv ako postoji)', required: false, maxLength: 300 },
  { section: 'additional', key: 'specializedSkillsOrMilitary', label: 'Specijalizovane veštine, vojna služba ili paravojno iskustvo (objašnjenje ako postoji)', required: false, maxLength: 500 },
  { section: 'additional', key: 'criminalRecord', label: 'Da li ste ikada bili uhapšeni ili osuđivani (objašnjenje ako jeste, ili „Ne“)', required: true, maxLength: 500 },

  // 10. Dve kontakt osobe u Srbiji (van srodstva)
  { section: 'references', key: 'referencePerson1', label: 'Kontakt osoba 1 van srodstva u Srbiji (Ime, prezime, adresa, telefon, e-mail)', required: true, maxLength: 400 },
  { section: 'references', key: 'referencePerson2', label: 'Kontakt osoba 2 van srodstva u Srbiji (Ime, prezime, adresa, telefon, e-mail)', required: true, maxLength: 400 },

  // 11. Kontakt za hitne slučajeve i napomene
  { section: 'emergency', key: 'emergencyContact', label: 'Kontakt za hitne slučajeve (otac, majka ili uža rodbina: ime, srodstvo, adresa, telefon, e-mail)', required: true, maxLength: 400 },
  { section: 'emergency', key: 'questionsForAgency', label: 'Pitanja ili dodatne napomene za agenciju (opciono)', required: false, maxLength: 1000 },
] as const

export type Answers = Record<string, string>
export type QuestionnaireStatus = 'DRAFT' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'REVIEWED'
export type QuestionnaireHistory = {
  action: 'SUBMIT' | 'REQUEST_CHANGES' | 'APPROVE'
  revision: number
  at: string
  answers?: Answers
  note?: string
  administratorId?: number
}
export type QuestionnaireContent = { answers: Answers; feedback: string; history: QuestionnaireHistory[] }
export type QuestionnaireView = {
  revision: number
  status: QuestionnaireStatus
  schemaVersion: number
  answers: Answers
  feedback: string
  submittedAt?: string | null
  editable: boolean
  history: QuestionnaireHistory[]
}

export const candidateMutation = z.object({
  action: z.enum(['SAVE_DRAFT', 'SUBMIT']),
  expectedRevision: z.number().int().min(0),
  answers: z.record(z.string(), z.string().max(1000)),
}).strict()
export const adminMutation = z.object({
  action: z.enum(['REQUEST_CHANGES', 'APPROVE']),
  expectedRevision: z.number().int().positive(),
  note: z.string().trim().max(2000).default(''),
}).strict()

export function validateAnswers(answers: Answers, complete: boolean) {
  if (Object.keys(answers).some((key) => !questionnaireFields.some((field) => field.key === key))) {
    throw new Error('Upitnik sadrži nepoznata polja.')
  }
  const normalized: Answers = {}
  const errors: Record<string, string> = {}
  for (const field of questionnaireFields) {
    const value = (answers[field.key] ?? '').trim()
    if (complete && field.required && !value) errors[field.key] = 'Ovo polje je obavezno.'
    if (value.length > field.maxLength) errors[field.key] = `Najviše ${field.maxLength} znakova.`
    normalized[field.key] = value
  }
  return { answers: normalized, errors }
}
