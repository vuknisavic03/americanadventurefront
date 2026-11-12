# Candidate profile and program progress: local acceptance check

This check covers issue #13. Run it after the automated checks and database migration pass.

## Preparation

1. Start PostgreSQL and run `npm run migrate` from `apps/platform`.
2. Start the application with `npm run dev`.
3. Use an active candidate account created through the administrator-issued activation flow.
4. Keep the administrator and candidate in separate browser profiles or an incognito window.

## Candidate portal

1. Sign in at `http://localhost:3000/nalog/prijava` and open `/moj-nalog`.
2. Confirm that the page shows the current step, candidate-facing next action, program status,
   reference number, and the complete SWT timeline.
3. Confirm that the timeline clearly distinguishes completed, current, and upcoming steps.
4. Change phone, residential address, and citizenship and save the form.
5. Refresh the page and confirm that the saved values remain visible.
6. Try an invalid phone value and confirm that a Serbian validation message is displayed without
   exposing a stack trace.
7. Sign out and confirm that `/moj-nalog` redirects to the candidate login page.

## Administration

1. Open **Kandidatski portal → Procesi kandidata** in Payload admin.
2. Confirm that an existing active candidate has one process linked to the correct candidate,
   account, application, and SWT program.
3. Change the current step, candidate-facing next action, optional due date, and internal note.
4. Refresh the candidate portal and confirm that the current step and next action changed.
5. Open **Kandidatski portal → Kandidati** and confirm that the updated phone and address are
   visible to the administrator.
6. Confirm through the audit collection or database that `CANDIDATE_PROCESS_UPDATED` and
   `CANDIDATE_PROFILE_UPDATED` events were recorded with timestamps.

## Authorization checks

- A candidate must not be able to read another candidate's `candidate-processes` record.
- A candidate must not be able to change their name, birth date, email, process step, due date, or
  internal administrator note through the profile endpoint.
- A pending or suspended account must not be able to update profile data.
- An unsupported program must not silently display the SWT workflow.
