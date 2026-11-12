# Candidate program application — acceptance guide

Use synthetic names, dates, phone numbers, and narrative answers. Do not enter real candidate or emergency-contact data during development testing.

## Preconditions

1. From `apps/platform`, apply migrations with `npm run migrate`.
2. Start the platform with `npm run dev`.
3. Use an active, verified candidate whose process is at `PROGRAM_APPLICATION` after confirmation of the first payment.

## Prepare a Work & Travel template

1. Sign in to `/admin`.
2. Open **Programske aplikacije → Šabloni programskih aplikacija**.
3. Create a template named `Sintetička Work & Travel aplikacija`, program `SWT`, version `1`, status `Nacrt`.
4. Add the following representative fields:

| Key | Label | Type | Required | Maximum |
| --- | --- | --- | --- | --- |
| `emergencyContactName` | Kontakt za hitne slučajeve | Kratak tekst | yes | 160 |
| `emergencyContactPhone` | Telefon kontakta | Kratak tekst | yes | 80 |
| `preferredDepartureDate` | Željeni datum polaska | Datum | yes | — |
| `previousUsaSeasons` | Broj prethodnih sezona | Broj | no | — |
| `workExperience` | Radno iskustvo i veštine | Duži tekst | yes | 2000 |

5. Save the draft, then change its status to `Aktivan` and save again.
6. Confirm that a second active `SWT` template is rejected. To publish a new version later, retire the current version first.

## Candidate draft flow

1. Sign in at `/nalog/prijava` and open `/moj-nalog`.
2. Confirm the **Programska aplikacija** panel shows the active template name and version.
3. Fill only some fields and select **Sačuvaj nacrt**.
4. Sign out, sign in again, and confirm the saved values and completion percentage remain present.
5. Open the same draft in a second tab. Save in the first tab, then try to save the older copy in the second tab. The second request must be rejected with an instruction to refresh.
6. Enter an invalid number or an overlong answer and confirm the server returns a field-level validation message.

## Final submission

1. Leave one required field empty and select **Predaj aplikaciju**. Submission must be rejected and the missing field marked.
2. Complete every required field and submit again.
3. Confirm the panel becomes read-only and shows the submission time.
4. Refresh the page and confirm the answers remain unchanged.
5. Confirm the candidate process advances from `PROGRAM_APPLICATION` to `DOCUMENTS`.
6. Repeat the submission request and confirm the submitted application cannot be changed.

## Administrator review

1. Open **Programske aplikacije → Prijave kandidata**.
2. Find the synthetic candidate and confirm status, completion percentage, template name, version, last save, and submission time.
3. Open the application and confirm **Odgovori kandidata** presents every label and answer in a readable, read-only panel.
4. Confirm the collection does not offer a working delete or direct-edit workflow.
5. Inspect audit events for template drafting, activation, application creation, draft save, and final submission.

## Ownership check

1. Sign in as a different candidate and call the save endpoint using copied browser request data.
2. Confirm that candidate cannot read or change the first candidate's application.
3. Confirm a candidate who has not reached `PROGRAM_APPLICATION` does not see the form and receives a forbidden response from the mutation endpoint.
