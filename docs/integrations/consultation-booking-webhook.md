# Consultation booking integration contract

Status: provider-neutral MVP contract  
Scope: FR-012, BR-006  
Endpoint: `POST /api/integrations/consultation-bookings`

The platform does not commit the product to Calendly or any other booking provider. A future provider adapter must translate its native webhook into this internal contract. Until a provider is selected, an authenticated administrator can record or reschedule the same consultation in the Admin portal.

## Security

Set `CONSULTATION_WEBHOOK_SECRET` to a random secret that is different from `PAYLOAD_SECRET` and all email-provider credentials. When it is absent, the endpoint returns `503` and external booking intake remains disabled.

The adapter must sign the exact UTF-8 request body with HMAC-SHA256 and send the hexadecimal digest in:

```text
X-AA-Signature: sha256=<hex-digest>
```

The platform verifies the signature with a timing-safe comparison, caps the body at 16 KiB, validates every field, and never logs the shared secret.

## Booking event

```json
{
  "action": "BOOKED",
  "correlationId": "13a60d40-8101-48c6-a308-94c3a055fc46",
  "endsAt": "2026-09-01T11:00:00.000Z",
  "eventId": "provider-event-123",
  "provider": "generic-booking",
  "startsAt": "2026-09-01T10:00:00.000Z",
  "timeZone": "Europe/Belgrade"
}
```

- `correlationId` is the non-sequential application reference supplied to the provider as hidden booking metadata.
- `eventId` is the provider's stable event identifier.
- `provider` contains lowercase letters, numbers, underscores, or hyphens.
- `startsAt` and `timeZone` are required for `BOOKED`; `endsAt` is optional.
- date-times must contain an explicit UTC offset and the time zone must be a valid IANA name.

## Cancellation event

```json
{
  "action": "CANCELLED",
  "correlationId": "13a60d40-8101-48c6-a308-94c3a055fc46",
  "eventId": "provider-event-123",
  "provider": "generic-booking"
}
```

A cancellation is accepted only for the provider event currently linked to a scheduled consultation. A repeated identical booking or cancellation is idempotent and returns `200` with `already_recorded`.

## Responses

- `202 recorded` — a new booking, reschedule, or cancellation was stored and audited.
- `200 already_recorded` — an identical provider event was already applied.
- `401` — missing or invalid signature.
- `404` — application reference not found.
- `409` — event conflict, stale write, or invalid workflow transition.
- `422` — invalid event payload.
- `503` — external booking integration is intentionally disabled.

## Production adapter checklist

1. Verify the native provider webhook before translating it.
2. Map the provider event to this contract without exposing candidate details in logs.
3. Persist the application `correlationId` as provider-side hidden metadata.
4. Keep the provider `eventId` stable across retries.
5. Retry `409` version conflicts and transient `5xx` responses with bounded backoff.
6. Complete provider-specific sandbox and cancellation tests before enabling production traffic.

