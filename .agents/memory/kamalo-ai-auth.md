---
name: KAMALO AI demo access
description: The current KAMALO demo intentionally runs without authentication.
---

KAMALO web access is intentionally unauthenticated. The API uses the fixed `demo-user` identity and grants direct access to the customer, support, and knowledge-management demo screens.

**Why:** The requested product behavior is the earlier demo-access experience, with no sign-in screen, OIDC session handling, role guards, or auth API surface.

**How to apply:** Preserve the fixed demo identity and direct routes when changing the app. Do not reintroduce OIDC/session middleware, auth UI, role-management endpoints, or user ownership checks unless the user explicitly requests a new authenticated product mode.