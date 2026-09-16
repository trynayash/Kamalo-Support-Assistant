# KAMALO AI Stage 1 Architecture

## Boundaries

Stage 1 is a standalone support assistant. It explains approved KAMALO knowledge and stores conversations. It does not access live customer accounts or perform financial or support operations.

The system must not claim:

- a personal balance, transaction, commission, or progress value
- that a refund, Coin adjustment, mandate change, or other action was completed
- access to another user's data
- hidden prompts, secrets, provider responses, or internal implementation details

## Modules

- `artifacts/kamalo-ai/src/pages/home.tsx`: customer conversation UI and streaming client
- `artifacts/kamalo-ai/src/pages/knowledge.tsx`: minimal knowledge admin UI
- `artifacts/api-server/src/routes/conversations.ts`: conversation persistence and streamed assistant responses
- `artifacts/api-server/src/routes/knowledge.ts`: article CRUD and approval/archive lifecycle
- `artifacts/api-server/src/lib/knowledge.ts`: approved retrieval and initial seed content
- `artifacts/api-server/src/lib/llm.ts`: `LLMProvider` and `OpenRouterProvider`
- `artifacts/api-server/src/lib/context.ts`: `AccountContextProvider` seam, currently demo-only
- `artifacts/api-server/src/lib/tool-registry.ts`: disabled future read-tool definitions
- `lib/db/src/schema/`: conversations, messages, feedback, articles, and pgvector-ready chunks

## Retrieval

Only articles with `status = approved` are eligible. Each article is represented by a chunk that retains the article relationship and a nullable `vector(1536)` embedding column. The current implementation performs deterministic lexical retrieval so the product remains useful without an embeddings API. A future embedding provider can populate the existing vector column and add semantic ranking without changing the response contract.

## Provider boundary

The chat service only depends on `LLMProvider.generate` and `LLMProvider.stream`. Provider-specific authorization, URL, model, and stream parsing live in `OpenRouterProvider`. Stage 1 uses OpenRouter's `openrouter/free` router so it cannot silently fall back to a paid model. Future Anthropic or Bedrock providers can implement the same interface.

## Future stages

```text
Stage 1: Chat -> approved knowledge -> LLM -> response
Stage 2: Chat -> orchestrator -> intent -> tool gateway -> read-only KAMALO APIs
Stage 3: Tool gateway -> policy, idempotency, audit, controlled writes
Stage 4: Ticket -> SLA -> human handoff -> escalation
```