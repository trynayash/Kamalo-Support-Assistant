# KAMALO AI Support Assistant

A knowledge-grounded AI support assistant and operations portal for KAMALO. Built as a pnpm monorepo featuring a React 19 web frontend, an Express 5 API backend, Drizzle ORM on PostgreSQL with pgvector, and deterministic retrieval against verified knowledge base articles.

---

## Stage 1 Scope & Boundaries

KAMALO AI operates under explicit Stage 1 system boundaries:

- **Allowed:** Explaining approved KAMALO knowledge articles, answering customer questions, maintaining conversation history, capturing user feedback, submitting support tickets, and transcribing voice input.
- **Strictly Blocked:** No live customer account queries, balance checks, transaction lookups, refunds, mandate changes, or financial writes.
- **Safety Guardrails:** Prompt-injection checks and response filters (`src/lib/safety.ts`) stop the assistant from claiming account access, exposing private data or promising balance changes.

### Current limitations

- There is no sign-in yet. Every API route is public, including knowledge editing (`/api/knowledge/...`) and the admin ticket queue (`/api/tickets/admin`). Add authentication and role checks before real customer use.

---

## System Architecture & Data Flow

```text
[ Browser / Client ]
        │  (HTTP / SSE Stream)
        ▼
[ Express API Server (:8081) ]
        │
        ├── 1. Input Sanitization & Injection Guardrails
        ├── 2. Intent Routing & Query Extraction (OpenRouter)
        │
        ▼
[ PostgreSQL / Supabase + pgvector ]
        │  (Deterministic lexical retrieval on status = 'approved')
        ▼
[ Grounded Answer Synthesis (OpenRouter) ]
        │  (Strict system policy: citations grounded in retrieved chunks)
        ▼
[ Streamed SSE Response to Web Client (:5173) ]
```

---

## Repository Structure

```text
KAMALO-AI-Support-Assistant/
├── artifacts/                     # Core deployable packages & applications
│   ├── kamalo-ai/                 # [Production] React 19 + Vite web frontend (Chat, History, Admin KB, Support Tickets)
│   ├── api-server/                # [Production] Express 5 + TypeScript backend (Orchestrator, DB, OpenRouter, Resend)
│   ├── kamalo-mobile/             # [Dev Only] Expo Router companion app (React Native preview)
│   └── mockup-sandbox/            # [Dev Only] UI prototyping & design sandbox preview server
├── lib/                           # Shared monorepo packages
│   ├── api-spec/                  # OpenAPI contract definitions and schema specs
│   ├── api-client-react/          # Generated React Query hooks and client bindings
│   ├── api-zod/                   # Shared Zod validation schemas for request/response payloads
│   └── db/                        # Drizzle ORM schema definitions, relations, and Postgres client
├── scripts/                       # Developer tooling, lifecycle, and automation scripts
│   ├── dev.mjs                    # Concurrent dev launcher for API (:8081) and Vite (:5173)
│   ├── setup-local.mjs            # Automated installer, Drizzle schema push, and API build
│   ├── stop-dev.mjs               # Cross-platform utility to kill dangling dev processes
│   ├── prepare-supabase-sql.mjs   # Formatter to convert DB dump to Supabase SQL editor scripts
│   ├── verify-database.mjs        # Database connectivity and row-count verification script
│   └── test-intent.mjs            # Evaluation runner for intent classification dataset
├── supabase/                      # Prepared SQL migrations and data seeds for Supabase
├── docs/                          # In-depth architectural and integration guides
│   ├── architecture.md            # Detailed module boundaries and future Stage 2-4 tool seams
│   └── supabase.md                # Complete Supabase setup and migration walkthrough
├── docker-compose.yml             # Local PostgreSQL 16 container with pgvector
├── render.yaml                    # Production deployment blueprint for Render (Single-service web app)
└── threat_model.md                # Security model, scan anchors, and trust boundaries
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or higher (LTS recommended)
- **pnpm**: v10.28+ (install globally via npm to avoid Windows/Render Corepack signature issues)
- **Docker Desktop**: Running locally (for PostgreSQL + pgvector)

```bash
# Install pnpm directly and disable Corepack
npm install -g pnpm@10.28.2
corepack disable
```

### 2. Environment Configuration
Copy the template environment file:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: Defaults to local Docker Postgres (`postgresql://kamalo:kamalo@127.0.0.1:5432/kamalo`).
- `OPENROUTER_API_KEY`: Required for LLM answer generation and routing.
- `GROQ_API_KEY`: Required for voice audio transcription via Whisper.
- `RESEND_API_KEY`: Required for support ticket and feedback email alerts.

### 3. Start Database & App
```bash
# 1. Start local PostgreSQL with pgvector
pnpm run dev:db

# 2. Install dependencies, apply database schema, and compile API
pnpm run setup:local

# 3. Start both the API server (:8081) and Vite frontend (:5173)
pnpm run dev
```

Open **http://localhost:5173**. The Vite dev server automatically proxies `/api` requests to the Express backend on `:8081`.

---

## Database Setup

### Option A: Local Docker (Default)
Local development runs via `docker-compose.yml` using `pgvector/pgvector:pg16`:
- **Start DB:** `pnpm run dev:db`
- **Push Schema Changes:** `pnpm run db:push`
- **Verify Connection:** `pnpm run db:verify`

### Option B: Supabase
To connect to a managed Supabase database:
1. Enable the `vector` extension in Supabase (**Database -> Extensions -> vector**).
2. Generate the prepared SQL batches:
   ```bash
   pnpm run supabase:prepare-sql
   ```
3. Run `supabase/01-schema.sql` followed by `supabase/02-data-*.sql` files in the Supabase SQL Editor.
4. Set `DATABASE_URL` in `.env` to your Supabase **Session pooler** URI (port `5432`).
5. Verify connection:
   ```bash
   pnpm run db:verify
   ```
Full details are in [docs/supabase.md](docs/supabase.md).

---

## Environment Variables Reference

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :---: |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://kamalo:kamalo@127.0.0.1:5432/kamalo` | Yes |
| `API_PORT` | Express backend port | `8081` | Yes |
| `WEB_PORT` | Vite frontend dev port | `5173` | Yes |
| `API_PROXY_TARGET` | Proxy target for Vite dev server | `http://127.0.0.1:8081` | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API authentication token | `sk-or-v1-...` | Yes (for AI) |
| `OPENROUTER_ANSWER_MODEL` | Model ID for knowledge synthesis | `openrouter/free` | No |
| `OPENROUTER_ROUTING_MODEL`| Model ID for intent understanding | `openrouter/free` | No |
| `GROQ_API_KEY` | Groq API token for Whisper voice transcription | `gsk_...` | Optional |
| `RESEND_API_KEY` | Resend API key for support ticket delivery | `re_...` | Optional |
| `RESEND_FROM_EMAIL` | Verified sender email address | `support@example.com` | Optional |
| `KAMALO_FEEDBACK_EMAIL` | Recipient address for feedback alerts | `ops@example.com` | Optional |
| `STATIC_DIR` | Static assets directory for single-service deploy | `artifacts/kamalo-ai/dist/public` | Production |

---

## Monorepo Scripts

Run these commands from the repository root:

| Command | Action |
| :--- | :--- |
| `pnpm run dev` | Concurrently launches backend (`:8081`) and frontend (`:5173`) |
| `pnpm run dev:stop` | Terminates background dev processes on active ports |
| `pnpm run dev:db` | Starts local PostgreSQL container with pgvector |
| `pnpm run setup:local` | Runs `pnpm install`, pushes Drizzle schema, and builds API |
| `pnpm run db:push` | Pushes Drizzle schema directly to the configured database |
| `pnpm run db:verify` | Verifies database connectivity and displays record counts |
| `pnpm run test:intent` | Executes intent classifier test suite against evaluation dataset |
| `pnpm run typecheck` | Type-checks shared libraries, artifacts, and script files |
| `pnpm run build` | Builds all workspace packages |
| `pnpm run build:production` | Compiles API bundle and Vite SPA production distribution |
| `pnpm run start:production` | Boots compiled Express server in production mode |

---

## Production Deployment (Render)

The repo includes a `render.yaml` blueprint configuring a single web service that hosts both the Express API and the built React SPA:

1. Connect the repository to Render as a **Blueprint**.
2. Supply environment secrets: `DATABASE_URL`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `KAMALO_FEEDBACK_EMAIL`.
3. **Important for Supabase:** Always provide the **Session pooler** URI (`pooler.supabase.com`, port 5432). Do not use direct connection hostnames (`db.*.supabase.co`) because Render cannot route to Supabase over IPv6.
4. Health check endpoint: `/api/healthz`.

---

## Troubleshooting & Common Pitfalls

- **"Message not sent" / Port Conflict:** Port `8080` is often reserved by Apache/XAMPP or Docker. The repo defaults to `API_PORT=8081` and `API_PROXY_TARGET=http://127.0.0.1:8081`. If you encounter connection errors, ensure both values match.
- **Port already in use:** Run `pnpm run dev:stop` to kill lingering Node processes.
- **Render deployment hangs or network unreachable:** Ensure your database connection string uses the Supabase Session pooler (`aws-0-[region].pooler.supabase.com:5432`) rather than the direct database hostname.
- **pnpm EROFS or signature errors:** Avoid `corepack enable`. Install pnpm globally using `npm install -g pnpm@10.28.2` and run `corepack disable`.