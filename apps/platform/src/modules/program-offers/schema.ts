import { z } from 'zod'

export const paymentSelectionSchema = z.object({
  confirmed: z.literal(true, { error: 'Potvrdite da ste pregledali izabrani način plaćanja.' }),
  method: z.enum(['ONE_TIME', 'INSTALLMENTS', 'PAY_WHEN_YOU_EARN']),
}).strict()
