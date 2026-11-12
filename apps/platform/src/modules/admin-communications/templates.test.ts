import { describe, expect, it } from 'vitest'

import {
  calculateSmsSegments,
  getTemplate,
  listAvailableTemplates,
  renderEmailHtml,
  renderTemplateText,
} from './templates.ts'

describe('admin-communications templates', () => {
  it('lists all templates and filters by channel', () => {
    const all = listAvailableTemplates()
    expect(all.length).toBeGreaterThan(5)

    const emailTemplates = listAvailableTemplates('EMAIL')
    expect(emailTemplates.every((t) => t.channel === 'EMAIL')).toBe(true)

    const smsTemplates = listAvailableTemplates('SMS')
    expect(smsTemplates.every((t) => t.channel === 'SMS')).toBe(true)

    const inAppTemplates = listAvailableTemplates('IN_APP')
    expect(inAppTemplates.every((t) => t.channel === 'IN_APP')).toBe(true)
  })

  it('retrieves specific template by key', () => {
    const tmpl = getTemplate('EMAIL_GENERAL_ANNOUNCEMENT')
    expect(tmpl).toBeDefined()
    expect(tmpl?.channel).toBe('EMAIL')
    expect(tmpl?.requiredVariables).toContain('firstName')

    const missing = getTemplate('NON_EXISTENT')
    expect(missing).toBeUndefined()
  })

  it('interpolates template placeholders correctly', () => {
    const raw = 'Zdravo {{firstName}}, program {{programCode}} kosta {{price}} EUR.'
    const rendered = renderTemplateText(raw, {
      firstName: 'Petar',
      price: 1850,
      programCode: 'SWT',
    })
    expect(rendered).toBe('Zdravo Petar, program SWT kosta 1850 EUR.')
  })

  it('replaces missing template variables with empty strings', () => {
    const raw = 'Pozdrav {{firstName}} {{lastName}}!'
    const rendered = renderTemplateText(raw, { firstName: 'Marko' })
    expect(rendered).toBe('Pozdrav Marko !')
  })

  it('renders styled HTML for email messages and escapes HTML characters', () => {
    const text = 'Zdravo <Marko> & "Prijatelji",\n\nDobrodosli u program!'
    const html = renderEmailHtml(text)

    expect(html).toContain('&lt;Marko&gt;')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;Prijatelji&quot;')
    expect(html).toContain('<h2 style="margin: 0; color: #0f172a;')
    expect(html).toContain('American Adventure')
  })

  describe('calculateSmsSegments', () => {
    it('handles empty text', () => {
      const metrics = calculateSmsSegments('')
      expect(metrics.characterCount).toBe(0)
      expect(metrics.segmentCount).toBe(0)
      expect(metrics.isUnicode).toBe(false)
    })

    it('calculates single GSM-7 segment up to 160 characters', () => {
      const text = 'American Adventure: Zdravo Marko, imate novu poruku na portalu. Prijavite se na portal.'
      const metrics = calculateSmsSegments(text)

      expect(metrics.isUnicode).toBe(false)
      expect(metrics.characterCount).toBe(text.length)
      expect(metrics.segmentCount).toBe(1)
      expect(metrics.maxCharsPerSegment).toBe(160)
    })

    it('calculates multi-segment GSM-7 message over 160 characters', () => {
      const text = 'A'.repeat(161)
      const metrics = calculateSmsSegments(text)

      expect(metrics.isUnicode).toBe(false)
      expect(metrics.characterCount).toBe(161)
      expect(metrics.segmentCount).toBe(2) // 161 / 153 -> 2 segments
    })

    it('detects Unicode characters and segments at 70 characters', () => {
      // Serbian Latin accents 'š', 'đ', 'č', 'ć', 'ž' are not in GSM 7-bit alphabet
      const unicodeText = 'Vaša prijava je prihvaćena! Čestitamo.'
      const metrics = calculateSmsSegments(unicodeText)

      expect(metrics.isUnicode).toBe(true)
      expect(metrics.characterCount).toBe(unicodeText.length)
      expect(metrics.segmentCount).toBe(1)
      expect(metrics.maxCharsPerSegment).toBe(70)
    })

    it('calculates multi-segment Unicode message over 70 characters', () => {
      const longUnicode = 'Vaša prijava je prihvaćena! ' + 'ž'.repeat(50)
      const metrics = calculateSmsSegments(longUnicode)

      expect(metrics.isUnicode).toBe(true)
      expect(metrics.characterCount).toBe(longUnicode.length) // 28 + 50 = 78
      expect(metrics.segmentCount).toBe(2) // 78 / 67 -> 2 segments
    })
  })
})
