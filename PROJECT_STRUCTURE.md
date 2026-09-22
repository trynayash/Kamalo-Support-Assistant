# KAMALO AI project structure

This repository is a pnpm monorepo containing the KAMALO web workspace, its
Express support API, an Expo Go companion app, and a small design-preview
service. The web app is the published product; the mobile app is development
only for now.

## Product artifacts

```text
artifacts/
├── kamalo-ai/          # Published React + Vite web app
│   ├── src/            # Pages, components, hooks, and web styling
│   └── dist/public/    # Generated web output; rebuilt for publishing
├── api-server/         # Express + TypeScript support backend
│   ├── src/            # Routes, Support Core, retrieval, providers, and DB access
│   └── dist/           # Generated API bundle; rebuilt for publishing
├── kamalo-mobile/      # Expo Router mobile companion
│   ├── app/            # File-based native routes and screens
│   ├── components/     # Native UI components
│   ├── lib/            # Mobile-only streaming and helpers
│   └── assets/         # Mobile icon and image assets
└── mockup-sandbox/     # Design/mockup preview server; not part of production
```

### Runtime routing

- `/` serves `artifacts/kamalo-ai/dist/public`.
- `/api` is served by `artifacts/api-server` on the API workflow.
- `/kamalo-mobile/` is reserved for the Expo development preview.
- The mobile artifact has a development service only. It is not included in
  the production deployment.

## Shared workspace packages

```text
lib/
├── api-spec/           # OpenAPI contract and generated schema inputs
├── api-client-react/   # Generated React Query client used by web and mobile
├── api-zod/            # Shared request/response validation types
├── db/                 # Shared Drizzle database schema and utilities
└── integrations/       # Connector-specific shared integration code
```

The API contract is the source of truth for generated clients. When an API
shape changes, update `lib/api-spec` and regenerate the shared client before
using the new endpoint in either frontend.

## Assets, tooling, and configuration

```text
attached_assets/       # Approved uploaded/source assets shared by artifacts
scripts/                # Workspace build, validation, and maintenance scripts
vendor-handoff/         # Portable vendor handoff documentation and assets
.local/                 # Optional local tooling (not required for deploy)
```

Important root files:

- `pnpm-workspace.yaml` defines workspace packages, catalogs, and package-age
  protections.
- `package.json` and `pnpm-lock.yaml` define the workspace toolchain.
- `render.yaml` defines the Render production blueprint.
- `docker-compose.yml` runs local PostgreSQL with pgvector.

## Development commands

From the repo root:

```bash
pnpm run dev:db      # local PostgreSQL (Docker)
pnpm run setup:local
pnpm run dev         # API + web UI
```

Useful package checks:

```bash
pnpm --filter @workspace/kamalo-ai run typecheck
pnpm --filter @workspace/kamalo-ai run build
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/kamalo-mobile run typecheck
```

The mobile workflow uses Expo Go over the managed development/LAN preview.
Do not treat the Expo artifact as a production web service until a separate
mobile release decision is made.