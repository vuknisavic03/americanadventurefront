# HTTP boundary security

This runbook defines the platform boundary for client addresses, shared rate limits, response
security headers, HTTPS termination, and HSTS. It applies to local, staging, and production
deployments of `apps/platform`.

## Request boundary

Next.js `proxy.ts` runs before API route handlers. It removes any client-supplied internal address
header, resolves the address only through the configured trusted proxy chain, and applies an atomic
PostgreSQL rate-limit update before protected POST requests reach Payload or custom routes.

Raw client addresses are not stored in `request_rate_limits`. The persisted key is an HMAC-SHA-256
value scoped to one policy and derived with `PAYLOAD_SECRET`. Rows are shared by every application
instance and therefore remain effective across process restarts and horizontal scaling. Expired
rows older than one day are removed opportunistically by subsequent protected requests.

If PostgreSQL is unavailable or the limiter result is invalid, protected requests fail closed with
HTTP 503 and `Retry-After: 5`. A limiter failure must be investigated as an availability incident;
it must never silently disable abuse protection.

## Trusted proxy configuration

`TRUSTED_PROXY_HOPS` is the exact number of trusted reverse-proxy hops between the public client and
Next.js. The address is selected from the right-hand side of `X-Forwarded-For`.

- `0` is the safe default. All forwarding headers are ignored and clients share the `unresolved`
  limiter identity.
- `1` is valid only when one trusted edge proxy directly precedes the application and that proxy
  overwrites or safely appends `X-Forwarded-For`.
- Higher values require an architecture record identifying every trusted hop and its forwarding
  behavior.

Never copy a value from another environment. Before changing it, document the actual path from the
Internet to Next.js and confirm that untrusted callers cannot connect around the trusted edge. A
wrong value can let callers select the address used by the limiter.

## Protected POST endpoints

| Endpoint | Limit and window |
| --- | --- |
| Public pre-application | 5 requests / 10 minutes |
| Candidate recovery (public and Payload) | 5 requests / 15 minutes |
| Candidate activation and password reset | 10 requests / 15 minutes |
| Candidate login | 10 requests / 15 minutes |
| Administrator login and password reset | 10 requests / 15 minutes |
| Administrator recovery and first registration | 5 requests / 15 minutes |

Successful responses expose `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`.
Rejected requests return HTTP 429 and `Retry-After`. Changes to this list or its thresholds require
an abuse-risk review and updated automated tests.

## CSP and security headers

Every route receives a Content Security Policy plus anti-framing, MIME-sniffing, referrer, and
permissions policies. Production CSP upgrades insecure subresource requests. Development alone
allows WebSocket connections and JavaScript evaluation required by the Next.js development server.
The framework-identifying `X-Powered-By` header is disabled.

Review browser console reports after adding any external script, image, font, media, API, or framed
content. Expand only the narrow directive and trusted origin required by the feature; do not replace
the policy with a wildcard.

## HTTPS and HSTS ownership

The reverse proxy or hosting edge owns TLS certificates, HTTP-to-HTTPS redirects, supported
protocols, and direct-origin isolation. The application owns the checked-in HSTS policy and emits it
only when `SECURITY_ENABLE_HSTS=true` is present while the production build is created.

Do not enable HSTS until every public hostname and required subdomain is permanently HTTPS-only.
`includeSubDomains` can make an HTTP-only subdomain unreachable for two years. The edge must not add
a conflicting HSTS value. Preloading is not enabled and requires a separate decision.

## Staging acceptance

Perform these checks on a production-mode staging deployment behind its real edge:

1. Confirm the documented proxy path and set the exact `TRUSTED_PROXY_HOPS` value.
2. Verify that direct-origin access is blocked and that spoofed left-hand forwarding values do not
   change the limiter identity.
3. Send the protected test requests through two application instances, restart one instance, and
   confirm that the count continues from PostgreSQL rather than resetting.
4. Confirm HTTP 429, `Retry-After`, and reset after the configured window; briefly make the limiter
   database unavailable in an isolated drill and confirm HTTP 503 rather than an unprotected pass.
5. Inspect the public response headers:

       curl --head https://staging.example.com/

   Confirm CSP, Permissions-Policy, Referrer-Policy, `X-Content-Type-Options: nosniff`,
   `X-Frame-Options: DENY`, and the absence of `X-Powered-By`.
6. Browse the public form, candidate portal, and administration portal and confirm that the browser
   reports no unexpected CSP violations.
7. After HTTPS coverage is approved, build with `SECURITY_ENABLE_HSTS=true`, redeploy, and confirm
   `Strict-Transport-Security: max-age=63072000; includeSubDomains` over HTTPS.

Record the environment, build SHA, evidence, reviewer, and date in the release ticket. Local and CI
tests are required evidence, but they do not replace this edge-level staging acceptance.
