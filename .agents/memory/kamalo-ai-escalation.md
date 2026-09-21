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

Assistant streams may classify the final response as `unknown` only when orchestration explicitly chooses the fallback decision. Provider outages and safety/grounding fallbacks must remain separate so customers are not sent to support for a transient failure.

**Why:** A ticket CTA is a controlled handoff for missing approved knowledge, not a substitute for retrying a broken provider or hiding a safety fallback.

**How to apply:** Preserve the response outcome through the SSE done event and keep web/mobile escalation buttons gated on the unknown classification.

Retrieved knowledge can contain internal guardrail wording used to guide the provider; it is reference data, not customer-facing copy. Provider output that repeats guardrails or tool-instruction language must be rejected or replaced before persistence and streaming.

**Why:** A response can be factually cautious but still damage trust by exposing implementation language such as “verified server-side tool” or “Stage 1 guardrail.”

**How to apply:** Keep internal-guidance detection in the shared assistant-output safety gate and add regression coverage for representative leaked phrases.