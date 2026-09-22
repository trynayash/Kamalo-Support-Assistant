import { createRequire } from "node:module";
import { loadEnv, pgPoolOptions } from "./load-env.mjs";

const require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const pg = require("pg");

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Set DATABASE_URL to your Supabase connection string first.");
  process.exit(1);
}

const pool = new pg.Pool(pgPoolOptions(databaseUrl));

const checks = [
  ["vector extension", "SELECT extname FROM pg_extension WHERE extname = 'vector'"],
  ["conversations", "SELECT COUNT(*)::text FROM public.conversations"],
  ["messages", "SELECT COUNT(*)::text FROM public.messages"],
  ["knowledge_articles", "SELECT COUNT(*)::text FROM public.knowledge_articles"],
  ["knowledge_chunks", "SELECT COUNT(*)::text FROM public.knowledge_chunks"],
  ["support_tickets", "SELECT COUNT(*)::text FROM public.support_tickets"],
];

try {
  for (const [label, sql] of checks) {
    const result = await pool.query(sql);
    console.log(`${label}: ${result.rows[0]?.count ?? result.rows[0]?.extname ?? "ok"}`);
  }
  console.log("\nDatabase connection OK.");
} catch (error) {
  console.error("\nDatabase verification failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await pool.end();
}
