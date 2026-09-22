import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function loadEnv(rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")) {
  const envPath = path.resolve(rootDir, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export function pgPoolOptions(databaseUrl) {
  const useSsl = databaseUrl.includes("supabase")
    || databaseUrl.includes("sslmode=require")
    || databaseUrl.includes("ssl=true");

  const connectionString = useSsl
    ? databaseUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "")
    : databaseUrl;

  return {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };
}
