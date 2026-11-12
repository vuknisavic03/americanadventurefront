export const swtProcessSteps = [
  {
    description: 'Provera i dopuna osnovnih ličnih i kontakt podataka.',
    key: 'PROFILE_SETUP',
    label: 'Profil kandidata',
  },
  {
    description: 'Priprema ugovora i izbor odgovarajućeg načina plaćanja.',
    key: 'CONTRACT_AND_PAYMENT_PLAN',
    label: 'Ugovor i način plaćanja',
  },
  {
    description: 'Evidentiranje prve uplate i otključavanje nastavka aplikacije.',
    key: 'INITIAL_PAYMENT',
    label: 'Prva uplata',
  },
  {
    description: 'Popunjavanje programske aplikacije za Work & Travel.',
    key: 'PROGRAM_APPLICATION',
    label: 'Programska aplikacija',
  },
  {
    description: 'Prikupljanje i provera potrebne dokumentacije.',
    key: 'DOCUMENTS',
    label: 'Dokumentacija',
  },
  {
    description: 'Izbor posla, priprema i praćenje intervjua sa poslodavcem.',
    key: 'JOB_PLACEMENT',
    label: 'Posao i intervju',
  },
  {
    description: 'Priprema dokumentacije i praćenje postupka za vizu.',
    key: 'VISA',
    label: 'Viza',
  },
  {
    description: 'Avio-karta, orijentacija i završna priprema za put.',
    key: 'TRAVEL_PREPARATION',
    label: 'Putovanje i orijentacija',
  },
  {
    description: 'Podrška agencije tokom boravka u Sjedinjenim Američkim Državama.',
    key: 'USA_STAY',
    label: 'Boravak u SAD',
  },
] as const

export type CandidateProcessStepKey = (typeof swtProcessSteps)[number]['key']
export type CandidateProcessStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
export type CandidateStepState = 'COMPLETED' | 'CURRENT' | 'UPCOMING'

export const candidateProcessStepOptions = swtProcessSteps.map((step) => ({
  label: step.label,
  value: step.key,
}))

export function projectCandidateProgress({
  currentStep,
  processStatus,
  programCode,
}: {
  currentStep: CandidateProcessStepKey
  processStatus: CandidateProcessStatus
  programCode: string
}) {
  if (programCode !== 'SWT') throw new Error(`Unsupported candidate process: ${programCode}`)

  const currentIndex = swtProcessSteps.findIndex((step) => step.key === currentStep)
  if (currentIndex === -1) throw new Error(`Unknown SWT process step: ${currentStep}`)

  return swtProcessSteps.map((step, index) => ({
    ...step,
    state: (
      processStatus === 'COMPLETED'
        ? 'COMPLETED'
        : index < currentIndex
          ? 'COMPLETED'
          : index === currentIndex
            ? 'CURRENT'
            : 'UPCOMING'
    ) as CandidateStepState,
  }))
}
