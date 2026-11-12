# Integration and end-to-end testing

The automated workflow suite uses Playwright for two complementary checks:

- the integration project exercises HTTP endpoints against a real PostgreSQL database;
- the e2e-chromium project drives the public form in Chromium and verifies the resulting
  authenticated administration and background-communication workflow through the API.

All data is synthetic. Candidate messages use the capture provider, so the suite never sends
email. The Playwright configuration refuses to start unless the database name ends in _e2e or
_test.

## First local run

From the repository root, start the disposable test database:

    docker compose --profile testing up -d e2e-database
    cp apps/platform/.env.e2e.example apps/platform/.env.e2e

Then install the browser once, apply migrations, and run the suite:

    cd apps/platform
    npm ci
    npm run test:e2e:install
    npm run migrate:e2e
    npm run test:e2e

Use npm run test:integration when only the HTTP integration checks are needed. The full
npm run test:e2e command runs both projects with one worker so that database state remains
deterministic.

The E2E database listens on port 5433, separately from the normal development database on
port 5432. Its storage is an in-memory Compose mount and is intentionally disposable. Remove
only that test container after the run:

    cd ../..
    docker compose --profile testing stop e2e-database
    docker compose --profile testing rm -f e2e-database

Never replace the synthetic identities in the tests with a real candidate or administrator.

## CI behavior and diagnostics

CI creates a clean PostgreSQL service, installs only Chromium, applies every committed migration,
and runs both Playwright projects. It uploads the Playwright report after every non-cancelled run.
When a test fails, the report includes the error and retains browser traces, screenshots, and
video where available.

The first covered path proves:

1. repeated public submissions with one idempotency key create only one application;
2. unauthenticated callers cannot read administrative processing state;
3. a browser-submitted application can be reviewed, contacted, and qualified;
4. stale workflow versions are rejected rather than overwriting newer administration work;
5. material and consultation messages are processed in capture mode and advance the workflow.
6. public responses contain the centralized security policy without framework disclosure;
7. spoofed forwarding values cannot create fresh limiter identities;
8. limiter expiry and concurrent requests are enforced through PostgreSQL.

This is the foundation tracked by issue
[#27](https://github.com/vookmeer/AmericanAdventure26/issues/27). Additional critical paths should
be added incrementally, keeping external providers disabled and personal data synthetic.
