import { describe, expect, it } from 'vitest'
import { FlightTicketRequestValidationError, validateFlightTicketRequest } from './rules.ts'

const now = new Date('2026-09-17T12:00:00.000Z')
const valid = { departureDate: '2027-06-10', returnDate: '2027-09-12', returnDestination: 'Beograd (BEG)', usaDestination: 'Ocean City, MD' }

describe('flight ticket request rules', () => {
  it('normalizes valid destinations and preserves date-only values', () => {
    expect(validateFlightTicketRequest({ ...valid, usaDestination: '  Ocean   City, MD ' }, now)).toEqual({ ...valid, usaDestination: 'Ocean City, MD' })
  })
  it('rejects an impossible date', () => {
    expect(() => validateFlightTicketRequest({ ...valid, departureDate: '2027-02-30' }, now)).toThrow(FlightTicketRequestValidationError)
  })
  it('rejects a departure in the past', () => {
    expect(() => validateFlightTicketRequest({ ...valid, departureDate: '2026-09-16' }, now)).toThrow('Datum odlaska ne može biti u prošlosti.')
  })
  it('requires return after departure', () => {
    expect(() => validateFlightTicketRequest({ ...valid, returnDate: valid.departureDate }, now)).toThrow('Datum povratka mora biti posle datuma odlaska.')
  })
  it('rejects control characters in destinations', () => {
    expect(() => validateFlightTicketRequest({ ...valid, usaDestination: 'Boston\nLogan' }, now)).toThrow(FlightTicketRequestValidationError)
  })
})
