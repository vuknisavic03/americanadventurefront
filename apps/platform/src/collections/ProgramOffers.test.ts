import { ValidationError, type Access, type CollectionBeforeChangeHook } from 'payload'
import { describe, expect, it } from 'vitest'

import { ProgramOffers } from './ProgramOffers.ts'

function access(name: 'create' | 'delete' | 'read' | 'update') {
  return ProgramOffers.access?.[name] as Access
}

const beforeChange = ProgramOffers.hooks?.beforeChange?.[0] as CollectionBeforeChangeHook

describe('program offer access', () => {
  it('lets candidates read only their own published or accepted offers', async () => {
    const result = await access('read')({
      req: { user: { collection: 'candidate-accounts', id: 21 } },
    } as Parameters<Access>[0])

    expect(result).toEqual({
      candidateAccount: { equals: 21 },
      status: { in: ['PUBLISHED', 'ACCEPTED'] },
    })
  })

  it('reserves offer writes for administrators and deletion for drafts', async () => {
    const administrator = { req: { user: { collection: 'users', id: 3 } } } as Parameters<Access>[0]
    const candidate = { req: { user: { collection: 'candidate-accounts', id: 21 } } } as Parameters<Access>[0]

    expect(await access('create')(administrator)).toBe(true)
    expect(await access('update')(administrator)).toBe(true)
    expect(await access('delete')(administrator)).toEqual({ status: { equals: 'DRAFT' } })
    expect(await access('create')(candidate)).toBe(false)
    expect(await access('update')(candidate)).toBe(false)
  })

  it('does not allow creating an already accepted offer', async () => {
    const result = beforeChange({
      collection: {} as never,
      context: {},
      data: { status: 'ACCEPTED' },
      operation: 'create',
      originalDoc: undefined,
      req: {} as never,
    })

    await expect(result).rejects.toBeInstanceOf(ValidationError)
    await expect(result).rejects.toMatchObject({
      data: { errors: [{ message: 'Nova ponuda može biti samo nacrt ili odmah objavljena.', path: 'status' }] },
    })
  })
})
