function encodeRFC5987(value: string) {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

export function attachmentContentDisposition(fileName: string) {
  const normalized = fileName
    .normalize('NFC')
    .replace(/[\\/\r\n]/g, '_')
    .trim()
    .slice(0, 180) || 'dokument'
  const asciiFallback = normalized
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/"/g, '_')

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeRFC5987(normalized)}`
}
