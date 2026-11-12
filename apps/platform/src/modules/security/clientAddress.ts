import { isIP } from 'node:net'

export const INTERNAL_CLIENT_ADDRESS_HEADER = 'x-american-adventure-client-address'
export const UNRESOLVED_CLIENT_ADDRESS = 'unresolved'

function forwardedAddresses(headers: Headers) {
  return (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function resolveClientAddress(headers: Headers, trustedProxyHops: number) {
  if (trustedProxyHops === 0) return UNRESOLVED_CLIENT_ADDRESS

  const addresses = forwardedAddresses(headers)
  const candidate = addresses[addresses.length - trustedProxyHops]

  return candidate && isIP(candidate) ? candidate : UNRESOLVED_CLIENT_ADDRESS
}
