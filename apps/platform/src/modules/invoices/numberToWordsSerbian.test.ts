import { describe, expect, it } from 'vitest'
import { amountInWordsSerbian } from './numberToWordsSerbian.ts'

describe('amountInWordsSerbian', () => {
  it('converts zero dinars correctly', () => {
    expect(amountInWordsSerbian(0, 0)).toBe('nula dinara i 00/100')
    expect(amountInWordsSerbian(0, 50)).toBe('nula dinara i 50/100')
  })

  it('converts single dinars with correct inflection', () => {
    expect(amountInWordsSerbian(1, 0)).toBe('jedan dinar i 00/100')
    expect(amountInWordsSerbian(2, 0)).toBe('dva dinara i 00/100')
    expect(amountInWordsSerbian(5, 0)).toBe('pet dinara i 00/100')
    expect(amountInWordsSerbian(11, 0)).toBe('jedanaest dinara i 00/100')
    expect(amountInWordsSerbian(21, 0)).toBe('dvadeset jedan dinar i 00/100')
  })

  it('converts hundreds and thousands', () => {
    expect(amountInWordsSerbian(100, 0)).toBe('sto dinara i 00/100')
    expect(amountInWordsSerbian(1000, 0)).toBe('jedna hiljada dinara i 00/100')
    expect(amountInWordsSerbian(2000, 0)).toBe('dve hiljade dinara i 00/100')
    expect(amountInWordsSerbian(5000, 0)).toBe('pet hiljada dinara i 00/100')
  })

  it('converts realistic invoice amounts', () => {
    expect(amountInWordsSerbian(58750, 0)).toBe('pedeset osam hiljada sedam stotina pedeset dinara i 00/100')
    expect(amountInWordsSerbian(37975, 50)).toBe('trideset sedam hiljada devet stotina sedamdeset pet dinara i 50/100')
    expect(amountInWordsSerbian(118500, 0)).toBe('sto osamnaest hiljada pet stotina dinara i 00/100')
    expect(amountInWordsSerbian(1254321, 75)).toBe('jedan milion dvesta pedeset četiri hiljade trista dvadeset jedan dinar i 75/100')
  })
})
