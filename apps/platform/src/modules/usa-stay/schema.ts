import { z } from 'zod'

export const updatePeerConsentSchema = z.object({
  consent: z.boolean({
    error: 'Polje saglasnosti mora biti logička vrednost (true/false).',
  }),
})

export type UpdatePeerConsentInput = z.infer<typeof updatePeerConsentSchema>
