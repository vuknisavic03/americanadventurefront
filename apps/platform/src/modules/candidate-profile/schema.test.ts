import { describe, expect, it } from 'vitest'

import { candidateProfileUpdateSchema } from './schema.ts'

describe('candidate profile update schema', () => {
  it('accepts normalized contact and citizenship values', () => {
    const result = candidateProfileUpdateSchema.parse({
      citizenship: '  Republika Srbija ',
      phone: ' +381 64 123-456 ',
      residentialAddress: ' Bulevar oslobođenja 10, Novi Sad ',
    })

    expect(result).toEqual({
      citizenship: 'Republika Srbija',
      phone: '+381 64 123-456',
      residentialAddress: 'Bulevar oslobođenja 10, Novi Sad',
    })
  })

  it('rejects unknown fields and invalid phone characters', () => {
    expect(candidateProfileUpdateSchema.safeParse({
      citizenship: 'Srbija',
      email: 'changed@example.com',
      phone: 'pozovi-me',
      residentialAddress: 'Adresa 1',
    }).success).toBe(false)
  })
})
