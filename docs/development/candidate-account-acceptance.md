# Candidate account activation: local acceptance check

This check covers issue #11. Run it after the automated checks and database migration pass.

## Preparation

1. Start PostgreSQL and run `npm run migrate` from `apps/platform`.
2. Start the application with `npm run dev`.
3. In the Payload admin portal, use an application in `READY_FOR_PROFILE` status.
4. Keep the administrator in the regular browser window and use a private/incognito window for
   the candidate. Payload uses one authentication cookie name per host, so logging in as a
   candidate in the same browser profile replaces the local administrator session.

The default `CANDIDATE_EMAIL_PROVIDER=capture` keeps external candidate communications disabled.
In that mode the administrator panel displays the activation URL so it can be copied without an
external email service. Password-reset messages are captured in the development terminal. With
`resend`, both activation and password-reset messages use the configured production provider.

## Activation and login

1. Open the `READY_FOR_PROFILE` application in the administrator panel.
2. Click **Kreiraj pristup portalu** and confirm that the account status becomes **Čeka aktivaciju**.
3. In local capture mode, click **Kopiraj link**. Open that URL in the private window.
4. Enter citizenship and a password with at least 12 characters, then activate the account.
5. Confirm that the same link cannot be used a second time.
6. Sign in at `http://localhost:3000/nalog/prijava`.
7. Confirm that `http://localhost:3000/moj-nalog` shows the candidate name, program, application
   status, and reference number.
8. Refresh the admin application and confirm that the account status is **Aktivan**.
9. Confirm that the candidate cannot enter `/admin` or read administrative collection data.

## Negative checks

- Confirm that an application outside `READY_FOR_PROFILE` does not show the account-creation action.
- Before activation, confirm that login and password recovery cannot grant portal access.
- While the account is pending, issue a new activation invitation and confirm that the old link is
  rejected while the newly displayed link works.
- Try an incorrect password five times: the account is temporarily locked.
- Try a password shorter than 12 characters through registration and reset: the server rejects it.

## Password recovery

1. Sign out and open `http://localhost:3000/nalog/zaboravljena-lozinka`.
2. Submit the account email and open the reset link printed in the terminal.
3. Set a new password and confirm that the browser returns to the protected portal.
4. Submit an unknown email and confirm that the response is indistinguishable from a known email.

