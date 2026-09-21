---
name: KAMALO AI scope routing
description: The customer-visible distinction between unrelated input and Kamalo-adjacent unknown support topics.
---

Unrelated customer input must not receive the confirmed-information fallback or a ticket escalation prompt. Server-side deterministic relevance matching should route it to the concise email response, while unknown topics that are recognizably about KAMALO products or support journeys should retain the confirmed-information response and ticket escalation.

**Why:** A generic unknown fallback makes random text look like a support issue and invites misleading ticket creation. The relevance decision must not be delegated to the language model.

**How to apply:** Keep the relevance vocabulary focused on KAMALO concepts such as offers, deals, gift cards, rewards, Coins, payments, transactions, cards, merchants, and related journeys. Preserve the separate out-of-scope response outcome so the web client can suppress escalation UI.