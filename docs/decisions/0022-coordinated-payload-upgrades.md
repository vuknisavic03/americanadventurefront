# ADR 0022: Coordinated Payload suite upgrades

- Date: 2026-09-21
- Status: Accepted
- Context: Payload 3.90 security and compatibility maintenance

## Decision

The `payload` package and every runtime package under `@payloadcms/*` are upgraded
together to the same exact version. For this increment the complete suite moves from
3.88.0 to 3.90.1. Partial upgrades and peer-dependency overrides such as `--force`
or `--legacy-peer-deps` are not accepted because they can produce an install that is
reproducible neither locally nor in CI.

Dependabot groups future minor and patch updates for `payload` and `@payloadcms/*`
into one pull request. Major releases remain separate so that their migration notes
and breaking changes can be reviewed explicitly.

The lockfile is regenerated from the updated manifest because npm cannot safely
resolve the old 3.88 dependency graph incrementally. A clean `npm ci` remains the
reproducibility gate. Generated Payload types and the import map are refreshed after
the upgrade.

Payload 3.90 adds `resetPasswordRequestedAt` to authenticated collections. The
database change is represented by an explicit reversible migration that adds the
corresponding columns to administrator and candidate accounts. Production rollout
must run migrations before serving application traffic from the new release.

## Compatibility review

The application does not use Payload API-key authentication helpers or direct
Lexical package imports affected by the 3.90 release notes, so no application-level
compatibility changes are required for those items.

## Verification

- clean dependency installation and exact-version inspection;
- lint, TypeScript, unit, build, integration and browser test suites;
- migration up/down/up verification against the isolated E2E database;
- production dependency audit with high severity as the failure threshold.

Moderate advisories inherited through Monaco and the Drizzle development toolchain
remain tracked separately and are not hidden by forced dependency resolutions.
