import { createInsertSchema } from "drizzle-zod";
import { customType, pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const vector = customType<{ data: number[] | null; driverData: string | null }>({
  dataType: () => "vector(1536)",
  toDriver: (value) => value ? `[${value.join(",")}]` : null,
  fromDriver: (value) => value ? value.slice(1, -1).split(",").map(Number) : null,
});

export const knowledgeArticlesTable = pgTable("knowledge_articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  effectiveUntil: timestamp("effective_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const knowledgeChunksTable = pgTable("knowledge_chunks", {
  id: text("id").primaryKey(),
  articleId: text("article_id")
    .notNull()
    .references(() => knowledgeArticlesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding"),
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticlesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type KnowledgeArticle = typeof knowledgeArticlesTable.$inferSelect;