import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const rawConnectionString = process.env.DATABASE_URL;
const useSsl = rawConnectionString.includes("supabase")
  || rawConnectionString.includes("sslmode=require")
  || rawConnectionString.includes("ssl=true");
const connectionString = useSsl
  ? rawConnectionString.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "")
  : rawConnectionString;

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";