# KAMALO vendor handoff

This directory contains the portable application source, the PostgreSQL database
export, and the restore/deployment instructions for moving KAMALO to a
vendor-controlled environment.

## Files

- `kamalo-portable-source.tar.gz` — source archive with no `.git`, package
  cache, build output, workspace tooling, Replit metadata, or unapproved
  conversation attachments.
- `kamalo-database.dump` — PostgreSQL custom-format dump of the complete
  current database. It includes schema, indexes, rows, the `vector` extension
  entry, conversations, messages, knowledge, feedback, tickets, and attachment
  metadata.
- `kamalo-database.dump.sha256` — checksum for verifying the database export.

The database dump is an unredacted production handoff. Treat it as confidential
customer data. Do not send it through an unsecured channel or restore it into a
shared development database.

The database contains attachment metadata and storage keys. The application
stores uploaded image bytes in the API server's local image-storage directory,
not in PostgreSQL. Copy that storage directory separately if those image files
must be preserved. The current source archive does not include runtime upload
files.

## 1. Verify the files

```bash
sha256sum -c kamalo-database.dump.sha256
tar -tzf kamalo-portable-source.tar.gz >/dev/null
```

Expected database export details:

- Format: PostgreSQL custom format
- Dump size: 85,359 bytes
- SHA-256: `3c31d5563a5dd0e4d598daa62324d37b8b4e674c2455ceb86087a1e9274b5879`
- Catalog entries: 37
- Source and dump were generated on 2026-09-17

## 2. Restore PostgreSQL

Use a new PostgreSQL database controlled by the vendor. PostgreSQL 16 is the
tested major version for this export. The destination must have the `vector`
extension available.

```bash
createdb kamalo
pg_restore \
  --dbname="$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  kamalo-database.dump
```

For a non-empty disposable destination only, the vendor may add
`--clean --if-exists`. Do not use those flags against a shared database.

Validate the restore:

```bash
psql "$DATABASE_URL" -c '\dt public.*'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM public.conversations;'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM public.messages;'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM public.knowledge_articles;'
```

The application uses the connection string in `DATABASE_URL`; no platform
managed database variables are required.

## 3. Install and run the application

Requirements:

- Node.js 20 or newer
- pnpm 10 or newer
- PostgreSQL client/server compatible with the restored database

From the extracted source directory:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/kamalo-ai run build
```

Set these values in the vendor's secret manager or process environment. Never
commit them:

```text
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=verified-sender@example.com
KAMALO_FEEDBACK_EMAIL=support@example.com
PORT=3000
BASE_PATH=/
```

Start the API and web application as separate services:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/kamalo-ai run dev
```

For production, build the API and web app and run the API with its `start`
script behind the vendor's HTTPS reverse proxy. Serve the Vite output from the
vendor's static hosting or web server. Configure the web app's API routing so
browser requests reach the API service under the same public origin or an
explicit CORS-allowed origin.

## 4. Email and AI providers

The application calls provider APIs directly over HTTPS:

- OpenRouter: `OPENROUTER_API_KEY`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
  `KAMALO_FEEDBACK_EMAIL`

The sender domain must be verified with Resend. The API never sends provider
keys to the browser.

## 5. Mobile app

The Expo app no longer uses platform launch helpers, proxy variables, or
platform-specific environment variables. For local development:

```bash
EXPO_PUBLIC_DOMAIN=api.example.com \
pnpm --filter @workspace/kamalo-mobile run dev
```

For the existing static Expo Go build script, set
`EXPO_PUBLIC_DOMAIN` to the HTTPS host that will serve the generated files:

```bash
EXPO_PUBLIC_DOMAIN=mobile.example.com \
pnpm --filter @workspace/kamalo-mobile run build
pnpm --filter @workspace/kamalo-mobile run serve
```

For a native store release, the vendor can use the normal Expo/EAS or local
native build process and set the API host through `EXPO_PUBLIC_DOMAIN`.

## 6. Cutover checklist

1. Restore the database into the vendor-controlled PostgreSQL instance.
2. Verify table counts and a representative conversation/knowledge record.
3. Configure the provider secrets in the vendor secret manager.
4. Configure HTTPS, CORS, health checks, backups, and log retention.
5. Run the API, web, and mobile smoke tests.
6. Confirm email delivery from the verified sender.
7. Confirm the vendor backup and rollback procedure.
8. Only after the vendor environment is verified, decommission the old hosting
   environment and revoke its provider credentials.

This handoff does not include any API keys, passwords, session secrets, Git
history, or hosting-provider metadata.