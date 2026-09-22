---
name: KAMALO AI retrieval boundaries
description: Relevance and customer-safety rules for selecting and presenting approved KAMALO knowledge.
---

Approved retrieval must prioritize the strongest article for the requested topic, penalize conflicting product topics in article titles, and send supporting articles only for clearly compound questions. Personal balances, targets, progress, and delivery status must resolve to a live-data limitation rather than a provider-generated answer.

**Why:** Lexical overlap can rank a Gold delivery article for a Silver question or an expiry article for a personal balance request. Imported support articles can also contain internal guardrails, engine instructions, and CTAs that are not customer answers.

**How to apply:** Keep retrieval ranking topic-aware, filter boundary-only articles when they do not answer the request, sanitize internal lines before provider context and grounding validation, and preserve deterministic approved facts for overview and live-data limits.