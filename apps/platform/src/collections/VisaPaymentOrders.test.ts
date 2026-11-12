import type { Access } from 'payload'
import { describe, expect, it } from 'vitest'

import { VisaPaymentOrders } from './VisaPaymentOrders.ts'

function access(name: 'create' | 'delete' | 'read' | 'update') {
  return VisaPaymentOrders.access?.[name] as Access
}

describe('visa payment order access', () => {
  it('limits candidate reads to orders linked to their own account', async () => {
    const result = await access('read')({
      req: { user: { collection: 'candidate-accounts', id: 21 } },
    } as Parameters<Access>[0])

    expect(result).toEqual({ candidateAccount: { equals: 21 } })
  })

  it('allows administrators to read all orders', async () => {
    const result = await access('read')({
      req: { user: { collection: 'users', id: 3 } },
    } as Parameters<Access>[0])

    expect(result).toBe(true)
  })

  it('forbids direct creation, updates, and deletion for every session type', async () => {
    for (const user of [
      { collection: 'users', id: 3 },
      { collection: 'candidate-accounts', id: 21 },
      null,
    ]) {
      const args = { req: { user } } as Parameters<Access>[0]
      expect(await access('create')(args)).toBe(false)
      expect(await access('update')(args)).toBe(false)
      expect(await access('delete')(args)).toBe(false)
    }
  })
})
