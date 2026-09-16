import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ApproveKnowledgeArticleParams,
  ApproveKnowledgeArticleResponse,
  ArchiveKnowledgeArticleParams,
  ArchiveKnowledgeArticleResponse,
  CreateKnowledgeArticleBody,
  CreateKnowledgeArticleResponse,
  ListKnowledgeArticlesQueryParams,
  ListKnowledgeArticlesResponse,
  UpdateKnowledgeArticleBody,
  UpdateKnowledgeArticleParams,
  UpdateKnowledgeArticleResponse,
} from "@workspace/api-zod";
import { db, knowledgeArticlesTable, knowledgeChunksTable } from "@workspace/db";
import { ensureSeedKnowledge } from "../lib/knowledge";

const router: IRouter = Router();

function responseArticle(article: typeof knowledgeArticlesTable.$inferSelect) {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    content: article.content,
    version: article.version,
    status: article.status,
    effectiveFrom: article.effectiveFrom?.toISOString() ?? null,
    effectiveUntil: article.effectiveUntil?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

router.get("/knowledge/articles", async (req, res): Promise<void> => {
  await ensureSeedKnowledge();
  const parsed = ListKnowledgeArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid knowledge filters." });
    return;
  }
  const filters = [parsed.data.category ? eq(knowledgeArticlesTable.category, parsed.data.category) : undefined, parsed.data.status ? eq(knowledgeArticlesTable.status, parsed.data.status) : undefined];
  if (parsed.data.search) {
    filters.push(or(ilike(knowledgeArticlesTable.title, `%${parsed.data.search}%`), ilike(knowledgeArticlesTable.content, `%${parsed.data.search}%`)));
  }
  const articles = await db.select().from(knowledgeArticlesTable).where(and(...filters.filter(Boolean))).orderBy(desc(knowledgeArticlesTable.updatedAt), asc(knowledgeArticlesTable.title));
  res.json(ListKnowledgeArticlesResponse.parse(articles.map(responseArticle)));
});

router.post("/knowledge/articles", async (req, res): Promise<void> => {
  const parsed = CreateKnowledgeArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid article." });
    return;
  }
  const now = new Date();
  const article = {
    id: crypto.randomUUID(),
    title: parsed.data.title.trim(),
    category: parsed.data.category.trim(),
    content: parsed.data.content.trim(),
    version: 1,
    status: parsed.data.status ?? "draft",
    effectiveFrom: parsed.data.status === "approved" ? now : null,
    effectiveUntil: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(knowledgeArticlesTable).values(article);
  await db.insert(knowledgeChunksTable).values({ id: crypto.randomUUID(), articleId: article.id, content: article.content, embedding: null });
  res.status(201).json(CreateKnowledgeArticleResponse.parse(responseArticle(article)));
});

router.patch("/knowledge/articles/:articleId", async (req, res): Promise<void> => {
  const params = UpdateKnowledgeArticleParams.safeParse(req.params);
  const body = UpdateKnowledgeArticleBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid article update." });
    return;
  }
  const [current] = await db.select({ version: knowledgeArticlesTable.version }).from(knowledgeArticlesTable).where(eq(knowledgeArticlesTable.id, params.data.articleId)).limit(1);
  const [article] = await db.update(knowledgeArticlesTable).set({
    ...(body.data.title === undefined ? {} : { title: body.data.title.trim() }),
    ...(body.data.category === undefined ? {} : { category: body.data.category.trim() }),
    ...(body.data.content === undefined ? {} : { content: body.data.content.trim() }),
    version: (current?.version ?? 0) + 1,
    updatedAt: new Date(),
  }).where(eq(knowledgeArticlesTable.id, params.data.articleId)).returning();
  if (!article) {
    res.status(404).json({ error: "Article not found." });
    return;
  }
  await db.delete(knowledgeChunksTable).where(eq(knowledgeChunksTable.articleId, article.id));
  await db.insert(knowledgeChunksTable).values({ id: crypto.randomUUID(), articleId: article.id, content: article.content, embedding: null });
  res.json(UpdateKnowledgeArticleResponse.parse(responseArticle(article)));
});

router.post("/knowledge/articles/:articleId/approve", async (req, res): Promise<void> => {
  const params = ApproveKnowledgeArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid article." });
    return;
  }
  const [article] = await db.update(knowledgeArticlesTable).set({ status: "approved", effectiveFrom: new Date(), effectiveUntil: null, updatedAt: new Date() }).where(eq(knowledgeArticlesTable.id, params.data.articleId)).returning();
  if (!article) {
    res.status(404).json({ error: "Article not found." });
    return;
  }
  res.json(ApproveKnowledgeArticleResponse.parse(responseArticle(article)));
});

router.post("/knowledge/articles/:articleId/archive", async (req, res): Promise<void> => {
  const params = ArchiveKnowledgeArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid article." });
    return;
  }
  const [article] = await db.update(knowledgeArticlesTable).set({ status: "archived", effectiveUntil: new Date(), updatedAt: new Date() }).where(eq(knowledgeArticlesTable.id, params.data.articleId)).returning();
  if (!article) {
    res.status(404).json({ error: "Article not found." });
    return;
  }
  res.json(ArchiveKnowledgeArticleResponse.parse(responseArticle(article)));
});

export default router;