import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";
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

const retrievalStopWords = new Set([
  "a",
  "about",
  "after",
  "am",
  "an",
  "and",
  "are",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "if",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "why",
  "with",
  "would",
]);

const retrievalAliases: Record<string, string[]> = {
  account: ["account", "profile", "register", "registration", "login", "locked", "signup"],
  register: ["account", "profile", "register", "registration", "login", "locked", "signup"],
  signup: ["account", "profile", "register", "registration", "login", "locked", "signup"],
  address: ["address", "delivery", "dispatch", "shipping", "shipment"],
  shipment: ["address", "delivery", "dispatch", "shipping", "shipment"],
  auto: ["auto", "mandate", "automatic", "autopay"],
  autopay: ["auto", "mandate", "automatic", "autopay"],
  booster: ["booster", "offer", "promotion", "promo"],
  promotion: ["booster", "offer", "promotion", "promo"],
  promo: ["booster", "offer", "promotion", "promo"],
  coin: ["coin", "coins", "reward", "rewards", "points"],
  reward: ["coin", "coins", "reward", "rewards", "points"],
  point: ["coin", "coins", "reward", "rewards", "points"],
  commission: ["commission", "referral", "referrals", "income", "earning"],
  referral: ["commission", "referral", "referrals", "income", "earning"],
  fail: ["fail", "failed", "failure", "declined", "rejected", "unsuccessful"],
  decline: ["fail", "failed", "failure", "declined", "rejected", "unsuccessful"],
  reject: ["fail", "failed", "failure", "declined", "rejected", "unsuccessful"],
  gold: ["gold", "community", "milestone"],
  merchant: ["merchant", "seller", "shop", "settlement"],
  seller: ["merchant", "seller", "shop", "settlement"],
  settlement: ["merchant", "seller", "shop", "settlement"],
  notification: ["notification", "alert", "message", "deep", "link", "receive", "received"],
  alert: ["notification", "alert", "message", "deep", "link", "receive", "received"],
  recieve: ["notification", "alert", "message", "deep", "link", "receive", "received"],
  payment: ["payment", "transaction", "charged", "deducted", "transfer"],
  transaction: ["payment", "transaction", "charged", "deducted", "transfer"],
  charged: ["payment", "transaction", "charged", "deducted", "transfer"],
  pending: ["pending", "processing", "waiting", "delay", "delayed"],
  refund: ["refund", "reversal", "reversed", "cancelled", "cancel"],
  silver: ["silver", "milestone", "progress", "qualification"],
};

function stemToken(token: string): string {
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokenize(value: string): string[] {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ");

  return normalized
    .split(/[^a-z0-9]+/)
    .map((token) => stemToken(token))
    .filter((token) => token.length > 1 && !retrievalStopWords.has(token));
}

function expandedTerms(query: string): string[] {
  const terms = new Set<string>();
  for (const token of tokenize(query)) {
    terms.add(token);
    for (const alias of retrievalAliases[token] || []) terms.add(stemToken(alias));
  }
  return [...terms];
}

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
    .where(and(
      eq(knowledgeArticlesTable.status, "approved"),
      or(isNull(knowledgeArticlesTable.effectiveFrom), lte(knowledgeArticlesTable.effectiveFrom, new Date())),
      or(isNull(knowledgeArticlesTable.effectiveUntil), gt(knowledgeArticlesTable.effectiveUntil, new Date())),
    ))
    .orderBy(asc(knowledgeArticlesTable.category));

  const terms = expandedTerms(query);
  const normalizedQuery = tokenize(query).join(" ");

  return articles
    .map((article) => {
      const title = tokenize(article.title);
      const category = tokenize(article.category);
      const content = tokenize(article.content);
      const titleTerms = new Set(title);
      const categoryTerms = new Set(category);
      const contentTerms = new Set(content);
      const score = terms.reduce((total, term) => {
        if (titleTerms.has(term)) return total + 8;
        if (categoryTerms.has(term)) return total + 4;
        if (contentTerms.has(term)) return total + 1;
        return total;
      }, 0)
        + (normalizedQuery && tokenize(`${article.title} ${article.content}`).join(" ").includes(normalizedQuery) ? 12 : 0)
        + (tokenize(article.title).join(" ").includes(normalizedQuery) ? 18 : 0);
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .slice(0, 6)
    .map(({ article }) => article);
}