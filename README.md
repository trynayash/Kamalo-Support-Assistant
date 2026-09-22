# KAMALO AI

KAMALO AI is a Stage 1, knowledge-grounded support assistant for explaining KAMALO concepts in a clear and trustworthy way.

## What is included

- Premium responsive chat UI at `/`
- Conversation history with PostgreSQL persistence
- Streaming answers from an OpenRouter provider abstraction
- Approved KAMALO knowledge articles with version and status
- Knowledge management at `/admin/knowledge`
- Helpful / not helpful feedback
- Controlled prompt-injection and fake-account-claim protections
- Future-ready account context and tool registry interfaces
- A 100+ case evaluation dataset in `scripts/src/evaluation-dataset.ts`

Stage 1 deliberately does not include live customer account lookup, transaction lookup, Coin changes, refunds, mandates, ticketing, or financial writes.

## Run locally (Windows, macOS, Linux)

Requirements: Node.js 20+ (LTS recommended; Node 25 works), pnpm 10.28+, Docker Desktop running (for local PostgreSQL with pgvector).

Install pnpm **without Corepack** (avoids signature errors on Windows and read-only errors on Render):

```bash
npm install -g pnpm@10.28.2
# If `pnpm` still invokes Corepack, run once:
corepack disable
```

```bash
cp .env.example .env
# Fill in OPENROUTER_API_KEY, GROQ_API_KEY (free voice transcription), and email settings in .env

pnpm run dev:db          # starts PostgreSQL with pgvector
pnpm run setup:local     # install deps, push schema, build API
pnpm run dev             # API on :8081, web UI on :5173 (see API_PORT in .env)
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the API port in `API_PROXY_TARGET`.

If chat shows **"Message not sent"**, check that nothing else is using the API port (Apache/XAMPP often uses 8080). Set `API_PORT=8081` and `API_PROXY_TARGET=http://127.0.0.1:8081` in `.env`, then restart `pnpm run dev`.

To run services separately:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/kamalo-ai run dev
```

Set `PORT`, `BASE_PATH`, and `DATABASE_URL` in the target environment.

## Supabase

To load the bundled development knowledge and conversation data:

```bash
pnpm run supabase:prepare-sql
```

Then run `supabase/01-schema.sql` and the `supabase/02-data-*.sql` files in the Supabase SQL editor (not the old single-file dump — Supabase does not support `COPY` blocks). Set `DATABASE_URL` to your Supabase Session pooler URI, then run `pnpm run db:verify`.

Full steps: [docs/supabase.md](docs/supabase.md)

## Deploy on Render

This repo includes a `render.yaml` blueprint for a single web service that serves both the API and the built web UI.

1. Push the repo to GitHub.
2. In Render, create a **Blueprint** from `render.yaml`.
3. Set the secret env vars when prompted: `DATABASE_URL`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `KAMALO_FEEDBACK_EMAIL`.
4. For Supabase, use the **Session pooler** URI (`pooler.supabase.com`, port 5432) — not the direct `db.*.supabase.co` host. Render cannot reach Supabase over IPv6; the pooler URI avoids that failure.
5. After deploy, open the Render URL. Health checks use `/api/healthz`.

The production service sets `STATIC_DIR=artifacts/kamalo-ai/dist/public` so Express serves the SPA and API from one origin.

On Render PostgreSQL, enable the `vector` extension once after the database is created:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Environment

Required for generated responses:

- `OPENROUTER_API_KEY` — server-side OpenRouter API key
- `DATABASE_URL` — PostgreSQL connection string
- `RESEND_API_KEY` — server-side Resend API key for ticket and feedback email
- `RESEND_FROM_EMAIL` — verified sender address
- `KAMALO_FEEDBACK_EMAIL` — recipient for answer-review notifications

The API never sends provider keys to the browser. Responses currently use OpenRouter's `openrouter/free` router, which selects from the free models available at request time.

## Architecture

```text
KAMALO chat
  -> Support API
  -> OpenRouter routing model (understand intent + retrieval query)
  -> Approved knowledge retrieval
  -> OpenRouter answer model (grounded synthesis)
  -> Streamed response
```

Knowledge articles are versioned and filtered to `approved` before retrieval. Knowledge chunks include a pgvector-ready embedding column so an embedding provider can be added later without changing the chat contract. Stage 1 uses deterministic lexical retrieval because the configured OpenRouter chat integration does not provide embeddings.

See `docs/architecture.md` for the Stage 1 boundaries and future tool-gateway seam.