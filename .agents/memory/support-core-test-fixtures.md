---
name: Support Core test fixtures
description: How to keep knowledge-grounding regression fixtures deterministic in a shared database.
---

Support Core retrieval fixtures must use collision-resistant query tokens instead of generic support terminology.

**Why:** Retrieval is deterministic lexical matching over all approved articles, so ordinary words can accidentally match existing knowledge and make evidence or fallback assertions unstable.

**How to apply:** Give each synthetic article and query a unique opaque token, keep the fixture rows synthetic, and remove them during test cleanup.