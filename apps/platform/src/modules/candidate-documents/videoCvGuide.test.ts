import { describe, expect, it } from 'vitest'

import {
  extractYouTubeVideoId,
  validateYouTubeUrl,
  VIDEO_CV_GUIDELINES,
} from './videoCvGuide.ts'

describe('videoCvGuide domain', () => {
  it('defines official agency Video CV guidelines with 5 sample videos and questions', () => {
    expect(VIDEO_CV_GUIDELINES.maxDurationSeconds).toBe(120)
    expect(VIDEO_CV_GUIDELINES.officialSampleVideos).toHaveLength(5)
    expect(VIDEO_CV_GUIDELINES.mandatoryTopics.length).toBeGreaterThanOrEqual(2)
    expect(VIDEO_CV_GUIDELINES.recommendedQuestions.length).toBeGreaterThanOrEqual(10)
    expect(VIDEO_CV_GUIDELINES.mandatoryFinalQuestion).toContain('Šta bi još kompanija')

    for (const sample of VIDEO_CV_GUIDELINES.officialSampleVideos) {
      expect(validateYouTubeUrl(sample.url)).toBe(true)
    }
  })

  it('validates various YouTube URL formats', () => {
    expect(validateYouTubeUrl('https://www.youtube.com/watch?v=5nfIF6QW3RM')).toBe(true)
    expect(validateYouTubeUrl('https://youtu.be/PhtfiddS9P8?si=LlT1WzkrVwPHUoY1')).toBe(true)
    expect(validateYouTubeUrl('https://youtu.be/GN8l0aBMz5I')).toBe(true)
    expect(validateYouTubeUrl('http://youtube.com/embed/gxBT9ZUC93w')).toBe(true)
    expect(validateYouTubeUrl('https://www.youtube.com/shorts/ZULkNRep1HA')).toBe(true)

    expect(validateYouTubeUrl('https://vimeo.com/123456')).toBe(false)
    expect(validateYouTubeUrl('https://example.com/video.mp4')).toBe(false)
    expect(validateYouTubeUrl('not-a-url')).toBe(false)
    expect(validateYouTubeUrl('')).toBe(false)
  })

  it('extracts YouTube Video ID accurately', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=5nfIF6QW3RM')).toBe('5nfIF6QW3RM')
    expect(extractYouTubeVideoId('https://youtu.be/PhtfiddS9P8?si=123')).toBe('PhtfiddS9P8')
    expect(extractYouTubeVideoId('https://youtube.com/embed/GN8l0aBMz5I')).toBe('GN8l0aBMz5I')
    expect(extractYouTubeVideoId('invalid')).toBeNull()
  })
})
