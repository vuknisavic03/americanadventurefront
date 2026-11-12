# Electronic contract acceptance verification

Use synthetic candidate and document data only. Never upload a real passport or personal identifier to a development environment.

## Preparation

1. Check out the branch under review, confirm it starts from current `main`, and ensure the working tree is clean.
2. Start PostgreSQL and apply all migrations with `npm run migrate` from `apps/platform`.
3. Start the application with `npm run dev`.
4. Prepare one synthetic candidate that has a generated contract and can sign in to the candidate portal.

## Candidate flow

1. Sign in as the owning candidate and open `/moj-nalog`.
2. Confirm that the contract section says that acceptance is pending.
3. Download the draft and confirm that it carries the draft watermark.
4. Submit without selecting the confirmation checkbox and confirm that the portal rejects the action.
5. Select the checkbox and accept the contract.
6. Confirm that the portal shows the acceptance time and reference and that the process moves to `Prva uplata`.
7. Download the accepted PDF and confirm that it has no draft watermark and includes the acceptance evidence block.
8. Repeat the acceptance request and confirm that no duplicate acceptance is created.

## Authorization and audit checks

1. Sign in as another synthetic candidate and request the acceptance or accepted-PDF URL directly. Confirm that both return a not-found response.
2. Sign in as an administrator and open `Prihvatanja ugovora` in the admin portal.
3. Confirm that the record shows the source and final checksums, statement version, acceptance time, and reference, but no encrypted fields.
4. Download the final PDF as administrator.
5. Confirm that the audit collection contains one `CONTRACT_ACCEPTED` event and access events for candidate and administrator downloads.

## Regression checks

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The CI workflow additionally applies every migration against a clean PostgreSQL database.

