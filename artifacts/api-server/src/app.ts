import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const staticDir = process.env.STATIC_DIR?.trim();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use("/api/transcribe", express.json({ limit: "16mb" }));
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true }));

const requestWindows = new Map<string, { startedAt: number; count: number }>();
app.use((req, res, next) => {
  if (req.method === "POST" && req.path.includes("/conversations/") && req.path.endsWith("/messages")) {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const window = requestWindows.get(key);
    if (!window || now - window.startedAt > 60_000) {
      requestWindows.set(key, { startedAt: now, count: 1 });
    } else {
      window.count += 1;
      if (window.count > 30) {
        res.status(429).json({ error: "Too many messages. Please try again shortly." });
        return;
      }
    }
  }
  next();
});

if (!staticDir) {
  app.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });
}

app.use("/api", router);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "The requested resource was not found." });
});

if (staticDir) {
  const publicDir = path.resolve(staticDir);
  app.use(express.static(publicDir, { index: false }));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  req.log.error({ err: error }, "Unhandled API error");
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

export default app;
