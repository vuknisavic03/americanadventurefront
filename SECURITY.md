# Security policy

## Scope

American Adventure handles personal, identity, contractual, financial, and travel-related data. Security and privacy requirements apply from the first implementation increment.

## Reporting

Do not disclose a suspected vulnerability or exposed credential in a public issue. Notify the repository owner through a private channel and include the affected component, reproduction steps, and potential impact.

## Repository rules

- Never commit passwords, tokens, API keys, private keys, production environment files, or provider credentials.
- Never commit real candidate records, identity documents, passports, payment data, or production exports.
- Use synthetic fixtures in development and automated tests.
- Treat client-side checks as usability features, never as authorization.
- Validate untrusted input on the server.
- Keep secrets in an approved secret store and rotate any credential that may have been exposed.
- Avoid logging form payloads or other sensitive personal data.
- Treat forwarding headers as untrusted unless the exact proxy chain is configured and verified.
- Keep authentication, recovery, activation, and public intake endpoints behind the shared limiter.

## HTTP boundary

The integrated platform uses a PostgreSQL-backed limiter, a trusted-proxy boundary, and centralized
response security headers. Deployment ownership, configuration, failure behavior, and staging
acceptance are defined in
[the HTTP boundary security runbook](docs/runbooks/http-boundary-security.md).

Do not enable HSTS merely because TLS exists on one hostname. First verify permanent HTTPS coverage
for every affected hostname and subdomain, then rebuild and deploy with the documented setting.

## Dependency management

- Dependabot checks both npm applications weekly and proposes reviewable pull requests.
- CI rejects high-severity findings in production platform dependencies and in the complete
  frontend-prototype dependency tree.
- Do not run `npm audit fix --force` as a routine correction. Review the advisory, affected runtime
  path, compatibility impact, lockfile diff, and build/test evidence.
- Moderate or lower findings without a safe upstream fix must be recorded and reviewed before a
  production release; a green CI run is not a blanket security approval.
- Dependency pull requests follow the same review and verification rules as product changes.

## Immediate prototype warning

The current frontend contains placeholder client-side login behavior and demo records. It is not a security boundary and must not be deployed as a protected administration or candidate portal.
