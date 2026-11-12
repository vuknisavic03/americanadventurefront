import { describe, expect, it } from 'vitest'

import { buildProcessingEndpoint, isProcessingState } from './processingClient.ts'

const validState = {
  application: {
    contactAttemptCount: 0,
    contactStatus: 'NOT_ATTEMPTED',
    consultationStatus: 'NOT_SCHEDULED',
    correlationId: 'test-reference',
    status: 'SUBMITTED',
    workflowVersion: 1,
  },
  contactAttempts: [],
  deliveries: [],
}

describe('admin processing client contract', () => {
  it('builds the custom endpoint from the configured API route', () => {
    expect(buildProcessingEndpoint('/api', 2)).toBe('/api/pre-applications/2/processing')
    expect(buildProcessingEndpoint('/custom-api/', 'application 2')).toBe(
      '/custom-api/pre-applications/application%202/processing',
    )
  })

  it('accepts the processing response and rejects a regular document response', () => {
    expect(isProcessingState(validState)).toBe(true)
    expect(isProcessingState({ id: 2, status: 'SUBMITTED' })).toBe(false)
  })
})

