import { pool } from "@workspace/db";
import {
  assertNoDuplicateActiveApprovedTopics,
  ensureSeedKnowledge,
  loadKnowledgeTopicRows,
} from "../lib/knowledge";

async function checkKnowledge(): Promise<void> {
  await ensureSeedKnowledge();
  const articles = await loadKnowledgeTopicRows();
  assertNoDuplicateActiveApprovedTopics(articles);
  console.info(`Knowledge integrity check passed (${articles.length} articles checked).`);
}

checkKnowledge()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());