export class FlightTicketRequestValidationError extends Error {}

export type FlightTicketRequestInput = {
  departureDate: string
  returnDate: string
  returnDestination: string
  usaDestination: string
}

function dateOnly(value: string, label: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new FlightTicketRequestValidationError(`${label} nije ispravan.`)
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new FlightTicketRequestValidationError(`${label} nije ispravan.`)
  }
  return date
}

function destination(value: string, label: string) {
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw new FlightTicketRequestValidationError(`${label} sadrži nedozvoljene znakove.`)
  }
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (normalized.length < 2 || normalized.length > 200) {
    throw new FlightTicketRequestValidationError(`${label} mora imati od 2 do 200 znakova.`)
  }
  return normalized
}

function utcToday(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function validateFlightTicketRequest(input: FlightTicketRequestInput, now: Date) {
  const departure = dateOnly(input.departureDate, 'Datum odlaska')
  const returning = dateOnly(input.returnDate, 'Datum povratka')
  if (departure < utcToday(now)) throw new FlightTicketRequestValidationError('Datum odlaska ne može biti u prošlosti.')
  if (returning <= departure) throw new FlightTicketRequestValidationError('Datum povratka mora biti posle datuma odlaska.')
  if (returning.getTime() - departure.getTime() > 366 * 24 * 60 * 60_000) {
    throw new FlightTicketRequestValidationError('Period putovanja ne može biti duži od 366 dana.')
  }
  return {
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    returnDestination: destination(input.returnDestination, 'Povratna destinacija'),
    usaDestination: destination(input.usaDestination, 'Destinacija u SAD'),
  }
}
