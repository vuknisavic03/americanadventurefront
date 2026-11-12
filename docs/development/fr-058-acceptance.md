# FR-058 acceptance — flight-ticket payment order

Use synthetic data only.

## Preconditions

1. The candidate process is active and at `TRAVEL_PREPARATION`.
2. The candidate has submitted a flight-ticket request.
3. An administrator has published an FR-057 offer and the candidate has accepted one option.

## Happy path

1. Open the candidate process in Payload Admin and find **Nalog za uplatu avionske karte**.
2. Confirm that the accepted airline, route, option code and original price are shown automatically.
3. For EUR or USD, enter a synthetic NBS rate, rate date and a synthetic source/reference. Enter beneficiary, account, payment reference and a future due date.
4. Click **Generiši i izdaj nalog**.
5. In the candidate portal confirm that the order, original price, RSD amount, deadline and rate metadata are visible.
6. Download the PDF as the candidate and as an administrator. Confirm the accepted flight, candidate, beneficiary, original price, rate and RSD total are correct.
7. Record the payment in Admin. Confirm the candidate portal displays **Uplata evidentirana** and the next action changes to waiting for orientation information.

## Correction and security checks

1. Issue an order, cancel it with a reason and issue a new version. Confirm the old version stays in history and the new number ends with the next version.
2. Confirm another candidate cannot download this order and an unauthenticated request receives `401`.
3. Confirm a second active order and an order without an accepted FR-057 option are rejected.
4. If **Uključi prateći avansni obračun** is selected, verify that document number, PIB and registration number are mandatory and the PDF states that the document is not proof of payment.
