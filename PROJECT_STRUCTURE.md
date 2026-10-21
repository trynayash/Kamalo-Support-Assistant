# KAMALO AI Project Structure

This repository is a pnpm monorepo consisting of a React 19 web frontend, an Express 5 backend API, shared TypeScript libraries, and database management tooling.

---

## Workspace Layout

```text
KAMALO-AI-Support-Assistant/
├── artifacts/                     # Deployable packages and frontend/backend services
│   ├── kamalo-ai/                 # Production web application (React 19 + Vite)
│   ├── api-server/                # Production backend service (Express 5 + TypeScript)
│   ├── kamalo-mobile/             # Development companion app (Expo Router / React Native)
│   └── mockup-sandbox/            # Local UI component and layout preview sandbox
├── lib/                           # Shared internal workspace libraries
│   ├── api-spec/                  # OpenAPI 3.0 specifications and API contracts
│   ├── api-client-react/          # Generated TanStack React Query client library
│   ├── api-zod/                   # Shared Zod validation schemas
│   └── db/                        # Drizzle ORM schema, relations, and database client
├── scripts/                       # Build orchestration, database seeding, and testing scripts
├── supabase/                      # Supabase schema and batch SQL migration files
├── docs/                          # Architectural documentation and setup guides
└── threat_model.md                # System threat model and security boundaries
```

---

## Package Details

### 1. Applications (`artifacts/`)

- **`artifacts/kamalo-ai`** (Production Web Frontend)
  - `src/pages/home.tsx`: Customer chat assistant with streaming SSE, image attachments, voice transcription, and feedback.
  - `src/pages/history.tsx`: Saved conversation session viewer.
  - `src/pages/knowledge.tsx`: Knowledge base management portal (article review, editing, approval lifecycle).
  - `src/pages/support.tsx` & `src/pages/support-ticket-detail.tsx`: Customer ticket submission and status tracking.
  - `src/pages/admin-tickets.tsx`: Internal support operations queue and ticket resolution.
  - `dist/public/`: Production static build output served directly by the Express API in production.

- **`artifacts/api-server`** (Production Backend)
  - `src/app.ts` & `src/index.ts`: Express application bootstrap and middleware configuration.
  - `src/routes/conversations.ts`: Conversation persistence and SSE streaming completions.
  - `src/routes/knowledge.ts`: Knowledge article CRUD, approval workflow, and retrieval endpoints.
  - `src/routes/tickets.ts`: Support ticket creation, file attachment handling, and Resend email alerts.
  - `src/routes/transcribe.ts`: Audio file transcription using Groq Whisper.
  - `src/lib/safety.ts` & `src/lib/orchestrator.ts`: Stage 1 guardrails, injection prevention, and query routing.
  - `src/lib/llm.ts`: OpenRouter provider integration.

- **`artifacts/kamalo-mobile`** (Development Preview)
  - React Native / Expo companion app for mobile testing. Excluded from production builds.

- **`artifacts/mockup-sandbox`** (Design Preview)
  - Isolated preview sandbox for UI design and mockup validation.

---

## Shared Monorepo Libraries (`lib/`)

- **`lib/api-spec`**: Central OpenAPI contract. All API surface changes originate here before regenerating clients.
- **`lib/api-client-react`**: React Query hooks generated from `lib/api-spec`.
- **`lib/api-zod`**: Strongly-typed Zod schemas shared between frontend form validations and backend route handlers.
- **`lib/db`**: Database layer using Drizzle ORM. Defines tables for `conversations`, `messages`, `message_attachments`, `message_feedback`, `knowledge_articles`, `knowledge_chunks` (with pgvector support), and `support_tickets`.

---

## Runtime Routing & Port Allocation

- **Port `5173` (Vite Dev Server)**: Serves `kamalo-ai` in development. Proxies `/api` requests to port `8081`.
- **Port `8081` (Express API Server)**: Hosts backend routes under `/api` and health check at `/api/healthz`. (Defaulted to `8081` to avoid common `8080` conflicts with Apache/XAMPP).
- **Single-Service Production (Render)**: Express serves `/api` routes and statically hosts `artifacts/kamalo-ai/dist/public` at `/`.