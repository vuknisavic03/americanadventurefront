import { describe, expect, it } from 'vitest'

import { renderCandidateMessage } from './templates.ts'

const context = {
  campaignName: 'SWT 2027',
  consultationBookingUrl: 'https://example.test/konsultacije',
  firstName: 'Ana <script>',
  officialContactEmail: 'office@example.test',
  officialPhone: '+381 11 000 0000',
  privacyPolicyUrl: 'https://example.test/privatnost',
  programName: 'Work and Travel USA',
}

describe('candidate communication templates', () => {
  it('renders an immutable material-pack version and escapes HTML values', () => {
    const message = renderCandidateMessage('MATERIAL_BUNDLE', context)

    expect(message.templateKey).toBe('SWT_MVP_INFORMATION_PACK_SR')
    expect(message.templateVersion).toBe('0.1')
    expect(message.contentHash).toMatch(/^[a-f0-9]{64}$/)
    expect(message.html).toContain('Ana &lt;script&gt;')
    expect(message.html).not.toContain('Ana <script>')
  })

  it('keeps the consultation link out of the first message', () => {
    const materials = renderCandidateMessage('MATERIAL_BUNDLE', context)
    const invitation = renderCandidateMessage('CONSULTATION_INVITATION', context)

    expect(materials.text).not.toContain(context.consultationBookingUrl)
    expect(invitation.text).toContain(context.consultationBookingUrl)
  })

  it('renders a safe employment-offer notification linked to the portal', () => {
    const message = renderCandidateMessage('EMPLOYMENT_OFFER', {
      ...context,
      employerName: 'Synthetic & Employer LLC',
      employmentOfferUrl: 'https://portal.example.test/moj-nalog#employment-offer',
      jobTitle: 'Pool Attendant',
    })
    expect(message.category).toBe('EMPLOYMENT_OFFER')
    expect(message.text).toContain('Pool Attendant')
    expect(message.html).toContain('Synthetic &amp; Employer LLC')
    expect(message.html).toContain('portal.example.test')
  })

  it('renders one notification for a candidate job shortlist', () => {
    const message = renderCandidateMessage('JOB_SHORTLIST', {
      ...context,
      jobOptionCount: 3,
      jobOptionsUrl: 'https://portal.example.test/moj-nalog#job-options',
    })
    expect(message.category).toBe('JOB_SHORTLIST')
    expect(message.subject).toContain('(3)')
    expect(message.text).toContain('nisu konačna potvrda zaposlenja')
    expect(message.html).toContain('portal.example.test')
  })

  it('renders the exact embassy appointment and portal link in the reminder', () => {
    const message = renderCandidateMessage('EMBASSY_APPOINTMENT_REMINDER', {
      ...context,
      candidatePortalUrl: 'https://portal.example.test/moj-nalog#embassy-appointment',
      embassyAppointmentLabel: '20. januar 2027. u 10:30',
    })
    expect(message.category).toBe('EMBASSY_APPOINTMENT_REMINDER')
    expect(message.templateVersion).toBe('1.0')
    expect(message.text).toContain('20. januar 2027. u 10:30')
    expect(message.html).toContain('portal.example.test')
  })

  it('keeps travel dates and destinations out of the administrator email', () => {
    const message = renderCandidateMessage('FLIGHT_TICKET_REQUEST', {
      ...context,
      candidateFullName: 'Ana & Testić',
      flightRequestAdminUrl: 'https://portal.example.test/admin/collections/candidate-processes/42',
      flightRequestVersion: 2,
    })
    expect(message.category).toBe('FLIGHT_TICKET_REQUEST')
    expect(message.html).toContain('Ana &amp; Testić')
    expect(message.text).toContain('Verzija zahteva: 2')
    expect(message.text).toContain('/candidate-processes/42')
    expect(message.text).not.toContain('2027-06-10')
    expect(message.text).not.toContain('Ocean City')
  })
})
