---
name: KAMALO AI escalation workflow
description: Ticket, evidence, analysis, resolution, and email boundaries for the support escalation system.
---

Ticket escalation is a controlled support workflow, not an assistant action: user feedback creates a persisted ticket with conversation context and validated image references; a specialist must verify any AI draft before resolving it.

**Why:** Stage 1 must remain grounded and must not claim account access or completed support actions. The ticket system needs a durable handoff without weakening that boundary.

**How to apply:** Keep customer and admin ticket views backed by the same record, keep AI analysis behind the existing provider boundary, and treat the temporary admin route and fallback email sender as test-only until authentication and sender verification are added.