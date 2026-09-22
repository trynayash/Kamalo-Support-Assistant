---
name: KAMALO AI retrieval boundaries
description: Relevance and customer-safety rules for selecting and presenting approved KAMALO knowledge.
---

Approved retrieval must prioritize the strongest article for the requested topic, penalize conflicting product topics in article titles, and send supporting articles only for clearly compound questions. Multilingual and typo aliases must expand into the same topic terms without weakening topic conflicts. Personal balances, targets, progress, and delivery status must resolve to a live-data limitation rather than a provider-generated answer.

**Why:** Lexical overlap can rank a Gold delivery article for a Silver question or an expiry/article with a customer amount for a general Coins request. Imported support articles can also contain internal guardrails, engine instructions, and CTAs that are not customer answers. Unsupported Indic-script requests need the same confirmed-information fallback as unsupported English requests.

**How to apply:** Keep retrieval ranking topic-aware, filter personalized and boundary-only articles before provider context, sanitize internal lines before provider context and grounding validation, map approved Hindi/Marathi phrases and common typos to English topic terms, and preserve deterministic approved facts for overview and live-data limits.