export type PlatformEnvironment = {
  candidateCommunication: {
    consultationBookingUrl: string
    from: string
    officialPhone: string
    privacyPolicyUrl: string
    provider: 'capture' | 'resend'
    replyTo: string
    resendApiKey?: string
  }
  consultationScheduling: {
    webhookSecret?: string
  }
  candidateSms: {
    provider: 'capture' | 'webhook'
    sender: string
    webhookToken?: string
    webhookUrl?: string
  }
  databaseUrl: string
  operations: {
    flightRequestNotificationEmail: string
    observabilityToken?: string
  }
  payloadSecret: string
  security: {
    trustedProxyHops: number
  }
  serverUrl: string
}

export type EnvironmentSource = Record<string, string | undefined>

function requireValue(environment: EnvironmentSource, name: string): string {
  const value = environment[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function optionalValue(environment: EnvironmentSource, name: string, fallback: string): string {
  return environment[name]?.trim() || fallback
}

function trustedProxyHops(environment: EnvironmentSource) {
  const rawValue = environment.TRUSTED_PROXY_HOPS?.trim() || '0'
  const value = Number(rawValue)

  if (!Number.isSafeInteger(value) || value < 0 || value > 10) {
    throw new Error('TRUSTED_PROXY_HOPS must be an integer between 0 and 10')
  }

  return value
}

function observabilityToken(environment: EnvironmentSource) {
  const token = environment.OBSERVABILITY_TOKEN?.trim()
  if (token && token.length < 32) {
    throw new Error('OBSERVABILITY_TOKEN must contain at least 32 characters')
  }
  return token || undefined
}

export function readPlatformEnvironment(
  environment: EnvironmentSource = process.env,
): PlatformEnvironment {
  const configuredProvider = environment.CANDIDATE_EMAIL_PROVIDER?.trim() || 'capture'
  if (!['capture', 'resend'].includes(configuredProvider)) {
    throw new Error('CANDIDATE_EMAIL_PROVIDER must be either capture or resend')
  }
  const provider = configuredProvider as 'capture' | 'resend'
  const resendApiKey = environment.RESEND_API_KEY?.trim()

  if (provider === 'resend' && !resendApiKey) {
    throw new Error('Missing required environment variable: RESEND_API_KEY')
  }
  const configuredSmsProvider = environment.CANDIDATE_SMS_PROVIDER?.trim() || 'capture'
  if (!['capture', 'webhook'].includes(configuredSmsProvider)) {
    throw new Error('CANDIDATE_SMS_PROVIDER must be either capture or webhook')
  }
  const smsProvider = configuredSmsProvider as 'capture' | 'webhook'
  const smsWebhookUrl = environment.CANDIDATE_SMS_WEBHOOK_URL?.trim()
  const smsWebhookToken = environment.CANDIDATE_SMS_WEBHOOK_TOKEN?.trim()
  if (smsProvider === 'webhook' && (!smsWebhookUrl || !smsWebhookToken || smsWebhookToken.length < 32)) {
    throw new Error('CANDIDATE_SMS_WEBHOOK_URL and CANDIDATE_SMS_WEBHOOK_TOKEN are required for webhook SMS delivery')
  }
  if (smsWebhookUrl) {
    try { if (new URL(smsWebhookUrl).protocol !== 'https:') throw new Error() }
    catch { throw new Error('CANDIDATE_SMS_WEBHOOK_URL must be a valid HTTPS URL') }
  }
  const smsSender = optionalValue(environment, 'CANDIDATE_SMS_SENDER', 'AmAdventure')
  if (!/^[A-Za-z0-9]{1,11}$/.test(smsSender)) throw new Error('CANDIDATE_SMS_SENDER must contain 1 to 11 letters or digits')

  return {
    candidateCommunication: {
      consultationBookingUrl: optionalValue(
        environment,
        'CONSULTATION_BOOKING_URL',
        'http://localhost:3000/konsultacije',
      ),
      from: optionalValue(
        environment,
        'CANDIDATE_EMAIL_FROM',
        'American Adventure <noreply@notify.workandtravel.rs>',
      ),
      officialPhone: optionalValue(environment, 'OFFICIAL_PHONE', '+381 11 000 0000'),
      privacyPolicyUrl: optionalValue(
        environment,
        'PRIVACY_POLICY_URL',
        'http://localhost:3000/politika-privatnosti',
      ),
      provider,
      replyTo: optionalValue(
        environment,
        'CANDIDATE_EMAIL_REPLY_TO',
        'beograd@workandtravel.rs',
      ),
      resendApiKey,
    },
    consultationScheduling: {
      webhookSecret: environment.CONSULTATION_WEBHOOK_SECRET?.trim() || undefined,
    },
    candidateSms: {
      provider: smsProvider,
      sender: smsSender,
      webhookToken: smsWebhookToken,
      webhookUrl: smsWebhookUrl,
    },
    databaseUrl: requireValue(environment, 'DATABASE_URL'),
    operations: {
      flightRequestNotificationEmail: optionalValue(
        environment,
        'FLIGHT_REQUEST_NOTIFICATION_EMAIL',
        optionalValue(environment, 'CANDIDATE_EMAIL_REPLY_TO', 'beograd@workandtravel.rs'),
      ),
      observabilityToken: observabilityToken(environment),
    },
    payloadSecret: requireValue(environment, 'PAYLOAD_SECRET'),
    security: {
      trustedProxyHops: trustedProxyHops(environment),
    },
    serverUrl: environment.NEXT_PUBLIC_SERVER_URL?.trim() || 'http://localhost:3000',
  }
}

