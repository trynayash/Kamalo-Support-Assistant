---
name: KAMALO AI account access
description: Authentication and support-role boundaries for customer data and admin tools.
---

KAMALO web access uses Replit OIDC with PKCE and PostgreSQL cookie sessions. Customer records are filtered by the authenticated user id; support and admin capabilities are enforced on the API, not only hidden in the UI.

**Why:** The support product must not expose conversation, attachment, feedback, or ticket data through shared demo identities or direct-ID requests.

**How to apply:** Keep `context.ts` as the identity seam, load the current role from the users table on requests, use generic sign-in/access-denied states in the web app, and use configured allowlists only to bootstrap new accounts; explicit database role changes are authoritative for existing accounts.