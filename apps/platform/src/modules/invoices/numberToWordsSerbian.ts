/**
 * Converts numeric amounts (dinars and paras) into Serbian words (slovima).
 * Standard formal format used in Serbian invoices and accounting:
 * e.g. 58750.00 -> "pedeset osam hiljada sedam stotina pedeset dinara i 00/100"
 */

const ONES_MASCULINE = ['', 'jedan', 'dva', 'tri', 'četiri', 'pet', 'šest', 'sedam', 'osam', 'devet']
const ONES_FEMININE = ['', 'jedna', 'dve', 'tri', 'četiri', 'pet', 'šest', 'sedam', 'osam', 'devet']

const TEENS = [
  'deset',
  'jedanaest',
  'dvanaest',
  'trinaest',
  'četrnaest',
  'petnaest',
  'šesnaest',
  'sedamnaest',
  'osamnaest',
  'devetnaest',
]

const TENS = [
  '',
  'deset',
  'dvadeset',
  'trideset',
  'četrdeset',
  'pedeset',
  'šezdeset',
  'sedamdeset',
  'osamdeset',
  'devedeset',
]

const HUNDREDS = [
  '',
  'sto',
  'dvesta',
  'trista',
  'četiri stotine',
  'pet stotina',
  'šest stotina',
  'sedam stotina',
  'osam stotina',
  'devet stotina',
]

function convertTriplet(num: number, isFeminine: boolean): string {
  const parts: string[] = []
  const hundreds = Math.floor(num / 100)
  const remainder = num % 100
  const tens = Math.floor(remainder / 10)
  const ones = remainder % 10

  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds])
  }

  if (remainder >= 10 && remainder < 20) {
    parts.push(TEENS[remainder - 10])
  } else {
    if (tens > 0) {
      parts.push(TENS[tens])
    }
    if (ones > 0) {
      parts.push(isFeminine ? ONES_FEMININE[ones] : ONES_MASCULINE[ones])
    }
  }

  return parts.join(' ')
}

export function amountInWordsSerbian(amountDinars: number, amountParas = 0): string {
  const dinars = Math.floor(Math.abs(amountDinars))
  const paras = Math.round(Math.abs(amountParas)) % 100

  if (dinars === 0) {
    const parasStr = paras.toString().padStart(2, '0')
    return `nula dinara i ${parasStr}/100`
  }

  const millions = Math.floor(dinars / 1_000_000) % 1_000
  const thousands = Math.floor(dinars / 1_000) % 1_000
  const units = dinars % 1_000

  const parts: string[] = []

  // Millions
  if (millions > 0) {
    const millionsWords = convertTriplet(millions, false)
    const lastTwo = millions % 100
    const lastOne = millions % 10
    let suffix = 'miliona'
    if (lastTwo !== 11 && lastOne === 1) {
      suffix = 'milion'
    } else if (![12, 13, 14].includes(lastTwo) && [2, 3, 4].includes(lastOne)) {
      suffix = 'miliona'
    }
    parts.push(`${millionsWords} ${suffix}`)
  }

  // Thousands
  if (thousands > 0) {
    const thousandsWords = convertTriplet(thousands, true)
    const lastTwo = thousands % 100
    const lastOne = thousands % 10
    let suffix = 'hiljada'
    if (lastTwo !== 11 && lastOne === 1) {
      suffix = 'hiljada'
    } else if (![12, 13, 14].includes(lastTwo) && [2, 3, 4].includes(lastOne)) {
      suffix = 'hiljade'
    }
    parts.push(`${thousandsWords} ${suffix}`)
  }

  // Units
  if (units > 0) {
    parts.push(convertTriplet(units, false))
  }

  // Dinar inflection
  const lastTwoDinars = dinars % 100
  const lastOneDinar = dinars % 10
  let dinarWord = 'dinara'
  if (lastTwoDinars !== 11 && lastOneDinar === 1) {
    dinarWord = 'dinar'
  } else if (![12, 13, 14].includes(lastTwoDinars) && [2, 3, 4].includes(lastOneDinar)) {
    dinarWord = 'dinara'
  }

  const parasStr = paras.toString().padStart(2, '0')
  return `${parts.join(' ')} ${dinarWord} i ${parasStr}/100`.trim()
}
