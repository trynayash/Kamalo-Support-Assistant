import dns from "node:dns";
import type { PoolConfig } from "pg";

/** Prefer IPv4 — Render and similar hosts often cannot reach Supabase over IPv6. */
dns.setDefaultResultOrder("ipv4first");

const SUPABASE_DIRECT_HOST = /@db\.[^/]+\.supabase\.co/i;

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string, family: number) => void;

const ipv4Lookup = (hostname: string, options: dns.LookupOptions, callback: LookupCallback) => {
  dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    if (err && (err.code === "ENOTFOUND" || err.code === "ENODATA")) {
      dns.lookup(hostname, options, callback);
      return;
    }
    callback(err, address, family);
  });
};

export function buildPgPoolConfig(databaseUrl: string): PoolConfig {
  const useSsl = databaseUrl.includes("supabase")
    || databaseUrl.includes("sslmode=require")
    || databaseUrl.includes("ssl=true");
  const connectionString = useSsl
    ? databaseUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "")
    : databaseUrl;

  if (SUPABASE_DIRECT_HOST.test(databaseUrl)) {
    console.warn(
      "[db] DATABASE_URL uses Supabase direct host (db.*.supabase.co). "
      + "On Render, set the Session pooler URI (pooler.supabase.com) from Supabase → Database → Connection string.",
    );
  }

  return {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    lookup: ipv4Lookup,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  } as PoolConfig;
}
