import dns from "node:dns";
import type { PoolConfig } from "pg";

/** Prefer IPv4 — Render and similar hosts often cannot reach Supabase over IPv6. */
dns.setDefaultResultOrder("ipv4first");

const SUPABASE_DIRECT_HOST = /^db\.([a-z0-9]+)\.supabase\.co$/i;
const SUPABASE_POOLER_HOST = /\.pooler\.supabase\.com$/i;

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string, family: number) => void;

/** Never fall back to IPv6 — that causes ENETUNREACH on Render. */
const ipv4Lookup = (hostname: string, _options: dns.LookupOptions, callback: LookupCallback) => {
  dns.lookup(hostname, { family: 4 }, callback);
};

function parsePostgresUrl(rawUrl: string): URL {
  return new URL(rawUrl.replace(/^postgresql:\/\//i, "postgres://"));
}

function formatPostgresUrl(url: URL): string {
  return url.toString().replace(/^postgres:\/\//i, "postgresql://");
}

export type SupabaseDirectHostError = Error & {
  code: "SUPABASE_DIRECT_HOST";
  projectRef: string;
};

export function createSupabaseDirectHostError(projectRef: string): SupabaseDirectHostError {
  const error = new Error(
    [
      `Render cannot connect to Supabase direct host db.${projectRef}.supabase.co (IPv6 only).`,
      "",
      "Fix: In Render → Environment, set DATABASE_URL to the Session pooler URI from:",
      "Supabase → Project Settings → Database → Connect → Session mode (port 5432).",
      "",
      "Example shape:",
      `postgresql://postgres.${projectRef}:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres`,
      "",
      "Alternatively set DATABASE_POOLER_URL to that pooler URI (keeps DATABASE_URL unchanged),",
      "or set SUPABASE_DB_REGION (e.g. ap-south-1) to auto-rewrite a direct URL.",
    ].join("\n"),
  ) as SupabaseDirectHostError;
  error.code = "SUPABASE_DIRECT_HOST";
  error.projectRef = projectRef;
  return error;
}

/**
 * Render and other IPv4-only hosts must use Supavisor (pooler.supabase.com), not db.*.supabase.co.
 * See https://supabase.com/docs/guides/platform/ipv4-address
 */
export function normalizeSupabaseDatabaseUrl(rawUrl: string): string {
  const poolerOverride = process.env.DATABASE_POOLER_URL?.trim();
  if (poolerOverride) return poolerOverride;

  let url: URL;
  try {
    url = parsePostgresUrl(rawUrl);
  } catch {
    return rawUrl;
  }

  const directMatch = url.hostname.match(SUPABASE_DIRECT_HOST);
  if (!directMatch) return rawUrl;

  const projectRef = directMatch[1];
  const region = process.env.SUPABASE_DB_REGION?.trim();
  if (!region) {
    if (process.env.NODE_ENV === "production") {
      throw createSupabaseDirectHostError(projectRef);
    }
    console.warn(
      `[db] DATABASE_URL uses Supabase direct host db.${projectRef}.supabase.co. `
      + "Prefer the Session pooler URI (pooler.supabase.com) — required on Render.",
    );
    return rawUrl;
  }

  const password = url.password;
  const username = url.username.includes(".") ? url.username : `postgres.${projectRef}`;
  const port = url.port || "5432";
  const database = url.pathname.replace(/^\//, "") || "postgres";
  const poolerHost = `aws-0-${region}.pooler.supabase.com`;

  const poolerUrl = new URL(`postgres://${username}:${password}@${poolerHost}:${port}/${database}`);
  console.info(`[db] Rewrote Supabase direct host to Session pooler (${poolerHost}).`);
  return formatPostgresUrl(poolerUrl);
}

export function buildPgPoolConfig(databaseUrl: string): PoolConfig {
  const normalizedUrl = normalizeSupabaseDatabaseUrl(databaseUrl);
  const useSsl = normalizedUrl.includes("supabase")
    || normalizedUrl.includes("sslmode=require")
    || normalizedUrl.includes("ssl=true");
  const connectionString = useSsl
    ? normalizedUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "")
    : normalizedUrl;

  if (SUPABASE_POOLER_HOST.test(connectionString)) {
    console.info("[db] Using Supabase pooler connection (IPv4 compatible).");
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
