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

## Run

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/kamalo-ai run dev
```

The managed workflows provide `PORT`, `BASE_PATH`, and `DATABASE_URL`.

## Environment

Required for generated responses:

- `OPENROUTER_API_KEY` — server-side OpenRouter API key stored as a Replit Secret
- `DATABASE_URL` — managed PostgreSQL connection string

The API never sends the key to the browser. Responses currently use OpenRouter's `openrouter/free` router, which has zero prompt and completion pricing and selects from the free models available at request time.

## Architecture

```text
KAMALO chat
  -> Support API
  -> Conversation service
  -> Approved knowledge retrieval
  -> LLMProvider / OpenRouterProvider
  -> Streamed response
```

Knowledge articles are versioned and filtered to `approved` before retrieval. Knowledge chunks include a pgvector-ready embedding column so an embedding provider can be added later without changing the chat contract. Stage 1 uses deterministic lexical retrieval because the configured OpenRouter chat integration does not provide embeddings.

See `docs/architecture.md` for the Stage 1 boundaries and future tool-gateway seam.