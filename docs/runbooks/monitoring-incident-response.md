# Monitoring and incident response

Related: [ADR-0010](../decisions/0010-operational-health-signals.md), NFR-004, NFR-006,
NFR-007 and issue #29.

## Current capability and production boundary

The application now provides health signals and a repeatable incident procedure. It does not yet
send production alerts. Before launch, the owner must select the hosting/monitoring provider, name a
primary on-call owner and deputy, approve notification channels and verify alerts from the deployed
edge. Never use a candidate's email or phone number as an operational contact.

| Endpoint | Purpose | Healthy result | Visibility |
| --- | --- | --- | --- |
| `/api/health` | Web-process liveness | HTTP 200, `status: ok` | Public, generic |
| `/api/ready` | Application and database readiness | HTTP 200, `status: ready` | Public, generic |
| `/api/operations/status` | Queues, jobs and security aggregates | HTTP 200, `ok` or `degraded` | Separate bearer token |

All responses use `Cache-Control: no-store`. A missing or incorrect operations token receives HTTP
404. Configure a distinct random value of at least 32 characters as `OBSERVABILITY_TOKEN` in the
deployment secret manager. Do not add it to Git, screenshots, support tickets or command history.
Monitoring must call the endpoint only over HTTPS and preferably through an edge allowlist.

Example local check after setting a synthetic token in a private `.env`:

    curl --fail-with-body http://localhost:3000/api/health
    curl --fail-with-body http://localhost:3000/api/ready
    curl --fail-with-body -H "Authorization: Bearer $OBSERVABILITY_TOKEN" \
      http://localhost:3000/api/operations/status

Do not paste the expanded command or token into an incident report. Store only timestamp, environment,
HTTP status, safe aggregate signal names and the application-generated correlation identifier.

## Signals

The protected report is `degraded` when candidate communication is failed, immediately overdue or
has remained `PROCESSING` for more than 15 minutes, or when a Payload job failed during the last 24
hours or remained processing for more than 15 minutes. Active request-rate-limit blocks are reported
as `security: attention`; they do not alone make the service degraded because ordinary abuse controls
can legitimately block a client.

These are aggregate counts, not a substitute for authorized investigation in the Admin portal and
provider dashboard. A successful status call does not prove that an external email provider, booking
service or DNS is healthy unless a real workflow has recently completed.

## Proposed alert policy

The following policy is a launch proposal, not an active or approved production configuration:

| Condition | Proposed trigger | Initial action |
| --- | --- | --- |
| Liveness failure | 3 consecutive checks within 2 minutes | Page primary and deputy; inspect deployment |
| Readiness/DB failure | 2 consecutive checks within 2 minutes | Page immediately; stop releases and jobs |
| Operations unavailable | 2 consecutive checks within 5 minutes | Treat as readiness/security configuration incident |
| Communications/jobs degraded | 2 checks within 10 minutes | Notify operations; pause automatic retries if volume grows |
| Active security blocks | Sharp increase over established baseline | Security review; do not relax limits during an attack |
| Backup or restore rehearsal failed | Any scheduled failure | Keep issue/release gate open; preserve last valid copy |

The owner must approve baselines, business hours, escalation contacts, RPO/RTO and paging channels.
Test each alert by creating a controlled non-production failure before declaring monitoring ready.

## Incident procedure

1. Acknowledge the alert and record UTC start time, environment, affected capability and incident
   lead. Never copy raw request bodies, database rows, passwords, tokens, JMBG or document content.
2. Confirm the signal from a second trusted location. Compare liveness and readiness to distinguish
   a web-process failure from a database/dependency failure. Do not repeatedly run mutating commands.
3. Contain impact. Freeze deployments. For database uncertainty or growing failed communications,
   stop background workers/retries before changing data. Keep public providers disabled in a restored
   environment.
4. Inspect safe deployment logs by correlation identifier and aggregate status. Use the Admin portal
   only with an authorized account. Provider dashboards are the source for external delivery status.
5. Recover using the matching scenario below. Prefer a known-good deployment rollback when code is
   causal; use the database recovery runbook only after confirming restore is necessary.
6. Validate health, representative authorized workflows and external side effects. Reconcile queued
   email/payment/provider operations before restarting workers so completed work is not duplicated.
7. Communicate status without personal data. Record decisions, timeline, impact, recovery validation
   and follow-up owner. Rotate any credential that may have appeared in logs or been exposed.

## Scenario guidance

### Application is not live

Inspect the deployment event, resource exhaustion and last release. If the current release caused the
failure, roll traffic back to the last verified application revision while preserving the database.
Do not run down migrations as an automatic rollback. Verify `/api/health`, then `/api/ready`, before
returning traffic.

### Database is unavailable

Stop deployments and background jobs, confirm database service and connection-secret availability,
and inspect provider status. Do not print `DATABASE_URL`. If corruption or data loss is suspected,
follow [database backup and recovery](database-backup-restore.md) in an isolated environment. Routing
the application to a restored database is a separate approved step after record and key validation.

### Candidate communications or jobs are degraded

Record aggregate failed/overdue/stuck counts. Inspect the relevant outbox, delivery and Payload job
records through authorized tools; compare provider delivery state before retrying. Correct the cause,
then retry one idempotent event and verify its audit record before releasing the rest. Do not edit
completed deliveries or erase failure evidence to make the signal green.

### Security attention increases

Confirm the edge is forwarding only the configured trusted proxy chain. Review aggregate request
rates and affected scopes without exposing address hashes. Preserve evidence, restrict at the edge
if necessary and rotate credentials on credible exposure. Never disable rate limiting or broaden
admin access as a quick recovery measure.

## Credential rotation order

Create and store the replacement in the secret manager, deploy it to consumers, validate service,
then revoke the old value. The observability token can be replaced directly with coordinated monitor
configuration. `PAYLOAD_SECRET` and sensitive-data encryption keys have data/session consequences and
require their dedicated migration plan; do not rotate them ad hoc. Email/webhook credentials must be
changed both at the provider and application, with outbound work paused during the transition.

## Verification and ownership record

Before production acceptance, record the following outside candidate data stores:

- primary incident owner and deputy, with an approved private contact channel;
- monitoring and hosting provider/account owner;
- approved thresholds, paging hours, RPO/RTO and maintenance windows;
- dated proof for liveness, readiness, database outage, degraded queue and token-rejection alerts;
- last successful incident simulation and open corrective actions.

Run `npm test`, `npm run test:integration`, `npm run typecheck` and `npm run lint` after changing the
status contract. The integration suite verifies the public separation, disabled/wrong-token behavior
and safe aggregate response. Production acceptance remains open until external alert delivery and
escalation ownership are demonstrated.
