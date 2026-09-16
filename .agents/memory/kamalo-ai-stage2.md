---
name: KAMALO AI Stage 2 architecture
description: The server-side extension boundary for future KAMALO engines and providers.
---

Support Core owns trusted request context, approved-knowledge evidence, tool policy, provider adapters, normalized results, and operational events; React and prompts must never call engines directly.

**Why:** Future account and financial integrations need verified identity, permissions, auditability, and safe failure behavior before they can influence support answers.

**How to apply:** Add new live capabilities as namespaced read/action tools and provider implementations behind the gateway. Keep demo tools explicitly synthetic, keep action tools empty until contracts are approved, and preserve the current chat response contract.