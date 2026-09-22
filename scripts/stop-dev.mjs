import { execSync } from "node:child_process";
import { loadEnv } from "./load-env.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(rootDir);

const apiPort = process.env.API_PORT ?? "8081";
const webPort = process.env.WEB_PORT ?? "5173";

function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
    const pids = new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && pid !== "0" && /^\d+$/.test(pid)),
    );

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
        console.log(`Stopped PID ${pid} (port ${port})`);
      } catch {
        // Process may already be gone.
      }
    }

    if (pids.size === 0) {
      console.log(`No listener found on port ${port}`);
    }
  } catch {
    console.log(`No listener found on port ${port}`);
  }
}

killPort(webPort);
killPort(apiPort);
