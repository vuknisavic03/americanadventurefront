import { createHash } from 'node:crypto'

export const DEFAULT_AGENCY_BENEFICIARY = {
  accountNumber: '160-6000000728717-84',
  address: 'Gospodar Jevremova 59/4, 11000 Beograd',
  name: 'American Adventure DOO',
  registrationNumber: '20356090',
  taxId: '105311717',
}

export type PaymentSlipInput = {
  candidateAddress: string
  candidateCity?: string
  candidateName: string
  currency: 'RSD'
  obligationKey: string
  obligationLabel: string
  paymentAmountRsd: number
  paymentModel?: string
  paymentPurpose?: string
  paymentReference?: string
  recipientAccount?: string
  recipientAddress?: string
  recipientName?: string
}

export type PaymentSlipData = {
  candidateAddress: string
  candidateName: string
  currency: 'RSD'
  ipsQrPayload: string
  obligationKey: string
  obligationLabel: string
  paymentAmountFormatted: string
  paymentAmountRsd: number
  paymentCode: string
  paymentModel: string
  paymentPurpose: string
  paymentReference: string
  recipientAccount: string
  recipientAddress: string
  recipientName: string
}

/**
 * Calculates Serbian Modulo 97 control digits according to ISO 7064.
 * Returns 2-digit checksum + input digits.
 */
export function calculateMod97(referenceDigits: string): string {
  const sanitized = referenceDigits.replace(/\D/g, '')
  if (!sanitized) return '9700000000'
  
  // ISO 7064 Modulo 97 algorithm:
  // Append 00, compute remainder modulo 97, check = 98 - remainder
  let remainder = 0
  const full = `${sanitized}00`
  for (let i = 0; i < full.length; i++) {
    remainder = (remainder * 10 + Number(full[i])) % 97
  }
  const check = 98 - remainder
  const checkStr = check.toString().padStart(2, '0')
  return `${checkStr}${sanitized}`
}

export function generatePaymentReference(candidateAccountId: number, obligationKey: string): string {
  // Hash the obligation key to 4 digits
  const hash = createHash('sha256').update(obligationKey).digest('hex')
  const numPart = parseInt(hash.slice(0, 4), 16) % 10000
  const baseDigits = `${candidateAccountId.toString().padStart(6, '0')}${numPart.toString().padStart(4, '0')}`
  return calculateMod97(baseDigits)
}

/**
 * Builds the NBS IPS QR code payload conforming to NBS IPS specification.
 */
export function buildNbsIpsQrPayload({
  amountRsd,
  candidateAddress,
  candidateName,
  paymentModel,
  paymentPurpose,
  paymentReference,
  recipientAccount,
  recipientName,
}: {
  amountRsd: number
  candidateAddress: string
  candidateName: string
  paymentModel: string
  paymentPurpose: string
  paymentReference: string
  recipientAccount: string
  recipientName: string
}): string {
  const cleanAccount = recipientAccount.replace(/\D/g, '')
  const formattedAmount = `RSD${amountRsd.toFixed(2).replace('.', ',')}`
  const payer = `${candidateName}, ${candidateAddress}`.slice(0, 70)
  const purpose = paymentPurpose.slice(0, 35)
  const ro = `${paymentModel}${paymentReference.replace(/\s+/g, '')}`.slice(0, 25)

  // Standard NBS IPS format:
  // K:PR|V:01|C:1|R:<account>|N:<recipient>|I:<amount>|P:<payer>|SF:289|S:<purpose>|RO:<model+reference>
  return `K:PR|V:01|C:1|R:${cleanAccount}|N:${recipientName}|I:${formattedAmount}|P:${payer}|SF:289|S:${purpose}|RO:${ro}`
}

export function preparePaymentSlip(input: PaymentSlipInput, candidateAccountId = 1): PaymentSlipData {
  const recipientName = input.recipientName?.trim() || DEFAULT_AGENCY_BENEFICIARY.name
  const recipientAddress = input.recipientAddress?.trim() || DEFAULT_AGENCY_BENEFICIARY.address
  const recipientAccount = input.recipientAccount?.trim() || DEFAULT_AGENCY_BENEFICIARY.accountNumber
  const paymentModel = input.paymentModel?.trim() || '97'
  const paymentReference = input.paymentReference?.trim() || generatePaymentReference(candidateAccountId, input.obligationKey)
  const paymentPurpose = input.paymentPurpose?.trim() || `Uplata za program Work and Travel - ${input.obligationLabel} - ${input.candidateName}`.slice(0, 100)
  const paymentAmountRsd = Math.max(0, input.paymentAmountRsd)
  const paymentAmountFormatted = new Intl.NumberFormat('sr-Latn-RS', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(paymentAmountRsd)

  const ipsQrPayload = buildNbsIpsQrPayload({
    amountRsd: paymentAmountRsd,
    candidateAddress: input.candidateAddress,
    candidateName: input.candidateName,
    paymentModel,
    paymentPurpose,
    paymentReference,
    recipientAccount,
    recipientName,
  })

  return {
    candidateAddress: input.candidateAddress,
    candidateName: input.candidateName,
    currency: 'RSD',
    ipsQrPayload,
    obligationKey: input.obligationKey,
    obligationLabel: input.obligationLabel,
    paymentAmountFormatted: `${paymentAmountFormatted} RSD`,
    paymentAmountRsd,
    paymentCode: '289',
    paymentModel,
    paymentPurpose,
    paymentReference,
    recipientAccount,
    recipientAddress,
    recipientName,
  }
}
