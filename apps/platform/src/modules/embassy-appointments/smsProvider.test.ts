import { describe, expect, it, vi } from 'vitest'
import { createCandidateSmsProvider, normalizeSmsRecipient } from './smsProvider.ts'

describe('candidate SMS provider', () => {
  it('normalizes Serbian and international phone formats to E.164', () => {
    expect(normalizeSmsRecipient('060/123-4567')).toBe('+381601234567')
    expect(normalizeSmsRecipient('00381 60 123 4567')).toBe('+381601234567')
    expect(() => normalizeSmsRecipient('123')).toThrow('SMS provajder')
  })
  it('captures messages locally without network traffic', async () => {
    const provider = createCandidateSmsProvider({ provider: 'capture', sender: 'AmericanAdventure' })
    await expect(provider.send({ idempotencyKey: 'reminder-1', recipientPhone: '+38160111222', text: 'Test' })).resolves.toEqual({ messageId: 'capture:reminder-1' })
  })

  it('sends a provider-neutral authenticated webhook with an idempotency key', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: 'sms-1' }), { status: 200 }))
    const provider = createCandidateSmsProvider({ provider: 'webhook', sender: 'AmericanAdventure', webhookToken: 'secret', webhookUrl: 'https://sms.example.test/messages' }, fetchMock)
    await expect(provider.send({ idempotencyKey: 'reminder-1', recipientPhone: '+38160111222', text: 'Test' })).resolves.toEqual({ messageId: 'sms-1' })
    expect(fetchMock).toHaveBeenCalledWith('https://sms.example.test/messages', expect.objectContaining({ headers: expect.objectContaining({ 'Idempotency-Key': 'reminder-1' }) }))
  })
})
