# ADR-0001: Record material architecture decisions

- Status: Accepted
- Date: 2026-08-25

## Context

The platform spans a public website, pre-application workflow, candidate portal, agency administration, documents, finance, communications, and external integrations. Its contract requires ownership, portability, auditability, and future commercial development. Undocumented technical choices would create avoidable rework and vendor lock-in.

## Decision

Material architecture decisions will be recorded as version-controlled ADRs before or with their implementation. Each ADR will describe the context, selected option, consequences, and meaningful alternatives.

## Consequences

- Reviewers can evaluate decisions independently from implementation details.
- Future maintainers can understand why a technology or boundary was selected.
- Reversing a decision requires an explicit superseding ADR.
- Small local implementation choices do not require an ADR.

## Alternatives considered

- Decisions kept only in chat or meetings: rejected because they are not durable or reviewable.
- One continuously rewritten architecture document: rejected because it obscures decision history.
