# Local setup: sensitive contract data

Run these commands in `apps/platform` before testing the contract-readiness flow. Never reuse these local values in a shared or production environment.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Put the two different outputs in `.env`:

```dotenv
SENSITIVE_DATA_ACTIVE_KEY_ID=local-v1
SENSITIVE_DATA_ENCRYPTION_KEYS=local-v1:<first-output>
SENSITIVE_DATA_FINGERPRINT_KEY=<second-output>
```

Keep old encryption entries in the comma-separated key ring during rotation. Do not change the fingerprint key without a dedicated database migration.

After configuring the keys, apply migrations and start the platform:

```bash
npm run migrate
npm run dev
```

Manual verification:

1. Sign in as an active candidate and open `/moj-nalog`.
2. Enter a valid JMBG whose embedded date matches the candidate profile.
3. Upload a PDF/JPEG/PNG passport file smaller than 5 MB.
4. Open `Privatni dokumenti kandidata` in `/admin`, download the document and verify or reject it.
5. Return to `/moj-nalog` and confirm the status changes. A verified passport plus validated JMBG must display `Dokumentacija je spremna`.
6. Confirm `audit-events` contains upload, access and review events without plaintext JMBG, file bytes or rejection text.
