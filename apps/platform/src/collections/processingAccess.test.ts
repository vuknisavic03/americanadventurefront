import { describe, expect, it } from 'vitest'

import { ContactAttempts } from './ContactAttempts.ts'
import { OutboxEvents } from './OutboxEvents.ts'
import { PreApplications } from './PreApplications.ts'

const accessArguments = { req: { user: { id: 1 } } } as never

describe('administrative processing access boundaries', () => {
  it('forbids direct pre-application updates outside the command endpoint', async () => {
    expect(await PreApplications.access?.update?.(accessArguments)).toBe(false)
  })

  it('keeps contact history append-only through the processing command', async () => {
    expect(await ContactAttempts.access?.create?.(accessArguments)).toBe(false)
    expect(await ContactAttempts.access?.update?.(accessArguments)).toBe(false)
    expect(await ContactAttempts.access?.delete?.(accessArguments)).toBe(false)
  })

  it('keeps the reliable outbox unavailable to ordinary CRUD calls', async () => {
    expect(await OutboxEvents.access?.create?.(accessArguments)).toBe(false)
    expect(await OutboxEvents.access?.update?.(accessArguments)).toBe(false)
    expect(await OutboxEvents.access?.delete?.(accessArguments)).toBe(false)
  })
})

