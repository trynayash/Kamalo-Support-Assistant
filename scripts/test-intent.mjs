import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxBin = path.join(
  rootDir,
  "artifacts",
  "kamalo-ai",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);
const apiDir = path.join(rootDir, "artifacts", "api-server");

const result = spawnSync(
  tsxBin,
  ["--test", "test/colloquial-support.test.ts", "test/intent-grounding.test.ts"],
  { cwd: apiDir, stdio: "inherit", shell: process.platform === "win32" },
);

process.exit(result.status ?? 1);
