export type CommunicationChannel = 'EMAIL' | 'SMS' | 'IN_APP'

export interface CommunicationTemplate {
  key: string
  name: string
  description: string
  channel: CommunicationChannel
  defaultSubject?: string
  defaultBody: string
  requiredVariables: string[]
  supportedVariables: string[]
  isActionNotification?: boolean
}

export const COMMUNICATION_TEMPLATES: Record<string, CommunicationTemplate> = {
  // --- EMAIL ŠABLONI ---
  EMAIL_GENERAL_ANNOUNCEMENT: {
    key: 'EMAIL_GENERAL_ANNOUNCEMENT',
    name: 'Opšte obaveštenje',
    description: 'Generičko email obaveštenje kandidatu sa proizvoljnim detaljima.',
    channel: 'EMAIL',
    defaultSubject: 'Obaveštenje u vezi sa programom {{programCode}}',
    defaultBody: `Zdravo {{firstName}},

Obaveštavamo vas: {{customNote}}

Status vaše prijave i detalje možete pratiti na vašem kandidatskom portalu:
{{portalUrl}}

Ukoliko imate dodatnih pitanja, slobodno nam odgovorite na ovaj email.

Srdačan pozdrav,
American Adventure tim`,
    requiredVariables: ['firstName'],
    supportedVariables: ['firstName', 'lastName', 'programCode', 'customNote', 'portalUrl'],
  },
  EMAIL_DOCUMENT_REMINDER: {
    key: 'EMAIL_DOCUMENT_REMINDER',
    name: 'Podsetnik za dokumenta',
    description: 'Email podsetnik za dostavljanje nedostajuće dokumentacije.',
    channel: 'EMAIL',
    defaultSubject: 'Podsetnik za dostavu dokumentacije za program {{programCode}}',
    defaultBody: `Zdravo {{firstName}},

Podsećamo vas da je potrebno da dostavite neophodnu dokumentaciju najkasnije do {{dueDate}} kako bismo nastavili obradu vaše prijave za program {{programCode}}.

Dokumenta možete priložiti direktno na kandidatskom portalu:
{{portalUrl}}

Srdačan pozdrav,
American Adventure tim`,
    requiredVariables: ['firstName', 'dueDate'],
    supportedVariables: ['firstName', 'lastName', 'programCode', 'dueDate', 'portalUrl'],
    isActionNotification: true,
  },
  EMAIL_PAYMENT_REMINDER: {
    key: 'EMAIL_PAYMENT_REMINDER',
    name: 'Podsetnik za uplatu',
    description: 'Email podsetnik za dospeće rate programa po planu plaćanja.',
    channel: 'EMAIL',
    defaultSubject: 'Podsetnik za dospeće rate za program {{programCode}}',
    defaultBody: `Zdravo {{firstName}},

Podsećamo vas na dospeće uplate prema vašem planu plaćanja sa predviđenim rokom dospeća {{dueDate}}.

Instrukcije za uplatu i pregled kartice plaćanja dostupni su na portalu:
{{portalUrl}}

Srdačan pozdrav,
American Adventure tim`,
    requiredVariables: ['firstName', 'dueDate'],
    supportedVariables: ['firstName', 'lastName', 'programCode', 'dueDate', 'portalUrl'],
    isActionNotification: true,
  },
  EMAIL_ACTION_REQUIRED: {
    key: 'EMAIL_ACTION_REQUIRED',
    name: 'Zahtevana akcija kandidata',
    description: 'Email obaveštenje o obaveznom koraku na portalu sa zadatim rokom.',
    channel: 'EMAIL',
    defaultSubject: 'Važna akcija na portalu: {{actionTitle}}',
    defaultBody: `Zdravo {{firstName}},

Na vašem nalogu je evidentirana potrebna akcija:
{{actionTitle}}

Molimo vas da ovu aktivnost kompletirate najkasnije do {{dueDate}}.

Pristupite vašem nalogu na sledećem linku:
{{portalUrl}}

Srdačan pozdrav,
American Adventure tim`,
    requiredVariables: ['firstName', 'actionTitle', 'dueDate'],
    supportedVariables: ['firstName', 'lastName', 'programCode', 'actionTitle', 'dueDate', 'portalUrl'],
    isActionNotification: true,
  },

  // --- SMS ŠABLONI ---
  SMS_GENERAL: {
    key: 'SMS_GENERAL',
    name: 'SMS Opšte obaveštenje',
    description: 'Kratka SMS poruka o novostima na portalu.',
    channel: 'SMS',
    defaultBody: 'American Adventure: Zdravo {{firstName}}, imate novu poruku na portalu. Prijavite se: {{portalUrl}}',
    requiredVariables: ['firstName'],
    supportedVariables: ['firstName', 'lastName', 'programCode', 'portalUrl'],
  },
  SMS_URGENT_ACTION: {
    key: 'SMS_URGENT_ACTION',
    name: 'SMS Hitna akcija',
    description: 'Hitna SMS notifikacija sa rokom za realizaciju akcije.',
    channel: 'SMS',
    defaultBody: 'American Adventure: Zdravo {{firstName}}, molimo vas da potvrdite akciju "{{actionTitle}}" do {{dueDate}} na portalu.',
    requiredVariables: ['firstName', 'actionTitle', 'dueDate'],
    supportedVariables: ['firstName', 'lastName', 'actionTitle', 'dueDate', 'portalUrl'],
    isActionNotification: true,
  },
  SMS_PAYMENT_DUE: {
    key: 'SMS_PAYMENT_DUE',
    name: 'SMS Dospeće rate',
    description: 'Kratak SMS podsetnik za dospeće uplate rate.',
    channel: 'SMS',
    defaultBody: 'American Adventure: Zdravo {{firstName}}, podsecamo vas na dospece rate do {{dueDate}}. Detalji na portalu.',
    requiredVariables: ['firstName', 'dueDate'],
    supportedVariables: ['firstName', 'lastName', 'dueDate', 'portalUrl'],
    isActionNotification: true,
  },
  SMS_DOCUMENT_MISSING: {
    key: 'SMS_DOCUMENT_MISSING',
    name: 'SMS Nedostajuća dokumenta',
    description: 'Kratak SMS podsetnik za dostavu dokumentacije.',
    channel: 'SMS',
    defaultBody: 'American Adventure: Zdravo {{firstName}}, nedostaje vam dokumentacija za program. Rok za unos je {{dueDate}} na portalu.',
    requiredVariables: ['firstName', 'dueDate'],
    supportedVariables: ['firstName', 'lastName', 'dueDate', 'portalUrl'],
    isActionNotification: true,
  },

  // --- IN-APP ŠABLONI (PORTAL KANDIDATA) ---
  IN_APP_GENERAL: {
    key: 'IN_APP_GENERAL',
    name: 'Portal: Opšte obaveštenje',
    description: 'Interno obaveštenje vidljivo u listi notifikacija na kandidatskom portalu.',
    channel: 'IN_APP',
    defaultSubject: 'Obaveštenje od administratora',
    defaultBody: '{{customNote}}',
    requiredVariables: ['customNote'],
    supportedVariables: ['customNote', 'firstName', 'programCode'],
  },
  IN_APP_ACTION_REQUIRED: {
    key: 'IN_APP_ACTION_REQUIRED',
    name: 'Portal: Potrebna akcija',
    description: 'Notifikacija koja zahteva akciju kandidata uz definisan rok.',
    channel: 'IN_APP',
    defaultSubject: 'Potrebna akcija: {{actionTitle}}',
    defaultBody: 'Molimo vas da preduzmete akciju: {{actionTitle}}. Rok za završetak je {{dueDate}}.',
    requiredVariables: ['actionTitle', 'dueDate'],
    supportedVariables: ['actionTitle', 'dueDate', 'firstName', 'programCode'],
    isActionNotification: true,
  },
  IN_APP_DOCUMENT_NOTICE: {
    key: 'IN_APP_DOCUMENT_NOTICE',
    name: 'Portal: Dopuna dokumentacije',
    description: 'Obaveštenje o proveri ili dopuni tražene dokumentacije.',
    channel: 'IN_APP',
    defaultSubject: 'Dopuna dokumentacije',
    defaultBody: 'Za nastavak procesa neophodno je postaviti tražena dokumenta do {{dueDate}}.',
    requiredVariables: ['dueDate'],
    supportedVariables: ['dueDate', 'firstName', 'programCode'],
    isActionNotification: true,
  },
  IN_APP_PAYMENT_NOTICE: {
    key: 'IN_APP_PAYMENT_NOTICE',
    name: 'Portal: Dospela uplata',
    description: 'Obaveštenje o uplati po programu.',
    channel: 'IN_APP',
    defaultSubject: 'Dospela uplata',
    defaultBody: 'Evidentirano je dospeće uplate prema vašem planu plaćanja sa rokom {{dueDate}}.',
    requiredVariables: ['dueDate'],
    supportedVariables: ['dueDate', 'firstName', 'programCode'],
    isActionNotification: true,
  },
}

export function listAvailableTemplates(channel?: CommunicationChannel): CommunicationTemplate[] {
  const templates = Object.values(COMMUNICATION_TEMPLATES)
  if (channel) {
    return templates.filter((t) => t.channel === channel)
  }
  return templates
}

export function getTemplate(key: string): CommunicationTemplate | undefined {
  return COMMUNICATION_TEMPLATES[key]
}

export function renderTemplateText(
  templateString: string,
  variables: Record<string, string | number | undefined | null>,
): string {
  return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key]
    if (val === undefined || val === null) {
      return ''
    }
    return String(val)
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function renderEmailHtml(bodyText: string): string {
  const escaped = escapeHtml(bodyText)
  const paragraphs = escaped
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.5; color: #1e293b;">${p.replace(/\n/g, '<br />')}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>American Adventure</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; padding: 32px;">
    <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">American Adventure</h2>
    </div>
    ${paragraphs}
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
      <p style="margin: 0;">American Adventure &bull; Program kulturne razmene &bull; Sva prava zadržana</p>
    </div>
  </div>
</body>
</html>`
}

// GSM 7-bit standard alphabet characters
const GSM_7BIT_CHARS = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
)

export interface SmsMetrics {
  characterCount: number
  segmentCount: number
  isUnicode: boolean
  maxCharsPerSegment: number
}

export function calculateSmsSegments(text: string): SmsMetrics {
  const characterCount = text.length
  if (characterCount === 0) {
    return {
      characterCount: 0,
      segmentCount: 0,
      isUnicode: false,
      maxCharsPerSegment: 160,
    }
  }

  let isUnicode = false
  for (const char of text) {
    if (!GSM_7BIT_CHARS.has(char)) {
      isUnicode = true
      break
    }
  }

  if (isUnicode) {
    // UCS-2 encoding
    const maxCharsPerSegment = 70
    const segmentCount = characterCount <= 70 ? 1 : Math.ceil(characterCount / 67)
    return {
      characterCount,
      isUnicode,
      maxCharsPerSegment,
      segmentCount,
    }
  }

  // GSM-7 encoding
  const maxCharsPerSegment = 160
  const segmentCount = characterCount <= 160 ? 1 : Math.ceil(characterCount / 153)
  return {
    characterCount,
    isUnicode,
    maxCharsPerSegment,
    segmentCount,
  }
}
