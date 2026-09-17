---
name: Support Core local database
description: Local database prerequisites that affect the Support Core regression suite.
---

When running the full Support Core regression suite locally, ensure the database includes the authentication role-audit schema before treating teardown failures as product regressions.

**Why:** The suite cleans up role-audit fixtures even when the feature under test is unrelated, so a database behind the current auth schema can make otherwise passing tests exit non-zero.

**How to apply:** If the suite reports a missing role-audit relation, verify the local schema/migrations before changing application code; endpoint-specific assertions may still be run in isolation.