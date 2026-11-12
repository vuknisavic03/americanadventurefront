import { describe, expect, it } from 'vitest'

import { attachmentContentDisposition } from './contentDisposition.ts'

describe('attachmentContentDisposition', () => {
  it('keeps an ASCII fallback and adds a standards-based UTF-8 filename', () => {
    expect(attachmentContentDisposition('profilna fotografija č.png')).toBe(
      'attachment; filename="profilna fotografija c.png"; filename*=UTF-8\'\'profilna%20fotografija%20%C4%8D.png',
    )
  })

  it('prevents path and header injection characters from reaching the header', () => {
    const header = attachmentContentDisposition('folder\\slika\r\nInjected: value.png')
    expect(header).not.toContain('\r')
    expect(header).not.toContain('\n')
    expect(header).toContain('filename="folder_slika__Injected: value.png"')
  })

  it('always returns a header value accepted by the Response API', () => {
    const header = attachmentContentDisposition('Синтетичка профилна фотографија.png')
    expect(() => new Response(null, { headers: { 'Content-Disposition': header } })).not.toThrow()
  })
})
