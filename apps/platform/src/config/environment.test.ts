import { describe, expect, it } from 'vitest'

import { readPlatformEnvironment } from './environment'

describe('readPlatformEnvironment', () => {
  it('returns validated values', () => {
    expect(
      readPlatformEnvironment({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        NEXT_PUBLIC_SERVER_URL: 'https://platform.example.com',
        PAYLOAD_SECRET: 'a-development-secret',
      }),
    ).toEqual({
      candidateCommunication: {
        consultationBookingUrl: 'http://localhost:3000/konsultacije',
        from: 'American Adventure <noreply@notify.workandtravel.rs>',
        officialPhone: '+381 11 000 0000',
        privacyPolicyUrl: 'http://localhost:3000/politika-privatnosti',
        provider: 'capture',
        replyTo: 'beograd@workandtravel.rs',
        resendApiKey: undefined,
      },
      candidateSms: {
        provider: 'capture',
        sender: 'AmAdventure',
        webhookToken: undefined,
        webhookUrl: undefined,
      },
      consultationScheduling: {
        webhookSecret: undefined,
      },
      databaseUrl: 'postgresql://user:pass@localhost:5432/database',
      operations: {
        flightRequestNotificationEmail: 'beograd@workandtravel.rs',
        observabilityToken: undefined,
      },
      payloadSecret: 'a-development-secret',
      security: {
        trustedProxyHops: 0,
      },
      serverUrl: 'https://platform.example.com',
    })
  })

  it('keeps the consultation webhook disabled until a secret is configured', () => {
    expect(
      readPlatformEnvironment({
        CONSULTATION_WEBHOOK_SECRET: 'booking-secret',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
      }).consultationScheduling.webhookSecret,
    ).toBe('booking-secret')
  })

  it('requires a provider credential only when real email delivery is enabled', () => {
    expect(() =>
      readPlatformEnvironment({
        CANDIDATE_EMAIL_PROVIDER: 'resend',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
      }),
    ).toThrow('RESEND_API_KEY')

    expect(
      readPlatformEnvironment({
        CANDIDATE_EMAIL_PROVIDER: 'resend',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
        RESEND_API_KEY: 'test-key',
      }).candidateCommunication.provider,
    ).toBe('resend')
  })

  it('rejects an unknown email provider instead of silently capturing messages', () => {
    expect(() =>
      readPlatformEnvironment({
        CANDIDATE_EMAIL_PROVIDER: 'resned',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
      }),
    ).toThrow('CANDIDATE_EMAIL_PROVIDER')
  })

  it('requires both SMS webhook settings only when external delivery is enabled', () => {
    expect(() => readPlatformEnvironment({
      CANDIDATE_SMS_PROVIDER: 'webhook', DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
      PAYLOAD_SECRET: 'a-development-secret',
    })).toThrow('CANDIDATE_SMS_WEBHOOK_URL')
    expect(readPlatformEnvironment({
      CANDIDATE_SMS_PROVIDER: 'webhook', CANDIDATE_SMS_SENDER: 'AA',
      CANDIDATE_SMS_WEBHOOK_TOKEN: 'synthetic-webhook-token-32-characters', CANDIDATE_SMS_WEBHOOK_URL: 'https://sms.example.test/messages',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/database', PAYLOAD_SECRET: 'a-development-secret',
    }).candidateSms.provider).toBe('webhook')
  })

  it('fails fast when a required value is absent', () => {
    expect(() =>
      readPlatformEnvironment({
        PAYLOAD_SECRET: 'a-development-secret',
      }),
    ).toThrow('DATABASE_URL')
  })

  it('uses the local URL when no server URL is configured', () => {
    expect(
      readPlatformEnvironment({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
      }).serverUrl,
    ).toBe('http://localhost:3000')
  })

  it('validates the trusted proxy hop boundary', () => {
    expect(
      readPlatformEnvironment({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
        TRUSTED_PROXY_HOPS: '2',
      }).security.trustedProxyHops,
    ).toBe(2)

    expect(() =>
      readPlatformEnvironment({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
        TRUSTED_PROXY_HOPS: '-1',
      }),
    ).toThrow('TRUSTED_PROXY_HOPS')
  })

  it('keeps operational diagnostics disabled without a strong token', () => {
    expect(
      readPlatformEnvironment({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
        PAYLOAD_SECRET: 'a-development-secret',
      }).operations.observabilityToken,
    ).toBeUndefined()

    expect(() => readPlatformEnvironment({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/database',
      OBSERVABILITY_TOKEN: 'too-short',
      PAYLOAD_SECRET: 'a-development-secret',
    })).toThrow('OBSERVABILITY_TOKEN')
  })
})

