---
name: Deployment health probes
description: API artifact publication may probe the service root even when an artifact health path is configured.
---

Keep API services responsive with a cheap 200 response at `/` as well as their explicit health route.

**Why:** A prior KAMALO publication failed because the production probe hit `/` and received 404, despite the API exposing `/api/healthz`.

**How to apply:** When adding or changing an API artifact's deployment configuration, verify both the configured health path and the service root before publishing.