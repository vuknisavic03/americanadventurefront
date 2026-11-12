import { describe, expect, it } from 'vitest'

import {
  assertActionAllowed,
  assertConsultationOutcomeAllowed,
  assertDecisionAllowed,
  assertExpectedVersion,
  assertProfileReadinessAllowed,
  deriveContactStatus,
  nextStatus,
  statusAfterConsultationOutcome,
} from './workflow.ts'

describe('pre-application processing workflow', () => {
  it('allows only the defined state transitions', () => {
    expect(() => assertActionAllowed('SUBMITTED', 'START_REVIEW')).not.toThrow()
    expect(() => assertActionAllowed('UNDER_REVIEW', 'RECORD_CONTACT')).not.toThrow()
    expect(() => assertActionAllowed('UNDER_REVIEW', 'MARK_QUALIFIED')).not.toThrow()
    expect(() => assertActionAllowed('UNDER_REVIEW', 'MARK_REJECTED')).not.toThrow()
    expect(() =>
      assertActionAllowed('CONSULTATION_INVITED', 'SCHEDULE_CONSULTATION'),
    ).not.toThrow()
    expect(() =>
      assertActionAllowed('CONSULTATION_SCHEDULED', 'RECORD_CONSULTATION_OUTCOME'),
    ).not.toThrow()
    expect(() =>
      assertActionAllowed('CONSULTATION_COMPLETED', 'MARK_READY_FOR_PROFILE'),
    ).not.toThrow()
    expect(() => assertActionAllowed('SUBMITTED', 'MARK_QUALIFIED')).toThrowError(
      expect.objectContaining({ code: 'INVALID_TRANSITION' }),
    )
    expect(() => assertActionAllowed('REJECTED', 'START_REVIEW')).toThrowError(
      expect.objectContaining({ code: 'INVALID_TRANSITION' }),
    )
  })

  it('prevents attendance from being recorded before the consultation starts', () => {
    expect(() =>
      assertConsultationOutcomeAllowed({
        consultationStartsAt: '2026-09-02T10:00:00.000Z',
        now: new Date('2026-09-01T10:00:00.000Z'),
        outcome: 'ATTENDED',
      }),
    ).toThrowError(expect.objectContaining({ code: 'CONSULTATION_HAS_NOT_STARTED' }))
    expect(() =>
      assertConsultationOutcomeAllowed({
        consultationStartsAt: '2026-09-02T10:00:00.000Z',
        now: new Date('2026-09-01T10:00:00.000Z'),
        outcome: 'CANCELLED',
      }),
    ).not.toThrow()
  })

  it('requires confirmed attendance before profile readiness', () => {
    expect(() => assertProfileReadinessAllowed('NO_SHOW')).toThrowError(
      expect.objectContaining({ code: 'CONSULTATION_NOT_ATTENDED' }),
    )
    expect(() => assertProfileReadinessAllowed('ATTENDED')).not.toThrow()
    expect(statusAfterConsultationOutcome('ATTENDED')).toBe('CONSULTATION_COMPLETED')
    expect(statusAfterConsultationOutcome('NO_SHOW')).toBe('CONSULTATION_INVITED')
  })

  it('requires a contact attempt before either decision', () => {
    expect(() =>
      assertDecisionAllowed({ action: 'MARK_QUALIFIED', contactAttemptCount: 0 }),
    ).toThrowError(expect.objectContaining({ code: 'CONTACT_REQUIRED' }))
    expect(() =>
      assertDecisionAllowed({ action: 'MARK_QUALIFIED', contactAttemptCount: 1 }),
    ).not.toThrow()
  })

  it('requires a non-empty rejection reason', () => {
    expect(() =>
      assertDecisionAllowed({
        action: 'MARK_REJECTED',
        contactAttemptCount: 1,
        rejectionReason: '   ',
      }),
    ).toThrowError(expect.objectContaining({ code: 'REJECTION_REASON_REQUIRED' }))
  })

  it('detects stale administrator screens', () => {
    expect(() => assertExpectedVersion(3, 2)).toThrowError(
      expect.objectContaining({ code: 'VERSION_CONFLICT' }),
    )
  })

  it('derives the contact status from the latest outcome', () => {
    expect(deriveContactStatus('NO_ANSWER')).toBe('ATTEMPTED')
    expect(deriveContactStatus('REACHED')).toBe('REACHED')
    expect(deriveContactStatus('CALLBACK_REQUESTED')).toBe('FOLLOW_UP_REQUIRED')
    expect(deriveContactStatus('INVALID_CONTACT')).toBe('FOLLOW_UP_REQUIRED')
  })

  it('keeps contact recording inside the same workflow state', () => {
    expect(nextStatus('RECORD_CONTACT')).toBeUndefined()
    expect(nextStatus('START_REVIEW')).toBe('UNDER_REVIEW')
  })
})

