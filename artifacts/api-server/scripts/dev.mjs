import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../../../scripts/load-env.mjs";

const artifactDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(artifactDir, "../..");

loadEnv(rootDir);

process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
process.env.PORT = process.env.PORT ?? process.env.API_PORT ?? "8081";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: artifactDir,
      env: process.env,
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

await run("pnpm", ["run", "build"]);
await run("node", ["--enable-source-maps", "./dist/index.mjs"]);
