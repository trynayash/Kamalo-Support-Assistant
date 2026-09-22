# Supabase setup for KAMALO

Use the prepared SQL files in `supabase/`, then point the API at Supabase with `DATABASE_URL`.

## 1. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Save the **database password** (you need it for the connection string).

## 2. Enable pgvector (required before schema)

In Supabase: **Database → Extensions →** search **vector** → **Enable**.

Or run **`supabase/00-enable-vector.sql`** once in the SQL editor.

If you skip this step, `01-schema.sql` fails with `type "public.vector" does not exist`.

## 3. Import the database

From the repo root:

```bash
pnpm run supabase:prepare-sql
```

This writes Supabase-compatible files (no `COPY` blocks — those fail in the SQL editor):

- `supabase/01-schema.sql` — tables, indexes, constraints
- `supabase/02-data-*.sql` — one INSERT file per table

**Option A — Supabase SQL Editor (easiest)**

1. Open **SQL → New query**
2. Run **`supabase/01-schema.sql`** first (choose **Run without RLS** if prompted)
3. Run each **`supabase/02-data-*.sql`** file in this order:
   - `02-data-conversations.sql`
   - `03-data-knowledge_articles.sql`
   - `04-data-knowledge_chunks.sql`
   - `05-data-messages.sql` ← **before** feedback
   - `06-data-message_attachments.sql`
   - `07-data-message_feedback.sql`
   - `08-data-support_tickets.sql`
   - `09-data-support_ticket_attachments.sql`

**Option B — psql (if installed)**

```bash
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require" -f supabase/kamalo-development.sql
```

Use the **Session pooler** URI from **Project Settings → Database → Connection string → URI**.

## 4. Configure the app

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
PORT=8080
OPENROUTER_API_KEY=...
GROQ_API_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
KAMALO_FEEDBACK_EMAIL=...
```

Get the URI from **Supabase → Project Settings → Database → Connection string → URI** (Session mode, port 5432).

Also set the same `DATABASE_URL` on Render (or your host) in environment variables.

## 5. Verify

```bash
pnpm run db:verify
```

You should see table counts and `Database connection OK.`

## 6. Run locally

```bash
pnpm run dev
```

Open http://localhost:5173 — chat, history, knowledge admin, and tickets use Supabase through the API.

## Notes

- Use **Session pooler** (port 5432) for Drizzle migrations and the API. Avoid transaction pooler (6543) for schema push unless you know you need it.
- Supabase free tier is enough for development; enable backups for production.
- Image uploads are stored on the API server disk (`artifacts/api-server/data/`), not in Postgres. Copy that folder separately if you need old attachment files.
