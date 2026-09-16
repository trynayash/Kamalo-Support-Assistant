import { and, asc, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db, knowledgeArticlesTable, knowledgeChunksTable } from "@workspace/db";

type SeedArticle = {
  title: string;
  category: string;
  content: string;
};

const seedArticles: SeedArticle[] = [
  {
    title: "What is KAMALO?",
    category: "Product",
    content: "KAMALO is an ecosystem that brings together product journeys, transactions, rewards, referrals, merchant offers, and supporting services in one experience. The exact rules for a journey or offer depend on the applicable KAMALO guidance.",
  },
  {
    title: "KAMALO Coins overview",
    category: "Coins",
    content: "KAMALO Coins are part of the KAMALO ecosystem. They can be earned through eligible activities such as transactions, actions, referrals, or other applicable mechanisms. How many Coins can be earned depends on the applicable KAMALO rules or offer.",
  },
  {
    title: "Earning Coins",
    category: "Coins",
    content: "Coin earning can include Action Coins, Transaction Coins, Referral Coins, and Booster Coins. The applicable offer or rule determines eligibility and the amount. KAMALO AI cannot view a personal Coin balance in Stage 1.",
  },
  {
    title: "Coin redemption, expiry, and reversals",
    category: "Coins",
    content: "KAMALO guidance covers Coin redemption, expiry, FIFO handling, rollover, reversals, adjustments, and statements. The exact treatment depends on the applicable KAMALO rules. KAMALO AI cannot redeem, credit, reverse, or adjust Coins in Stage 1.",
  },
  {
    title: "Silver",
    category: "Silver",
    content: "Silver is a KAMALO milestone journey with eligibility, progress, milestone, claim, dispatch, and delivery concepts. The specific requirements and delivery details must come from the applicable KAMALO guidance. Stage 1 cannot check a person's live Silver progress.",
  },
  {
    title: "Gold",
    category: "Gold",
    content: "Gold is a KAMALO milestone journey that can include personal progress and community progress, together with eligibility, claim, dispatch, and delivery concepts. The specific requirements must come from the applicable KAMALO guidance. Stage 1 cannot check live Gold progress.",
  },
  {
    title: "FINCADO",
    category: "FINCADO",
    content: "FINCADO is the KAMALO goal and recommendation experience. It can include a Silver goal, Gold goal, Daily Drive, Weekly Streak, recommendations, Booster recommendations, and community recommendations. Stage 1 can explain these concepts but cannot view live progress.",
  },
  {
    title: "Auto KAMALO",
    category: "Auto KAMALO",
    content: "Auto KAMALO is a KAMALO service journey with concepts such as activation, services, mandates, failures, and stopping Auto KAMALO. Stage 1 can explain the concepts but cannot inspect or modify a personal mandate or service.",
  },
  {
    title: "Booster",
    category: "Booster",
    content: "A Booster is a KAMALO offer concept that can affect eligible earning. Booster guidance covers what it is, eligibility, earning, expiry, transaction, reversal, and offer terms. The exact terms are determined by the applicable offer.",
  },
  {
    title: "Referrals and commission",
    category: "Referral",
    content: "KAMALO referrals can include a referral link, referral levels, referral transactions, commissions, and community concepts. Commission treatment depends on the applicable KAMALO rules. Stage 1 cannot view a personal commission amount or confirm that a commission was paid.",
  },
  {
    title: "Transaction status",
    category: "Transactions",
    content: "KAMALO transaction guidance can cover payment, failed, pending, successful, reversed, cancelled, refund concepts, and transaction references. Stage 1 can explain these statuses but cannot look up a personal transaction, initiate a refund, or claim that a transaction succeeded.",
  },
  {
    title: "Notifications",
    category: "Notifications",
    content: "KAMALO notification guidance can cover notification history, delivery, preferences, and deep links. Stage 1 can explain notification concepts but cannot inspect a personal notification history or change preferences.",
  },
  {
    title: "Merchant offers",
    category: "Merchant",
    content: "KAMALO merchant guidance can cover onboarding, offers, settlement, commissions, refunds, a merchant dashboard, and technical integration. The specific terms depend on the merchant guidance and applicable offer.",
  },
];

const masterKnowledgeFilename = "Pasted--KAMALO-AI-MASTER-CUSTOMER-SUPPORT-KNOWLEDGE-BASE-Custo_1789550445810.txt";
const stageOneGuardrail = "Stage 1 guardrail: this is approved product guidance, not evidence that a live account, transaction, engine, balance, delivery, refund, or notification was checked. Until a verified server-side tool returns that data, explain the available process and say that live information cannot be verified.";
let knowledgeSetup: Promise<void> | null = null;

function parseMasterKnowledge(source: string): SeedArticle[] {
  const articles: SeedArticle[] = [];
  let part = "Master guidance";
  let title = "";
  let body: string[] = [];
  let articleNumber = 0;
  const flush = () => {
    const content = body.join("\n").trim();
    if (!title || !content) return;
    articles.push({
      title: `${part} / ${title}`,
      category: part.replace(/^PART [A-Z]+\s+—\s*/, "").trim() || "KAMALO Support",
      content: `${stageOneGuardrail}\n\n${content}`,
    });
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    const partMatch = line.match(/^PART\s+[A-Z]+\s+—\s+(.+)$/i);
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (partMatch) {
      flush();
      title = "";
      body = [];
      part = line;
      continue;
    }
    if (numberedMatch) {
      flush();
      articleNumber += 1;
      title = `${numberedMatch[1]}. ${numberedMatch[2]}`;
      body = [];
      continue;
    }
    if (title) body.push(rawLine);
  }
  flush();
  return articles.map((article, index) => ({
    ...article,
    title: `${String(index + 1).padStart(3, "0")} · ${article.title}`,
  }));
}

async function insertKnowledgeArticle(article: SeedArticle): Promise<void> {
  const id = crypto.randomUUID();
  await db.insert(knowledgeArticlesTable).values({
    id,
    title: article.title,
    category: article.category,
    content: article.content,
    status: "approved",
    effectiveFrom: new Date(),
    version: 1,
  });
  await db.insert(knowledgeChunksTable).values({
    id: crypto.randomUUID(),
    articleId: id,
    content: article.content,
    embedding: null,
  });
}

async function setupKnowledge(): Promise<void> {
  const existingRows = await db
    .select({ title: knowledgeArticlesTable.title })
    .from(knowledgeArticlesTable);
  const existingTitles = new Set(existingRows.map((row) => row.title));

  for (const article of seedArticles) {
    if (existingTitles.has(article.title)) continue;
    await insertKnowledgeArticle(article);
    existingTitles.add(article.title);
  }

  const masterMarker = "001 · Master guidance / 1. THE KAMALO SUPPORT PHILOSOPHY";
  if (existingTitles.has(masterMarker)) return;

  const sourcePaths = [
    path.resolve(process.cwd(), "attached_assets", masterKnowledgeFilename),
    path.resolve(process.cwd(), "..", "..", "attached_assets", masterKnowledgeFilename),
  ];
  try {
    let source = "";
    let sourcePath = sourcePaths[0];
    for (const candidate of sourcePaths) {
      try {
        source = await readFile(candidate, "utf8");
        sourcePath = candidate;
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    if (!source) throw new Error(`Knowledge source was not found in: ${sourcePaths.join(", ")}`);
    for (const article of parseMasterKnowledge(source)) {
      if (existingTitles.has(article.title)) continue;
      await insertKnowledgeArticle(article);
      existingTitles.add(article.title);
    }
    console.info(`Imported ${parseMasterKnowledge(source).length} KAMALO master knowledge articles.`);
  } catch (error) {
    console.warn(`KAMALO master knowledge file was not imported from ${sourcePaths.join(" or ")}.`, error);
  }
}

export async function ensureSeedKnowledge(): Promise<void> {
  if (!knowledgeSetup) {
    knowledgeSetup = setupKnowledge().catch((error) => {
      knowledgeSetup = null;
      throw error;
    });
  }
  await knowledgeSetup;
}

export type RetrievedArticle = {
  id: string;
  title: string;
  category: string;
  content: string;
  version: number;
};

export async function retrieveKnowledge(query: string): Promise<RetrievedArticle[]> {
  const articles = await db
    .select({
      id: knowledgeArticlesTable.id,
      title: knowledgeArticlesTable.title,
      category: knowledgeArticlesTable.category,
      content: knowledgeArticlesTable.content,
      version: knowledgeArticlesTable.version,
    })
    .from(knowledgeArticlesTable)
    .where(and(eq(knowledgeArticlesTable.status, "approved")))
    .orderBy(asc(knowledgeArticlesTable.category));

  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  return articles
    .map((article) => {
      const haystack = `${article.title} ${article.category} ${article.content}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ article }) => article);
}