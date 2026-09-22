---
name: Knowledge corpus deactivation
description: How to remove disallowed internal material from the approved customer-answer boundary.
---

When a knowledge source is no longer allowed for customer answers, deactivate its persisted rows and remove its startup import path; do not rely only on retrieval-time filtering.

**Why:** Knowledge setup is additive and persisted rows survive code changes, so a filtered legacy corpus can still reappear through another retrieval path or administrative flow.

**How to apply:** Archive the disallowed source without deleting history, prevent future imports, and keep a regression test that proves both ranking exclusion and the customer-facing response boundary.