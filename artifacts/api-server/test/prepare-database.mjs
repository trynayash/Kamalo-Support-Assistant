import { spawnSync } from "node:child_process";

const setupCommand = "pnpm --filter @workspace/db run push";
const schemaPath = "lib/db/src/schema/index.ts";

if (!process.env.DATABASE_URL) {
  console.error("API regression tests require DATABASE_URL for a local PostgreSQL database.");
  console.error(`After provisioning the local database, run: ${setupCommand}`);
  process.exit(1);
}

const result = spawnSync("pnpm", ["--filter", "@workspace/db", "run", "push"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error || result.status !== 0) {
  console.error("\nAPI regression database preflight failed.");
  console.error(`Required schema setup: ${setupCommand}`);
  console.error(`The schema source of truth is ${schemaPath}.`);
  console.error("Fix the local DATABASE_URL or apply the schema setup above, then rerun: pnpm --filter @workspace/api-server test");
  if (result.error) {
    console.error(`Command error: ${result.error.message}`);
  }
  process.exit(result.status && result.status > 0 ? result.status : 1);
}