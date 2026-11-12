# American Adventure Platform

Integrated digital platform for American Adventure: public website, pre-application and candidate
selection, candidate portal, agency administration, documents, finance, communication, and
operational automation.

## Project status

The project is in the implementation-foundation phase. The repository now contains an integrated
Next.js and Payload application backed by PostgreSQL, while the existing React application remains
the UI/UX prototype. Business workflow modules will be introduced incrementally through reviewed
pull requests.

## Repository layout

- `apps/platform/` - integrated Next.js, Payload, and PostgreSQL application
- `front/` - React, Vite, and Tailwind UI/UX prototype
- `docs/decisions/` - Architecture Decision Records
- `docs/change-requests/` - approved implementation deviations awaiting contractual confirmation
- `docs/domain/` - accepted workflow and domain decisions
- `docs/development/` - developer setup and operating guides
- `docs/requirements/` - source requirement status and delivery traceability
- `docs/runbooks/` - controlled operational procedures
- `.github/workflows/` - automated quality gates

The administration portal is the system of record for application data. Avoid introducing a second
source of truth for applications or workflow state.

## Local development

Requirements:

- Node.js version from `.nvmrc`
- npm version declared by each application's `packageManager` field
- Docker Desktop or another Docker-compatible engine

Quick start:

```bash
docker compose up -d database
cd apps/platform
cp .env.example .env
npm ci
npm run migrate
npm run dev
```

See [docs/development/local-development.md](docs/development/local-development.md) for Windows
commands, full-container startup, quality checks, and the migration workflow.

Before testing JMBG or passport handling, generate the separate local encryption and fingerprint
keys described in [docs/runbooks/sensitive-data-local-setup.md](docs/runbooks/sensitive-data-local-setup.md).
The same encrypted private-document boundary protects the Work & Travel program checklist; use only
the synthetic samples described in
[docs/development/program-document-checklist-acceptance.md](docs/development/program-document-checklist-acceptance.md).

## Database recovery

Encrypted backup commands, isolated recovery and key custody are described in
[the database recovery runbook](docs/runbooks/database-backup-restore.md).
The automated rehearsal uses disposable databases and synthetic records; production backup
scheduling and off-host retention still require deployment configuration.

## Operational health

The platform separates process liveness (`/api/health`) from database-backed readiness
(`/api/ready`). A token-protected `/api/operations/status` endpoint reports safe aggregate queue,
job and security signals. See `docs/runbooks/monitoring-incident-response.md`; external production
alert delivery and escalation ownership remain deployment decisions.

## Delivery workflow

Development is performed on short-lived branches and merged into `main` through pull requests.
Direct development on `main` is not permitted. Every pull request must identify the relevant
functional or non-functional requirement, describe verification, and pass all required checks.

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch names, commit conventions, review rules, and the
Definition of Done.

The authoritative implementation status is maintained in
[docs/requirements/traceability-matrix.md](docs/requirements/traceability-matrix.md). A feature is
not considered contractually complete merely because code exists; it also needs linked verification.

## Security and personal data

This system processes personal, contractual, financial, and travel data. Never commit real candidate
data, passwords, access tokens, provider credentials, production exports, or unapproved document
samples. See [SECURITY.md](SECURITY.md).

The current platform foundation and frontend prototype must use synthetic data only. Production
authentication, authorization review, backups, observability, privacy controls, and deployment
approval remain explicit production gates.
