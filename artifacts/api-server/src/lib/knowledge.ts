import { and, asc, eq } from "drizzle-orm";
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

export async function ensureSeedKnowledge(): Promise<void> {
  const existing = await db
    .select({ id: knowledgeArticlesTable.id })
    .from(knowledgeArticlesTable)
    .limit(1);
  if (existing.length > 0) return;

  for (const article of seedArticles) {
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