import { and, eq, isNull } from "drizzle-orm";
import type { Request } from "express";
import { conversationsTable, db, supportTicketsTable } from "@workspace/db";

export async function ownsConversation(req: Request, conversationId: string): Promise<boolean> {
  if (!req.isAuthenticated()) return false;
  const [conversation] = await db.select({ id: conversationsTable.id }).from(conversationsTable).where(and(
    eq(conversationsTable.id, conversationId),
    eq(conversationsTable.userId, req.user.id),
    isNull(conversationsTable.clearedAt),
  )).limit(1);
  return Boolean(conversation);
}

export async function canAccessConversation(req: Request, conversationId: string): Promise<boolean> {
  if (!req.isAuthenticated()) return false;
  if (req.user.role === "support" || req.user.role === "admin") return true;
  return ownsConversation(req, conversationId);
}

export async function ticketForUser(req: Request, ticketId: string) {
  if (!req.isAuthenticated()) return null;
  const [ticket] = await db.select().from(supportTicketsTable).where(
    req.user.role === "support" || req.user.role === "admin"
      ? eq(supportTicketsTable.id, ticketId)
      : and(eq(supportTicketsTable.id, ticketId), eq(supportTicketsTable.userId, req.user.id)),
  ).limit(1);
  return ticket || null;
}