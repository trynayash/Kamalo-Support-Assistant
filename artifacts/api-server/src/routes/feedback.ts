import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMessageFeedbackBody,
  CreateMessageFeedbackParams,
  CreateMessageFeedbackResponse,
} from "@workspace/api-zod";
import { db, messageFeedbackTable, messagesTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/messages/:messageId/feedback", async (req, res): Promise<void> => {
  const params = CreateMessageFeedbackParams.safeParse(req.params);
  const body = CreateMessageFeedbackBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid feedback." });
    return;
  }
  const [message] = await db.select({ id: messagesTable.id }).from(messagesTable).where(eq(messagesTable.id, params.data.messageId)).limit(1);
  if (!message) {
    res.status(404).json({ error: "Message not found." });
    return;
  }
  await db.update(messagesTable).set({ feedback: body.data.rating }).where(eq(messagesTable.id, message.id));
  const [feedback] = await db.insert(messageFeedbackTable).values({
    id: crypto.randomUUID(),
    messageId: message.id,
    rating: body.data.rating,
    feedback: body.data.feedback ?? null,
  }).returning();
  res.status(201).json(CreateMessageFeedbackResponse.parse({
    id: feedback.id,
    messageId: feedback.messageId,
    rating: feedback.rating,
    feedback: feedback.feedback,
    createdAt: feedback.createdAt.toISOString(),
  }));
});

export default router;