---
name: KAMALO AI multilingual safety
description: Constraints for translating grounded KAMALO answers into Indian languages without inventing quantitative claims.
---

Multilingual provider output must preserve approved numeric values exactly; if a translated answer introduces a new number, prefer a same-language safe fallback over emitting the claim. Indic danda punctuation (`।`) is a valid completed-sentence boundary for response cleanup.

**Why:** Free multilingual providers can produce fluent translations that silently change a conversion or add unsupported quantities, and generic sentence-completion logic can incorrectly discard valid Hindi/Marathi fallbacks.

**How to apply:** Keep response-language instructions explicit, validate quantitative claims against grounded evidence, and include `।` in completion/sentence-boundary handling whenever output is localized into Hindi or Marathi.