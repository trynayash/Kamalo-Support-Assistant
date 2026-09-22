import app from "./app";
import { logger } from "./lib/logger";
import { ensureSeedKnowledge } from "./lib/knowledge";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

void ensureSeedKnowledge()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((error) => {
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    const causeMessage = cause instanceof Error ? cause.message : String(cause ?? "");
    if (/ENETUNREACH|supabase\.co:5432|SUPABASE_DIRECT_HOST/i.test(causeMessage)) {
      logger.error(
        "Database connection failed. On Render, set DATABASE_URL to the Supabase Session pooler URI "
        + "(pooler.supabase.com:5432), not the direct db.*.supabase.co host. "
        + "See Supabase → Project Settings → Database → Connect → Session mode.",
      );
    }
    logger.error({ err: error }, "Knowledge initialization failed");
    process.exit(1);
  });
