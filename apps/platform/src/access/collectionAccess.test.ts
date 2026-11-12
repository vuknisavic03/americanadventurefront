import { describe, expect, it } from 'vitest'

import { authenticated } from './collectionAccess.ts'
import { Users } from '../collections/Users.ts'

describe('administrative collection access', () => {
  it('allows the configured administrator collection', async () => {
    expect(
      await authenticated({ req: { user: { collection: 'users', id: 1 } } } as never),
    ).toBe(true)
  })

  it('does not treat a candidate account as an administrator', async () => {
    const candidateRequest = {
      req: { user: { collection: 'candidate-accounts', id: 2 } },
    } as never

    expect(await authenticated(candidateRequest)).toBe(false)
    expect(await Users.access?.read?.(candidateRequest)).toBe(false)
  })

  it('rejects anonymous access', async () => {
    expect(await authenticated({ req: { user: null } } as never)).toBe(false)
  })
})

