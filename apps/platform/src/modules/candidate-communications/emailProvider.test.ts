import { describe, expect, it, vi } from 'vitest'

import { createCandidateEmailProvider } from './emailProvider.ts'
import { renderCandidateMessage } from './templates.ts'

const message = renderCandidateMessage('MATERIAL_BUNDLE', {
  campaignName: 'SWT 2027',
  consultationBookingUrl: 'https://example.test/konsultacije',
  firstName: 'Ana',
  officialContactEmail: 'office@example.test',
  officialPhone: '+381 11 000 0000',
  privacyPolicyUrl: 'https://example.test/privatnost',
  programName: 'Work and Travel USA',
})

describe('candidate email provider', () => {
  it('captures messages locally without a network request', async () => {
    const provider = createCandidateEmailProvider({
      consultationBookingUrl: 'http://localhost:3000/konsultacije',
      from: 'American Adventure <local@example.test>',
      officialPhone: '+381 11 000 0000',
      privacyPolicyUrl: 'http://localhost:3000/privatnost',
      provider: 'capture',
      replyTo: 'office@example.test',
    })

    await expect(
      provider.send({ idempotencyKey: 'delivery-1', message, recipientEmail: 'ana@example.test' }),
    ).resolves.toEqual({ messageId: 'capture:delivery-1' })
  })

  it('sends the provider idempotency key and returns the external message id', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'resend-message-1' }), { status: 200 }),
    )
    const provider = createCandidateEmailProvider(
      {
        consultationBookingUrl: 'https://example.test/konsultacije',
        from: 'American Adventure <noreply@example.test>',
        officialPhone: '+381 11 000 0000',
        privacyPolicyUrl: 'https://example.test/privatnost',
        provider: 'resend',
        replyTo: 'office@example.test',
        resendApiKey: 'secret-test-key',
      },
      fetchMock,
    )

    await expect(
      provider.send({ idempotencyKey: 'delivery-1', message, recipientEmail: 'ana@example.test' }),
    ).resolves.toEqual({ messageId: 'resend-message-1' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Idempotency-Key': 'delivery-1' }),
      }),
    )
  })
})

