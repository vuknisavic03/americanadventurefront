export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const configuredURL = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  try {
    return origin === new URL(configuredURL || request.url).origin
  } catch {
    return false
  }
}
