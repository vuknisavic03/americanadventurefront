import { describe, expect, it } from 'vitest'

import { flightTicketOfferSnapshot, flightTicketResponseStatement, normalizeFlightTicketOffer, sha256 } from './rules.ts'

const now = new Date('2030-01-01T10:00:00.000Z')
const option = {
  airlineName: 'Synthetic Air',
  baggageDescription: 'Jedan predati kofer do 23 kg i ručni prtljag.',
  currency: 'EUR' as const,
  fareConditions: 'Promena uz doplatu; karta nije refundabilna.',
  outboundArrivalAt: '2030-06-10T18:00:00.000Z',
  outboundDepartureAt: '2030-06-10T08:00:00.000Z',
  outboundRoute: 'BEG–FRA–JFK',
  returnArrivalAt: '2030-09-13T12:00:00.000Z',
  returnDepartureAt: '2030-09-12T20:00:00.000Z',
  returnRoute: 'JFK–MUC–BEG',
  totalPriceMinor: 85_000,
}

describe('flight ticket offer rules', () => {
  it('normalizes up to five immutable options with stable codes and checksum input', () => {
    const normalized = normalizeFlightTicketOffer({ candidateInstructions: 'Pažljivo uporedite sve opcije.', options: [option, { ...option, airlineName: 'Synthetic Atlantic' }], responseDueAt: '2030-02-01T10:00:00.000Z' }, 3, now)
    expect(normalized.options.map((entry) => entry.optionCode)).toEqual(['AA-FL-3-1', 'AA-FL-3-2'])
    expect(normalized.responseDueAt).toBe('2030-02-01T10:00:00.000Z')
    expect(sha256(flightTicketOfferSnapshot(3, 2, normalized))).toMatch(/^[a-f0-9]{64}$/u)
  })

  it('rejects impossible chronology and invalid prices', () => {
    expect(() => normalizeFlightTicketOffer({ candidateInstructions: 'Test', options: [{ ...option, outboundArrivalAt: option.outboundDepartureAt }] }, 1, now)).toThrow('Dolazak opcije 1 mora biti posle polaska.')
    expect(() => normalizeFlightTicketOffer({ candidateInstructions: 'Test', options: [{ ...option, totalPriceMinor: 0 }] }, 1, now)).toThrow('Cena opcije 1 mora biti pozitivan iznos.')
  })

  it('uses explicit, versioned statements for both candidate decisions', () => {
    expect(flightTicketResponseStatement('ACCEPT', 2, 'AA-FL-2-1')).toContain('biram opciju AA-FL-2-1')
    expect(flightTicketResponseStatement('REJECT', 2)).toContain('odbijam sve opcije')
  })
})
