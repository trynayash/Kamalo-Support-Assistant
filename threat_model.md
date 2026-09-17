# Threat Model

## Project Overview

KAMALO AI is a React and Vite support chat backed by an Express API, PostgreSQL with Drizzle, deterministic approved-knowledge retrieval, and a server-only OpenRouter provider. Authenticated customers can ask about KAMALO products and journeys, attach JPG/PNG images for storage, submit feedback, and raise support tickets. Support and admin users have separate operational surfaces.

The current engine is Stage 1. It explains approved KAMALO guidance and must not claim live account access or perform account, transaction, wallet, reward, refund, or settings actions.

## Assets

- **Approved KAMALO knowledge** — product guidance is the factual authority for answers. Poisoned or stale articles can cause unsafe or misleading support responses.
- **Conversation content and attachments** — customer questions, assistant responses, support details, images, and ticket data may contain private information.
- **Sessions and identity data** — session cookies, OIDC tokens, user records, and roles control access to customer and operational data.
- **Provider credentials and request data** — the OpenRouter credential must remain server-only; outbound prompts must not include unnecessary identifiers, secrets, or private values.
- **Support operations** — tickets, feedback, knowledge approval, role changes, and email notifications can affect customer handling and require controlled access and auditability.
- **Logs and diagnostics** — request IDs and operational outcomes support debugging but must not become a copy of customer content or provider secrets.

## Trust Boundaries

- **Browser to API** — the browser is untrusted. Input, IDs, files, cookies, and retry behavior must be validated server-side.
- **API to PostgreSQL** — queries use Drizzle and must keep ownership, approval status, and role checks in the server boundary.
- **API to local attachment storage** — uploaded bytes and database metadata cross into filesystem storage. Keys must be generated and path-constrained.
- **API to OpenRouter** — customer and knowledge data leave the application boundary. Only minimized, sanitized, labeled context may cross it; the API key never enters prompts or responses.
- **Customer content to engine policy** — user messages, history, ticket details, and knowledge article text are data, not instructions. They must not override the system policy.
- **Customer to support/admin** — support and admin actions require server-side role checks and should be auditable.

## Scan Anchors

- Production entry points: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/`, `artifacts/kamalo-ai/src/`.
- Highest-risk engine areas: `src/lib/safety.ts`, `src/lib/orchestrator.ts`, `src/lib/knowledge.ts`, `src/lib/llm.ts`, `src/lib/image-attachments.ts`, ticket analysis.
- Public/authenticated/admin surfaces: health/auth routes are public; conversation, feedback, and customer ticket routes are authenticated; knowledge, admin tickets, role management, and ticket analysis are role-gated.
- Dev-only or synthetic areas: disabled demo engine tools and local test fixtures should not be treated as live integrations.

## Threat Categories

### Spoofing

Session and OIDC validation must remain server-side. Customer data queries must use the authenticated user identity, and provider requests must not trust browser-supplied user, role, tenant, or permission values.

### Tampering

All JSON, query, path, ticket, knowledge, and attachment inputs must be schema-validated. Approved knowledge is the only normal retrieval source. Knowledge content that contains instruction-shaped override or exfiltration requests must be excluded from runtime evidence.

### Repudiation

Sensitive support and role operations should include an acting identity, request ID, timestamp, and outcome in structured logs or audit records without logging raw customer prompts, ticket bodies, secrets, or provider payloads.

### Information Disclosure

The API must never expose system prompts, hidden reasoning, credentials, session secrets, database details, internal source code, raw provider errors, or another user's data. Outbound model context must omit internal IDs and redact API keys, JWTs, passwords, OTP values, connection strings, and similar secrets. Streamed output must be safe before each chunk reaches the browser, including when a secret is split across provider chunks.

### Denial of Service

Request bodies, uploaded images, conversation history, model output, provider timeouts, retries, and message rates must be bounded. Uploads must be validated by extension, declared MIME type, and file signature. External provider calls must have cancellation and bounded retries.

### Elevation of Privilege

Conversation, attachment, feedback, and ticket ownership must be enforced by the API. Knowledge editing, ticket queues, AI analysis, email retries, role management, and other operational actions must be server-side role-gated. Stage 1 tools must not expose action capabilities or live engine data.

### Injection

SQL must remain parameterized through Drizzle. User messages, conversation history, ticket details, and approved article contents must be delimited as untrusted/reference data and must never override the system policy. Assistant output must be sanitized for secrets, unsafe implementation disclosure, active markup, and incomplete provider streams.