# ADR 0026: USA stay materials, privacy-preserving peer networking, and curated tips

- Status: Accepted
- Date: 2026-10-08
- Requirement: FR-060, FR-061, FR-062

## Context

PRILOG 1 defines in-USA candidate support requirements for the Summer Work & Travel lifecycle:
- FR-060: Administrators publish program and support materials that candidates can download and review during their stay.
- FR-061: Candidates placed with the same employer or in the same US state can view peers' email contacts to coordinate travel and housing, subject to privacy rules.
- FR-062: Administrators curate and maintain practical tips and guidelines for living and working in the USA.

Candidate personal and contact data must remain protected under European and domestic data-protection principles (GDPR / ZZPL). Sharing candidate email addresses or placement locations without explicit, unambiguous candidate consent is prohibited.

## Decision

1. **USA Stay Materials (FR-060)**:
   - A dedicated `UsaStayMaterials` collection (`usa-stay-materials`) stores official documents, handbooks, emergency contacts, tax guides, and health insurance guidelines.
   - Administrators manage entries with categories (`HANDBOOK`, `INSURANCE`, `SEVIS`, `EMERGENCY`, `TAXES`, `OTHER`), program scoping (`SWT`, `ALL`), sort orders, and a publication switch.
   - Authenticated candidates in active programs can query and download published materials directly through their portal.

2. **Privacy-Preserving Peer Networking (FR-061)**:
   - Peer contact discovery is strictly **opt-in**. A candidate must explicitly grant consent (`peerSharingConsent = true`) in their portal before their contact is visible to anyone, and before they can view peers.
   - When consent is active, the candidate can see peers who also consented and are either:
     a) bound to the same employer (`sameEmployer`), or
     b) located in the same US state (`sameState`).
   - Exposed fields are minimized: candidate name, email, employer name, city, and state. Phone numbers, JMBGs, and passport details are never exposed.
   - Candidates can revoke consent at any time, immediately removing them from all peer directories.

3. **Curated USA Tips (FR-062)**:
   - A dedicated `UsaStayTips` collection (`usa-stay-tips`) stores practical guidance categorized by topic (`SSN`, `BANKING`, `HOUSING`, `TRANSPORT`, `WORK_CULTURE`, `HEALTH_SAFETY`, `GENERAL`).
   - Administrators curate titles, summaries, detailed instructions, pinned priorities, and sort orders in the CMS.
   - Candidates can browse, search, and filter tips by category within the portal.

## Consequences

- Compliance: Candidate privacy is preserved by default; no contact is exposed without opt-in consent.
- Agility: Agency coordinators can publish and update travel materials, SOS numbers, and practical advice in the CMS without code changes or deployments.
- Auditability: Peer consent updates and materials queries are protected and traceable.
