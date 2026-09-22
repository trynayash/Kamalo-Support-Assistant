import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://kamalo:kamalo@127.0.0.1:5432/kamalo";

function run(label, command, args, env = process.env) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: { ...env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("Install workspace dependencies", "pnpm", ["install"]);
run("Push database schema", "pnpm", ["--filter", "@workspace/db", "run", "push"]);
run("Build API server", "pnpm", ["--filter", "@workspace/api-server", "run", "build"]);

console.log("\nLocal setup complete.");
console.log("Start the app with: pnpm run dev");
console.log(`DATABASE_URL=${databaseUrl}`);
