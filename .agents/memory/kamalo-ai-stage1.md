---
name: KAMALO AI Stage 1 boundaries
description: Product and provider constraints that should remain true when extending KAMALO AI.
---

KAMALO AI Stage 1 must remain knowledge-grounded and must not claim live account access or perform financial/support actions. The provider boundary is `LLMProvider`, and approved article status is the authority gate for retrieval.

**Why:** The product brief explicitly separates the explanatory Stage 1 assistant from later read/write KAMALO engines. Preserving that boundary prevents fabricated balances, refunds, commissions, or account actions.

**How to apply:** Any future account, transaction, Coin, commission, FINCADO, notification, or ticket capability must arrive through controlled server-side tools with verified responses, not direct model access.