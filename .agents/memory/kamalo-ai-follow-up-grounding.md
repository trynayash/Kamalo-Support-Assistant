---
name: KAMALO AI follow-up grounding
description: Retrieval and fallback constraints for concise, context-aware KAMALO support follow-ups.
---

For a follow-up, retrieve the history-expanded question before the short reference, then merge and deduplicate the short-query results. Keep the current intent visible in the final prompt.

**Why:** A short reference such as “What happened to that?” can match unrelated generic articles and bury the payment article when its history-expanded query is appended later.

**How to apply:** Run the history-expanded retrieval first, merge the short query only as supporting evidence, and for non-personal questions exclude articles or sentences containing account-specific placeholders, balances, scheduled expiries, or “your” values. Prefer a concrete approved rule when several grounded sentences match, while preserving live-data limits for personal questions.

Provider history should include only the immediately previous turn for generation; broader history can still support retrieval. Final output must drop unfinished trailing text and reject visible reasoning or drafting markers before persistence.

**Why:** A 10-turn adversarial run showed older Coin-balance context contaminating a failed-payment answer, and the provider occasionally returned “thinking process” text or an unfinished customer reply.

**How to apply:** Keep retrieval context and generation context separate. Treat reasoning labels, draft markers, missing terminal punctuation, and internal engine names as unsafe presentation output.