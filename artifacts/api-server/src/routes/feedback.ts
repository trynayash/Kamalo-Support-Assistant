import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMessageFeedbackBody,
  CreateMessageFeedbackParams,
  CreateMessageFeedbackResponse,
} from "@workspace/api-zod";
import { db, messageFeedbackTable, messagesTable } from "@workspace/db";
import { conversationsTable } from "@workspace/db";
import { DEMO_USER_ID } from "../lib/context";

const router: IRouter = Router();

router.post("/messages/:messageId/feedback", async (req, res): Promise<void> => {
  const params = CreateMessageFeedbackParams.safeParse(req.params);
  const body = CreateMessageFeedbackBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid feedback." });
    return;
  }
  const [message] = await db.select({ id: messagesTable.id, conversationId: messagesTable.conversationId }).from(messagesTable)
    .innerJoin(conversationsTable, eq(conversationsTable.id, messagesTable.conversationId))
    .where(and(eq(messagesTable.id, params.data.messageId), eq(conversationsTable.userId, DEMO_USER_ID)))
    .limit(1);
  if (!message) {
    res.status(404).json({ error: "Message not found." });
    return;
  }
  await db.update(messagesTable).set({ feedback: body.data.rating }).where(eq(messagesTable.id, message.id));
  const [feedback] = await db.insert(messageFeedbackTable).values({
    id: crypto.randomUUID(),
    messageId: message.id,
    rating: body.data.rating,
    score: body.data.score ?? null,
    feedback: body.data.feedback ?? null,
  }).returning();
  res.status(201).json(CreateMessageFeedbackResponse.parse({
    id: feedback.id,
    messageId: feedback.messageId,
    rating: feedback.rating,
    score: feedback.score,
    feedback: feedback.feedback,
    createdAt: feedback.createdAt.toISOString(),
  }));
});

export default router;