---
name: KAMALO AI escalation workflow
description: Ticket, evidence, analysis, resolution, and email boundaries for the support escalation system.
---

Ticket escalation is a controlled support workflow, not an assistant action: user feedback creates a persisted ticket with conversation context and validated image references; a specialist must verify any AI draft before resolving it.

**Why:** Stage 1 must remain grounded and must not claim account access or completed support actions. The ticket system needs a durable handoff without weakening that boundary.

**How to apply:** Keep customer and admin ticket views backed by the same record, keep AI analysis behind the existing provider boundary, and treat the temporary admin route and fallback email sender as test-only until authentication and sender verification are added.

Ticket seriousness is represented by five server-owned levels: informational, standard, elevated, urgent, and critical. Browser locale is stored as language metadata; voice must not be presented as supported until a real speech provider path exists.

**Why:** Escalation must be consistent across customer and admin views, while the current assistant provider is text-only and cannot truthfully interpret voice.

**How to apply:** Calculate levels from validated ticket content and evidence on the server, expose the level in every ticket response, and derive language from the request locale rather than trusting the browser form.