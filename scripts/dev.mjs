import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(rootDir);

const apiPort = process.env.API_PORT ?? "8081";
const webPort = process.env.WEB_PORT ?? "5173";

const sharedEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

const children = [];

function run(label, command, args, env) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`[${label}] exited from signal ${signal}`);
    } else if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
    }
    shutdown(code ?? (signal ? 1 : 0));
  });

  children.push(child);
  return child;
}

function shutdown(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(exitCode), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`Starting KAMALO locally (API :${apiPort}, web :${webPort})`);

run(
  "api",
  "pnpm",
  ["--filter", "@workspace/api-server", "run", "dev"],
  {
    ...sharedEnv,
    PORT: apiPort,
  },
);

run(
  "web",
  "pnpm",
  ["--filter", "@workspace/kamalo-ai", "run", "dev"],
  {
    ...sharedEnv,
    PORT: webPort,
    API_PROXY_TARGET: process.env.API_PROXY_TARGET ?? `http://127.0.0.1:${apiPort}`,
  },
);
