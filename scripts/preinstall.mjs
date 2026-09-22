import { rmSync } from "node:fs";

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  try {
    rmSync(lockfile, { force: true });
  } catch {
    // Ignore missing lockfiles.
  }
}

const userAgent = process.env.npm_config_user_agent ?? "";
if (!userAgent.includes("pnpm/")) {
  console.error("Use pnpm instead of npm or yarn for this workspace.");
  process.exit(1);
}
