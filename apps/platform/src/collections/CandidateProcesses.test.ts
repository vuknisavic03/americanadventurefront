import type { Access } from 'payload'
import { describe, expect, it } from 'vitest'

import { CandidateProcesses } from './CandidateProcesses.ts'

function access(name: 'create' | 'read' | 'update') {
  return CandidateProcesses.access?.[name] as Access
}

describe('candidate process access', () => {
  it('limits candidate reads to the process linked to their own account', async () => {
    const result = await access('read')({
      req: { user: { collection: 'candidate-accounts', id: 21 } },
    } as Parameters<Access>[0])

    expect(result).toEqual({ candidateAccount: { equals: 21 } })
  })

  it('allows administrators to read and update all processes', async () => {
    const args = { req: { user: { collection: 'users', id: 3 } } } as Parameters<Access>[0]

    expect(await access('read')(args)).toBe(true)
    expect(await access('update')(args)).toBe(true)
  })

  it('does not allow candidates to create or update process state', async () => {
    const args = {
      req: { user: { collection: 'candidate-accounts', id: 21 } },
    } as Parameters<Access>[0]

    expect(await access('create')(args)).toBe(false)
    expect(await access('update')(args)).toBe(false)
  })
})
