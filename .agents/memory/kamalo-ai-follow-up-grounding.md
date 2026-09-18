---
name: KAMALO AI follow-up grounding
description: Retrieval and fallback constraints for concise, context-aware KAMALO support follow-ups.
---

For a follow-up, retrieve the current question independently before using conversation context. Merge context to resolve references, but do not let older wording bury the new intent.

**Why:** A contextual search for “How about expiry?” ranked general Coin articles and personalized FIFO scenarios inconsistently; one result omitted the approved 3-month FIFO rule and another exposed an `X Coins` placeholder.

**How to apply:** For non-personal questions, exclude articles or sentences containing account-specific placeholders, balances, scheduled expiries, or “your” values. Prefer a concrete approved rule when several grounded sentences match, while preserving live-data limits for personal questions.