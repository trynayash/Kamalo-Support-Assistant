---
name: Support Core test fixtures
description: How to keep knowledge-grounding regression fixtures deterministic in a shared database.
---

Support Core retrieval fixtures must use collision-resistant query tokens instead of generic support terminology.

**Why:** Retrieval is deterministic lexical matching over all approved articles, so ordinary words can accidentally match existing knowledge and make evidence or fallback assertions unstable.

**How to apply:** Give each synthetic article and query a unique opaque token, keep the fixture rows synthetic, and remove them during test cleanup.

Representative knowledge evaluations should assert stable article topics by title, while keeping the question wording close to real customer language.

**Why:** Article IDs change when seed knowledge is recreated, but topic-title matches make regressions readable and preserve coverage across re-seeding.

**How to apply:** Keep evaluation cases in a maintained catalog, include aliases and follow-up wording, and report the topic, query, expected title, and retrieved titles when a case fails.