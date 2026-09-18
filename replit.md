# KAMALO AI

KAMALO AI is a knowledge-grounded support assistant for explaining KAMALO products and journeys without pretending to access live customer data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/kamalo-ai/src/pages/home.tsx` — customer chat and streamed response UI
- `artifacts/kamalo-ai/src/pages/knowledge.tsx` — knowledge admin screen
- `artifacts/api-server/src/routes/` — conversation, feedback, and knowledge API routes
- `artifacts/api-server/src/lib/knowledge.ts` — approved seed content and retrieval
- `artifacts/api-server/src/lib/llm.ts` — `LLMProvider` and OpenRouter implementation
- `lib/db/src/schema/` — PostgreSQL/Drizzle source of truth
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `docs/architecture.md` — Stage 1 boundaries and future seams

## Architecture decisions

- Stage 1 uses a server-only `LLMProvider`; OpenRouter details never enter the chat UI.
- Approved knowledge is the only normal retrieval source; unknown questions receive a verified fallback.
- Account context and support tools exist as disabled interfaces so live KAMALO engines can be added later.
- Knowledge chunks have a pgvector-ready embedding column, while current retrieval stays deterministic until an embeddings provider is selected.
- OIDC sessions and server-side ownership/role checks protect customer and operational surfaces; engine work must still treat every browser value and customer-authored field as untrusted.

## Product

- Ask natural KAMALO questions and receive concise streamed explanations.
- Restore, clear, and delete conversation history.
- Copy answers, retry generation, and submit helpful/not-helpful feedback.
- Search, create, edit, approve, and archive approved knowledge articles.

## User preferences

- Keep the web and Expo apps feature-aligned. Any user-facing web change must have a corresponding Expo implementation, adapted for native navigation, touch interaction, and mobile layout.

## Gotchas

- When changing a web flow, check the matching Expo screen and shared API/client behavior before considering the work complete.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
