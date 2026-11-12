export const usaMaterialCategories = [
  { label: 'Zvanični priručnik (Handbook)', value: 'HANDBOOK' },
  { label: 'Zdravstveno osiguranje i prava', value: 'INSURANCE' },
  { label: 'SEVIS prijava i status', value: 'SEVIS' },
  { label: 'SOS i hitni kontakti', value: 'EMERGENCY' },
  { label: 'Porezi i obrasci (W-2 / W-4)', value: 'TAXES' },
  { label: 'Ostali materijali i vodiči', value: 'OTHER' },
] as const

export type UsaMaterialCategory = (typeof usaMaterialCategories)[number]['value']

export const usaTipCategories = [
  { label: 'Social Security Number (SSN)', value: 'SSN' },
  { label: 'Bankovni račun i kartice', value: 'BANKING' },
  { label: 'Smeštaj i depozit', value: 'HOUSING' },
  { label: 'Prevoz i transport', value: 'TRANSPORT' },
  { label: 'Kultura rada i bakšiš', value: 'WORK_CULTURE' },
  { label: 'Zdravlje i bezbednost', value: 'HEALTH_SAFETY' },
  { label: 'Opšti saveti i preporuke', value: 'GENERAL' },
] as const

export type UsaTipCategory = (typeof usaTipCategories)[number]['value']

export interface PeerContactInfo {
  city: string
  email: string
  employerName: string
  fullName: string
  id: number
  state: string
}

export interface PeerNetworkingState {
  hasConsent: boolean
  myPlacement: {
    city: string
    employerName: string
    state: string
  } | null
  peersSameEmployer: PeerContactInfo[]
  peersSameState: PeerContactInfo[]
  totalEligiblePeers: number
}
