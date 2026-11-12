# ADR 0002: Candidate identity and sensitive data boundary

- Status: Accepted for MVP
- Date: 2026-08-28
- Related: #11, FR-015–FR-021

## Context

The platform already has an authentication collection for agency administrators. The candidate
profile requirements add a second kind of identity with a different trust level, lifecycle, and
data visibility. Registration is allowed only after qualification, delivery of preparatory
materials, and successful consultation. The future profile will also contain JMBG and other
sensitive personal data.

Using the administrator collection for both groups would make every access rule harder to reason
about and increase the impact of a configuration mistake. Accepting arbitrary public sign-up would
also allow accounts that are not connected to an approved application.

## Decision

1. Candidate identities use the separate Payload auth collection `candidate-accounts`. Only the
   `users` collection can authenticate into the Payload administration panel.
2. There is no public self-registration. When a pre-application reaches `READY_FOR_PROFILE`, an
   administrator explicitly creates portal access. The system creates a `PENDING_ACTIVATION`
   account linked to the approved application and sends a single-use activation link to the email
   already recorded on that application.
3. Activating the link proves control of the email address and lets the candidate choose their own
   password. The account then becomes `ACTIVE`. Administrator approval and proof of email ownership
   are intentionally separate controls; an administrator cannot silently replace the latter.
4. Activation tokens are deterministic signed values built from a random per-invitation nonce,
   account identifier, invitation version, and expiry. The complete token is never stored in the
   database. Issuing a new invitation increments the version and immediately invalidates older
   links. Links expire after 48 hours and can be used only once.
5. Payload owns password hashing, HTTP-only session cookies, login lockout, password-reset tokens,
   and reset-token expiry. Application code never stores a candidate-selected plain-text password.
6. Administrative access checks must explicitly require `req.user.collection === 'users'`.
   Merely checking that some user is authenticated is not sufficient after the second auth
   collection is introduced.
7. A candidate can read only their own candidate account. The protected portal resolves the
   application from the authenticated account identifier on the server; it never trusts an
   application identifier supplied by the browser.
8. JMBG is deferred from this slice. It must not be stored until the platform has an approved
   encryption-at-rest design, a separately managed encryption key, access logging, masking, and a
   retention/deletion policy. Adding the database column without those controls is not acceptable.

## Security controls in the MVP

- administrator-issued access after final profile readiness approval
- 48-hour, signed, single-use activation link with resend invalidation
- explicit `PENDING_ACTIVATION`, `ACTIVE`, and `SUSPENDED` account states
- minimum password length of 12 characters and maximum of 128
- five failed login attempts followed by a 15-minute lock
- two-hour authenticated session and 30-minute password-reset link
- secure cookies in production with `HttpOnly` managed by Payload and `SameSite=Lax`
- rate-limited and non-enumerating password-recovery responses
- immutable links between candidate account, applicant, and approved pre-application
- audit events when an invitation is requested, delivered, and activated
- one outbox/email-provider path for activation and other candidate communications

The legacy `CANDIDATE_ACCOUNT_REGISTERED` audit value remains readable for compatibility with
development databases created by the earlier Draft PR implementation. New code never emits it.

## Consequences

This design adds a second auth table and requires existing administrative collection checks to be
more specific. It also makes account creation an explicit agency operation instead of asking the
candidate to discover a registration page. In return, candidate and administrator permissions are
structurally separated, the agency can see the complete activation lifecycle, and email ownership
is still proven by the candidate.

The first portal page intentionally exposes only basic program and workflow status. Full program
steps, document upload, contracts, and JMBG collection remain separate increments. Before JMBG is
implemented, the team must accept a follow-up ADR covering encryption keys, masking, staff access,
backup handling, and retention.

