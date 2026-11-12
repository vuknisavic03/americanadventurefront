import { createHash } from 'node:crypto'

export const allowedContractPlaceholders = new Set([
  'agency.address',
  'agency.bankAccount',
  'agency.name',
  'agency.registrationNumber',
  'agency.representative',
  'agency.taxId',
  'candidate.address',
  'candidate.birthDate',
  'candidate.email',
  'candidate.fullName',
  'candidate.passportFileName',
  'candidate.passportNumber',
  'candidate.personalId',
  'candidate.phone',
  'contract.date',
  'contract.number',
  'offer.total',
  'payment.method',
  'program.code',
  'program.option',
  'program.season',
])

export const FULL_PLACEMENT_2027_SAMPLE_BODY = `
UGOVOR O PRUŽANJU USLUGA - WORK & TRAVEL USA 2027 (FULL PLACEMENT & LIFEGUARD)
Broj ugovora: {{ contract.number }}
Datum: {{ contract.date }}

UGOVORNE STRANE:
1. {{ agency.name }}, sa sedištem na adresi {{ agency.address }}, MB: {{ agency.registrationNumber }}, PIB: {{ agency.taxId }}, račun: {{ agency.bankAccount }}, zastupano po {{ agency.representative }} (u daljem tekstu: Agencija)
2. {{ candidate.fullName }}, sa prebivalištem na adresi {{ candidate.address }}, JMBG: {{ candidate.personalId }} (u daljem tekstu: Korisnik)

ČLAN 1. PREDMET UGOVORA
Predmet ovog ugovora je regulisanje međusobnih prava i obaveza povodom učešća Korisnika na programu kulturne razmene Work & Travel USA za sezonu {{ program.season }} pod opcijom Full Placement / Lifeguard.

ČLAN 2. FINANSIJSKI USLOVI I CENA PROGRAMA
Ukupna ugovorena cena programa iznosi: {{ offer.total }}.
Izabrani model plaćanja: {{ payment.method }}.
Dinamika plaćanja:
- Avans pri prijavi: 450 USD u dinarskoj protivvrednosti.
- Preostale rate do najkasnije 01.03.2027. godine, odnosno do 12.10.2027. za opciju Platiš kad zaradiš.

ČLAN 3. OBAVEZE KORISNIKA
Korisnik se obavezuje da dostavi tačne podatke, položi test engleskog jezika, poštuje propise SEVIS i napusti SAD najkasnije u roku od 30 dana nakon isteka obrasca DS-2019 (do 1. oktobra).
`.trim()

export const SELF_PLACEMENT_2027_SAMPLE_BODY = `
UGOVOR O PRUŽANJU USLUGA - WORK & TRAVEL USA 2027 (SELF PLACEMENT)
Broj ugovora: {{ contract.number }}
Datum: {{ contract.date }}

UGOVORNE STRANE:
1. {{ agency.name }}, sa sedištem na adresi {{ agency.address }}, MB: {{ agency.registrationNumber }}, PIB: {{ agency.taxId }}, račun: {{ agency.bankAccount }}, zastupano po {{ agency.representative }} (u daljem tekstu: Agencija)
2. {{ candidate.fullName }}, sa prebivalištem na adresi {{ candidate.address }}, JMBG: {{ candidate.personalId }} (u daljem tekstu: Korisnik)

ČLAN 1. PREDMET UGOVORA
Predmet ovog ugovora je pružanje usluga posredovanja na Work & Travel USA programu za sezonu {{ program.season }} gde Korisnik samostalno obezbeđuje radnu ponudu (Self Placement).

ČLAN 2. CENA PROGRAMA I DINAMIKA PLAĆANJA
Ukupna ugovorena cena programa iznosi: {{ offer.total }}.
Izabrani model plaćanja: {{ payment.method }}.
- Avans pri prijavi iznosi 600 USD.
- Preostali iznos plaća se nakon verifikacije radne ponude od strane sponzora.

ČLAN 3. RADNA PONUDA I OBAVEZE
Korisnik snosi odgovornost za verodostojnost ponude za posao koju dostavlja sponzoru na proveru.
`.trim()

export function validateContractTemplateBody(body: string) {
  const placeholders = [...body.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map((match) => match[1].trim())
  const unsupported = [...new Set(placeholders.filter((placeholder) => !allowedContractPlaceholders.has(placeholder)))]
  return unsupported.length === 0
    ? undefined
    : `Nepodržana polja u šablonu: ${unsupported.join(', ')}.`
}

export function contractTemplateChecksum(body: string) {
  return createHash('sha256').update(body, 'utf8').digest('hex')
}

export function renderContractTemplate(body: string, values: Record<string, string>) {
  const missing = [...allowedContractPlaceholders].filter(
    (placeholder) => body.includes(`{{ ${placeholder} }}`) && !(placeholder in values),
  )
  if (missing.length > 0) throw new Error(`Nedostaju vrednosti za šablon: ${missing.join(', ')}.`)
  return body.replace(/{{\s*([^{}]+?)\s*}}/g, (_match, placeholder: string) => {
    const value = values[placeholder.trim()]
    if (value === undefined) throw new Error(`Nedostaje vrednost za šablon: ${placeholder.trim()}.`)
    return value
  })
}

