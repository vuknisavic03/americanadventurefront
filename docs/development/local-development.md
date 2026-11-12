# Local development

This guide starts the integrated Next.js and Payload platform with PostgreSQL. The existing
`front/` application remains available as the approved UI prototype and is not replaced by this
foundation.

## Requirements

- Node.js version from `.nvmrc`
- npm version declared by each application's `packageManager` field (currently `11.17.0`)
- Docker Desktop or another Docker-compatible engine

Node.js 22 may include an older npm release. After selecting the Node.js version from `.nvmrc`,
align npm before installing dependencies:

```bash
npm install --global npm@11.17.0
npm --version
```

The printed version must match the `packageManager` value. CI performs the same alignment so that
developer, Dependabot, and CI lockfile validation use one npm implementation.

## First start

From the repository root, start PostgreSQL:

```bash
docker compose up -d database
```

Create the local environment file:

WSL, Linux, or macOS:

```bash
cp apps/platform/.env.example apps/platform/.env
```

Windows PowerShell:

```powershell
Copy-Item apps/platform/.env.example apps/platform/.env
```

Replace `PAYLOAD_SECRET` in `.env` with a locally generated random value. Never commit `.env`.
Keep `TRUSTED_PROXY_HOPS=0` when Next.js is reached directly during local development; this safely
ignores caller-controlled forwarding headers. The shared limiter may therefore group local clients
under one identity. Production proxy and HSTS configuration is covered by
[the HTTP boundary security runbook](../runbooks/http-boundary-security.md).
Before testing JMBG, passport, or contract features, also generate the encryption and fingerprint
keys from [the sensitive-data setup runbook](../runbooks/sensitive-data-local-setup.md). The example
values are deliberately invalid placeholders.

Install, migrate, and start the platform:

WSL, Linux, or macOS:

```bash
cd apps/platform
npm ci
npm run migrate
npm run dev
```

Windows PowerShell:

```powershell
Set-Location apps/platform
npm ci
npm run migrate
npm run dev
```

Open:

- platform landing page: `http://localhost:3000`
- administration portal: `http://localhost:3000/admin`
- liveness endpoint: `http://localhost:3000/api/health`
- database-backed readiness endpoint: `http://localhost:3000/api/ready`

Protected aggregate diagnostics are disabled unless a private `OBSERVABILITY_TOKEN` of at least
32 characters is set; see `docs/runbooks/monitoring-incident-response.md` before enabling it.

On first access to the administration portal, Payload guides the developer through creating the
first local administrator. Use synthetic development details only.

## Full container start

To build and run both the application and database in containers:

```bash
docker compose up --build
```

The platform container reads `apps/platform/.env`; create and populate it before this command. The
container overrides only the database hostname and public server URL required by Compose networking.

The compose credentials are intentionally local-development defaults. They are not suitable for a
shared, staging, or production environment.

## Quality checks

Run the same essential checks used by CI:

```bash
cd apps/platform
npm run lint
npm run typecheck
npm test
npm run build
```

CI also applies all committed migrations to a clean PostgreSQL database and rejects high-severity
findings in production dependencies.
It also verifies security headers, forwarding-header spoof resistance, limiter expiry and concurrent
updates, and the fail-closed database-error path.

The integration and browser workflow suite uses a separate disposable database. Follow
[the integration and end-to-end testing guide](integration-e2e-testing.md); never point those
tests at the normal development database.

The separate UI prototype has its own dependency and build checks:

```bash
cd front
npm audit --audit-level=high
npm run build
```

## Candidate communication in local development

The local default is `CANDIDATE_EMAIL_PROVIDER=capture`. Qualified-candidate messages are rendered,
hashed, processed by the background queue, and recorded under **Automatizacija > Isporuke poruka**,
but no email leaves the developer machine. The queue runs every ten seconds while the platform
process is running.

To test the workflow, submit a synthetic application, record a contact attempt, and mark the
applicant as qualified. The application advances through `QUALIFIED`, `MATERIALS_SENT`, and
`CONSULTATION_INVITED` only after the corresponding captured delivery succeeds.

Real sending uses the provider-neutral adapter with `CANDIDATE_EMAIL_PROVIDER=resend` and requires
`RESEND_API_KEY`. Sender-domain verification, official contact values, approved content, and
deliverability testing remain production release gates. Never place provider credentials in a
committed file.

## Database migrations

Payload may synchronize schema changes automatically while running in development mode. Every
schema change intended for a shared environment must also have a committed migration:

```bash
cd apps/platform
npm run migrate:create -- meaningful-change-name
```

Review the generated TypeScript and snapshot files, run the quality checks, and commit them with the
schema change. In production mode, the platform applies the committed migration list during startup.

## Backup and restore rehearsal

Use [the database recovery runbook](../runbooks/database-backup-restore.md) for encrypted backups
and the isolated synthetic recovery exercise. Run `npm run test:backup` and `npm run test:restore`
from apps/platform. The rehearsal provisions its own disposable databases and never targets the
normal development database.

## Stop local services

```bash
docker compose down
```

This preserves the named PostgreSQL volume. Removing that volume deletes local database data and
should only be done intentionally.

