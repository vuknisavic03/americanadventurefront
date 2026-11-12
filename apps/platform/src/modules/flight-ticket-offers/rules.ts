import { createHash } from 'node:crypto'

export const FLIGHT_TICKET_RESPONSE_STATEMENT_VERSION = '1.0'

export type FlightTicketOfferCurrency = 'EUR' | 'RSD' | 'USD'

export type FlightTicketOptionInput = {
  airlineName: string
  baggageDescription: string
  currency: FlightTicketOfferCurrency
  fareConditions?: string
  outboundArrivalAt: string
  outboundDepartureAt: string
  outboundRoute: string
  returnArrivalAt: string
  returnDepartureAt: string
  returnRoute: string
  totalPriceMinor: number
}

export type FlightTicketOfferInput = {
  candidateInstructions: string
  internalNotes?: string
  options: FlightTicketOptionInput[]
  responseDueAt?: string
}

export type NormalizedFlightTicketOption = FlightTicketOptionInput & { optionCode: string }

function text(value: string, minimum: number, maximum: number, label: string) {
  const normalized = value.trim()
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new Error(`${label} mora imati između ${minimum} i ${maximum} znakova.`)
  }
  return normalized
}

function instant(value: string, label: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error(`${label} nije ispravan.`)
  return parsed
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function normalizeFlightTicketOffer(
  input: FlightTicketOfferInput,
  offerVersion: number,
  now: Date,
) {
  if (!Number.isSafeInteger(offerVersion) || offerVersion < 1) throw new Error('Verzija ponude nije ispravna.')
  if (!Array.isArray(input.options) || input.options.length < 1 || input.options.length > 5) {
    throw new Error('Ponuda mora sadržati između jedne i pet opcija leta.')
  }

  const options: NormalizedFlightTicketOption[] = input.options.map((option, index) => {
    const outboundDeparture = instant(option.outboundDepartureAt, `Polazak opcije ${index + 1}`)
    const outboundArrival = instant(option.outboundArrivalAt, `Dolazak opcije ${index + 1}`)
    const returnDeparture = instant(option.returnDepartureAt, `Povratni polazak opcije ${index + 1}`)
    const returnArrival = instant(option.returnArrivalAt, `Povratni dolazak opcije ${index + 1}`)
    if (outboundDeparture <= now) throw new Error(`Polazak opcije ${index + 1} mora biti u budućnosti.`)
    if (outboundArrival <= outboundDeparture) throw new Error(`Dolazak opcije ${index + 1} mora biti posle polaska.`)
    if (returnDeparture <= outboundArrival) throw new Error(`Povratni polazak opcije ${index + 1} mora biti posle dolaska u SAD.`)
    if (returnArrival <= returnDeparture) throw new Error(`Povratni dolazak opcije ${index + 1} mora biti posle povratnog polaska.`)
    if (!['EUR', 'RSD', 'USD'].includes(option.currency)) throw new Error(`Valuta opcije ${index + 1} nije podržana.`)
    if (!Number.isSafeInteger(option.totalPriceMinor) || option.totalPriceMinor < 1) throw new Error(`Cena opcije ${index + 1} mora biti pozitivan iznos.`)
    return {
      airlineName: text(option.airlineName, 2, 160, `Aviokompanija opcije ${index + 1}`),
      baggageDescription: text(option.baggageDescription, 2, 500, `Prtljag opcije ${index + 1}`),
      currency: option.currency,
      fareConditions: option.fareConditions ? text(option.fareConditions, 2, 1_000, `Uslovi tarife opcije ${index + 1}`) : undefined,
      optionCode: `AA-FL-${offerVersion}-${index + 1}`,
      outboundArrivalAt: outboundArrival.toISOString(),
      outboundDepartureAt: outboundDeparture.toISOString(),
      outboundRoute: text(option.outboundRoute, 3, 300, `Odlazna ruta opcije ${index + 1}`),
      returnArrivalAt: returnArrival.toISOString(),
      returnDepartureAt: returnDeparture.toISOString(),
      returnRoute: text(option.returnRoute, 3, 300, `Povratna ruta opcije ${index + 1}`),
      totalPriceMinor: option.totalPriceMinor,
    }
  })

  const responseDueAt = input.responseDueAt ? instant(input.responseDueAt, 'Rok za odgovor') : undefined
  const earliestDeparture = Math.min(...options.map((option) => new Date(option.outboundDepartureAt).getTime()))
  if (responseDueAt && (responseDueAt <= now || responseDueAt.getTime() >= earliestDeparture)) {
    throw new Error('Rok za odgovor mora biti u budućnosti i pre prvog ponuđenog polaska.')
  }

  return {
    candidateInstructions: text(input.candidateInstructions, 2, 2_000, 'Uputstvo za kandidata'),
    internalNotes: input.internalNotes ? text(input.internalNotes, 2, 2_000, 'Interna napomena') : undefined,
    options,
    responseDueAt: responseDueAt?.toISOString(),
  }
}

export function flightTicketOfferSnapshot(
  offerVersion: number,
  requestVersion: number,
  input: ReturnType<typeof normalizeFlightTicketOffer>,
) {
  return JSON.stringify({
    candidateInstructions: input.candidateInstructions,
    offerVersion,
    options: input.options.map((option) => ({
      airlineName: option.airlineName,
      baggageDescription: option.baggageDescription,
      currency: option.currency,
      fareConditions: option.fareConditions ?? null,
      optionCode: option.optionCode,
      outboundArrivalAt: option.outboundArrivalAt,
      outboundDepartureAt: option.outboundDepartureAt,
      outboundRoute: option.outboundRoute,
      returnArrivalAt: option.returnArrivalAt,
      returnDepartureAt: option.returnDepartureAt,
      returnRoute: option.returnRoute,
      totalPriceMinor: option.totalPriceMinor,
    })),
    requestVersion,
    responseDueAt: input.responseDueAt ?? null,
  })
}

export function flightTicketResponseStatement(
  action: 'ACCEPT' | 'REJECT',
  offerVersion: number,
  optionCode?: string,
) {
  return action === 'ACCEPT'
    ? `Potvrđujem da sam pregledao/la ponudu avionske karte verzije ${offerVersion} i biram opciju ${optionCode}. Razumem da ovaj izbor još nije izdata karta niti dokaz o uplati.`
    : `Potvrđujem da sam pregledao/la ponudu avionske karte verzije ${offerVersion} i odbijam sve opcije iz te ponude.`
}
