import { describe, expect, it } from 'vitest'

import { projectCandidateProgress } from './workflow.ts'

describe('candidate process projection', () => {
  it('marks previous, current, and upcoming SWT steps', () => {
    const steps = projectCandidateProgress({
      currentStep: 'PROGRAM_APPLICATION',
      processStatus: 'ACTIVE',
      programCode: 'SWT',
    })

    expect(steps.map((step) => step.state)).toEqual([
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'CURRENT',
      'UPCOMING',
      'UPCOMING',
      'UPCOMING',
      'UPCOMING',
      'UPCOMING',
    ])
  })

  it('marks every step completed when the process is completed', () => {
    const steps = projectCandidateProgress({
      currentStep: 'USA_STAY',
      processStatus: 'COMPLETED',
      programCode: 'SWT',
    })

    expect(steps.every((step) => step.state === 'COMPLETED')).toBe(true)
  })

  it('rejects an unsupported program instead of showing an incorrect workflow', () => {
    expect(() => projectCandidateProgress({
      currentStep: 'PROFILE_SETUP',
      processStatus: 'ACTIVE',
      programCode: 'INTERNSHIP',
    })).toThrow('Unsupported candidate process')
  })
})
