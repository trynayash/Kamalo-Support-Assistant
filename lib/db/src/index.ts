import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { buildPgPoolConfig } from "./pg-pool-options";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool(buildPgPoolConfig(process.env.DATABASE_URL));

/** Surface clear guidance when a Supabase direct host fails at runtime with ENETUNREACH. */
pool.on("error", (err) => {
  const message = err?.message ?? "";
  if (/ENETUNREACH|supabase\.co/.test(message)) {
    console.error(
      "[db] ENETUNREACH — Render deploy cannot reach Supabase over IPv6.\n"
      + "Fix: set DATABASE_URL on Render to the Session pooler URI (IPv4),\n"
      + "not the direct db.*.supabase.co host.\n"
      + "See: Supabase → Project Settings → Database → Connect → Session mode (port 5432).",
    );
  }
});

export const db = drizzle(pool, { schema });

export * from "./schema";