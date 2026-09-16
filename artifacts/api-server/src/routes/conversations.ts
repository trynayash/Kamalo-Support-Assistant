import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateConversationBody,
  CreateConversationResponse,
  DeleteConversationParams,
  GetConversationParams,
  GetConversationResponse,
  ListConversationsResponse,
  StreamAssistantMessageBody,
  StreamAssistantMessageParams,
  UploadConversationImageResponse,
} from "@workspace/api-zod";
import { db, conversationsTable, messageAttachmentsTable, messagesTable } from "@workspace/db";
import { llmProvider, OPENROUTER_MODEL } from "../lib/llm";
import { capAssistantOutput, isPromptExtractionAttempt, normalizeUserInput, PROMPT_EXTRACTION_RESPONSE, SAFE_ASSISTANT_ERROR, sanitizeAssistantOutput } from "../lib/safety";
import { readConversationImage, saveConversationImage } from "../lib/image-attachments";
import { createSupportRequestContext } from "../lib/context";
import { prepareSupportRequest } from "../lib/orchestrator";
import { recordSupportEvent } from "../lib/observability";

const router: IRouter = Router();
const DEMO_USER_ID = "demo-user";
const STAGE_ONE_FALLBACK = "I don't have enough verified KAMALO information to answer that accurately yet.";
const IMAGE_NOT_SUPPORTED_RESPONSE = "Images are saved with your message, but this chat cannot interpret image content yet.";
function dateString(value: Date): string {
  return value.toISOString();
}

async function conversationExists(id: string): Promise<boolean> {
  const rows = await db.select({ id: conversationsTable.id }).from(conversationsTable).where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt))).limit(1);
  return rows.length > 0;
}

function attachmentResponse(conversationId: string, attachment: typeof messageAttachmentsTable.$inferSelect) {
  return {
    id: attachment.id,
    filename: attachment.originalFilename,
    mediaType: attachment.mediaType,
    size: attachment.size,
    url: `/api/conversations/${conversationId}/attachments/${attachment.id}`,
    uploadedAt: dateString(attachment.createdAt),
  };
}

router.get("/conversations", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: conversationsTable.id,
      title: conversationsTable.title,
      createdAt: conversationsTable.createdAt,
      updatedAt: conversationsTable.updatedAt,
      messageCount: count(messagesTable.id),
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(and(eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .groupBy(conversationsTable.id)
    .having(gt(count(messagesTable.id), 0))
    .orderBy(desc(conversationsTable.updatedAt));
  res.json(ListConversationsResponse.parse(rows.map((row) => ({
    ...row,
    createdAt: dateString(row.createdAt),
    updatedAt: dateString(row.updatedAt),
    messageCount: Number(row.messageCount),
  }))));
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid conversation details." });
    return;
  }
  const now = new Date();
  const conversation = {
    id: crypto.randomUUID(),
    userId: DEMO_USER_ID,
    title: parsed.data.title?.trim() || "New KAMALO conversation",
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(conversationsTable).values(conversation);
  res.status(201).json(CreateConversationResponse.parse({
    ...conversation,
    createdAt: dateString(conversation.createdAt),
    updatedAt: dateString(conversation.updatedAt),
  }));
});

router.get("/conversations/:conversationId", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success || !(await conversationExists(params.data.conversationId))) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  const [conversation] = await db.select().from(conversationsTable).where(and(eq(conversationsTable.id, params.data.conversationId), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)));
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, params.data.conversationId)).orderBy(messagesTable.createdAt);
  const attachments = await db.select().from(messageAttachmentsTable).where(eq(messageAttachmentsTable.conversationId, params.data.conversationId));
  const attachmentsByMessage = new Map<string, ReturnType<typeof attachmentResponse>[]>();
  for (const attachment of attachments) {
    if (!attachment.messageId) continue;
    const existing = attachmentsByMessage.get(attachment.messageId) || [];
    existing.push(attachmentResponse(params.data.conversationId, attachment));
    attachmentsByMessage.set(attachment.messageId, existing);
  }
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  res.json(GetConversationResponse.parse({
    id: conversation.id,
    title: conversation.title,
    createdAt: dateString(conversation.createdAt),
    updatedAt: dateString(conversation.updatedAt),
    messages: messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      feedback: message.feedback,
      createdAt: dateString(message.createdAt),
      attachments: attachmentsByMessage.get(message.id) || [],
    })),
  }));
});

router.delete("/conversations/:conversationId", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  const clearedAt = new Date();
  const cleared = await db.update(conversationsTable)
    .set({ clearedAt, updatedAt: clearedAt })
    .where(and(eq(conversationsTable.id, params.data.conversationId), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .returning({ id: conversationsTable.id });
  if (cleared.length === 0) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  req.log.info({ conversationId: params.data.conversationId, clearedAt: clearedAt.toISOString() }, "Conversation removed from user history");
  res.sendStatus(204);
});

router.post("/conversations/:conversationId/attachments", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success || !(await conversationExists(params.data.conversationId))) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }

  const attachmentId = crypto.randomUUID();
  const stored = await saveConversationImage(req, attachmentId);
  const attachment = {
    id: attachmentId,
    conversationId: params.data.conversationId,
    messageId: null,
    originalFilename: stored.originalFilename,
    mediaType: stored.mediaType,
    size: stored.size,
    storageKey: `${attachmentId}.${stored.storageKey.split(".").pop()}`,
  };
  await db.insert(messageAttachmentsTable).values(attachment);
  res.status(201).json(UploadConversationImageResponse.parse({
    ...attachmentResponse(params.data.conversationId, { ...attachment, createdAt: new Date() }),
  }));
});

router.get("/conversations/:conversationId/attachments/:attachmentId", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  const attachmentId = typeof req.params.attachmentId === "string" ? req.params.attachmentId : "";
  if (!params.success || !attachmentId || !(await conversationExists(params.data.conversationId))) {
    res.status(404).json({ error: "Image not found." });
    return;
  }
  const [attachment] = await db.select().from(messageAttachmentsTable).where(and(
    eq(messageAttachmentsTable.id, attachmentId),
    eq(messageAttachmentsTable.conversationId, params.data.conversationId),
  )).limit(1);
  if (!attachment) {
    res.status(404).json({ error: "Image not found." });
    return;
  }
  try {
    const data = await readConversationImage(attachment.storageKey);
    res.setHeader("Content-Type", attachment.mediaType);
    res.setHeader("Content-Length", data.length);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(data);
  } catch {
    res.status(404).json({ error: "Image not found." });
  }
});

router.post("/conversations/:conversationId/messages", async (req, res): Promise<void> => {
  const params = StreamAssistantMessageParams.safeParse(req.params);
  const body = StreamAssistantMessageBody.safeParse(req.body);
  if (!params.success || !body.success || !(await conversationExists(params.data.conversationId))) {
    res.status(400).json({ error: "Invalid conversation or message." });
    return;
  }

  const conversationId = params.data.conversationId;
  const content = normalizeUserInput(body.data.content || "");
  const attachmentId = body.data.attachmentId || null;
  if (!content && !attachmentId) {
    res.status(400).json({ error: "Please enter a message before sending." });
    return;
  }
  let attachment: typeof messageAttachmentsTable.$inferSelect | null = null;
  if (attachmentId) {
    const [found] = await db.select().from(messageAttachmentsTable).where(and(
      eq(messageAttachmentsTable.id, attachmentId),
      eq(messageAttachmentsTable.conversationId, conversationId),
      isNull(messageAttachmentsTable.messageId),
    )).limit(1);
    if (!found) {
      res.status(400).json({ error: "The image attachment is no longer available. Please select it again." });
      return;
    }
    attachment = found;
  }
  const storedContent = content || "Image attachment sent.";
  const userMessageId = crypto.randomUUID();
  await db.insert(messagesTable).values({
    id: userMessageId,
    conversationId,
    role: "user",
    content: storedContent,
  });
  if (attachment) {
    await db.update(messageAttachmentsTable).set({ messageId: userMessageId }).where(eq(messageAttachmentsTable.id, attachment.id));
  }
  await db.update(conversationsTable).set({ updatedAt: new Date(), title: (content || storedContent).slice(0, 64) }).where(eq(conversationsTable.id, conversationId));

  const supportContext = createSupportRequestContext(req, conversationId);
  const startedAt = Date.now();
  recordSupportEvent(req.log, { event: "support_request_started", context: supportContext });
  const prepared = await prepareSupportRequest(supportContext, content, Boolean(attachment && !content));
  recordSupportEvent(req.log, {
    event: "knowledge_retrieved",
    context: supportContext,
    evidenceCount: prepared.evidence.length,
    decision: prepared.decision,
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";
  try {
    if (attachment && !content) {
      fullResponse = IMAGE_NOT_SUPPORTED_RESPONSE;
    } else if (isPromptExtractionAttempt(content)) {
      fullResponse = PROMPT_EXTRACTION_RESPONSE;
    } else if (prepared.decision === "greeting") {
      fullResponse = "Hi! I'm KAMALO AI. How can I help you understand KAMALO?";
    } else if (prepared.retrieved.length === 0) {
      fullResponse = STAGE_ONE_FALLBACK;
    } else {
      for await (const chunk of llmProvider.stream({ messages: prepared.llmMessages })) {
        fullResponse += chunk;
      }
    }
  } catch (error) {
    recordSupportEvent(req.log, {
      event: "provider_failure",
      context: supportContext,
      evidenceCount: prepared.evidence.length,
      outcome: "safe_fallback",
    });
    req.log.error({ err: error, conversationId, retrievedArticleIds: prepared.retrieved.map((article) => article.id) }, "LLM request failed");
    fullResponse = SAFE_ASSISTANT_ERROR;
  }

  fullResponse = capAssistantOutput(sanitizeAssistantOutput(fullResponse || STAGE_ONE_FALLBACK));
  const assistantMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: fullResponse,
  };
  await db.insert(messagesTable).values(assistantMessage);
  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));
  recordSupportEvent(req.log, {
    event: "response_completed",
    context: supportContext,
    latencyMs: Date.now() - startedAt,
    evidenceCount: prepared.evidence.length,
    outcome: fullResponse === SAFE_ASSISTANT_ERROR ? "safe_error" : "complete",
  });
  req.log.info({
    conversationId,
    requestId: supportContext.requestId,
    model: OPENROUTER_MODEL,
    provider: "OpenRouterProvider",
    latency: Date.now() - startedAt,
    retrievalUsed: prepared.retrieved.length > 0,
    retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    responseStatus: "complete",
  }, "KAMALO AI response generated");
  res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
  res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMessage.id, finalContent: fullResponse })}\n\n`);
  res.end();
});

export default router;