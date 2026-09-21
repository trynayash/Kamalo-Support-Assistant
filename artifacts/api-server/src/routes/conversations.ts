import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateConversationBody,
  CreateConversationResponse,
  DeleteConversationParams,
  DeleteAllConversationsResponse,
  GetConversationParams,
  GetConversationResponse,
  ListConversationsResponse,
  UpdateConversationBody,
  UpdateConversationResponse,
  StreamAssistantMessageBody,
  StreamAssistantMessageParams,
  UploadConversationImageResponse,
} from "@workspace/api-zod";
import { db, conversationsTable, messageAttachmentsTable, messagesTable } from "@workspace/db";
import { llmProvider, OPENROUTER_MODEL, OpenRouterError } from "../lib/llm";
import { condenseAssistantOutput, containsProviderDrafting, isGroundedAssistantOutput, isPromptExtractionAttempt, keepCompleteAssistantOutput, normalizeUserInput, PROMPT_EXTRACTION_RESPONSE, SAFE_ASSISTANT_ERROR, sanitizeAssistantOutput } from "../lib/safety";
import { ImageUploadError, deleteConversationImage, readConversationImage, saveConversationImage } from "../lib/image-attachments";
import { createSupportRequestContext, DEMO_USER_ID } from "../lib/context";
import { prepareSupportRequest, preferGroundedFact, type ConversationHistoryMessage } from "../lib/orchestrator";
import { recordSupportEvent } from "../lib/observability";

const router: IRouter = Router();
const STAGE_ONE_FALLBACK = "I don't have confirmed information about that in the KAMALO information available to me.";
const IMAGE_NOT_SUPPORTED_RESPONSE = "Images are saved with your message, but this chat cannot interpret image content yet.";
type AssistantResponseOutcome = "complete" | "unknown" | "provider_error" | "grounding_fallback" | "image_only" | "prompt_extraction" | "greeting";
function dateString(value: Date): string {
  return value.toISOString();
}

async function writeSse(res: import("express").Response, payload: Record<string, unknown>): Promise<boolean> {
  if (res.destroyed || res.writableEnded) return false;
  const writable = res.write(`data: ${JSON.stringify(payload)}\n\n`);
  if (!writable && !res.destroyed && !res.writableEnded) {
    await new Promise<void>((resolve) => res.once("drain", resolve));
  }
  return !res.destroyed && !res.writableEnded;
}

async function conversationExists(id: string): Promise<boolean> {
  const [conversation] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .limit(1);
  return Boolean(conversation);
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

async function getConversationHistory(conversationId: string, currentMessageId: string): Promise<ConversationHistoryMessage[]> {
  const rows = await db
    .select({
      id: messagesTable.id,
      role: messagesTable.role,
      content: messagesTable.content,
    })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(12);

  return rows
    .filter((message) => message.id !== currentMessageId)
    .reverse()
    .filter((message): message is { id: string; role: "user" | "assistant"; content: string } => message.role === "user" || message.role === "assistant")
    .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
}

router.get("/conversations", async (req, res): Promise<void> => {
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

router.delete("/conversations", async (req, res): Promise<void> => {
  const clearedAt = new Date();
  const cleared = await db.update(conversationsTable)
    .set({ clearedAt, updatedAt: clearedAt })
    .where(and(eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .returning({ id: conversationsTable.id });
  req.log.info({ clearedAt: clearedAt.toISOString(), count: cleared.length }, "All conversations removed from user history");
  res.status(204).send();
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

router.patch("/conversations/:conversationId", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  const body = UpdateConversationBody.safeParse(req.body ?? {});
  if (!params.success || !body.success || !body.data.title.trim()) {
    res.status(400).json({ error: "Enter a conversation title." });
    return;
  }
  const title = body.data.title.trim();
  const updatedAt = new Date();
  const [conversation] = await db.update(conversationsTable)
    .set({ title, updatedAt })
    .where(and(
      eq(conversationsTable.id, params.data.conversationId),
      eq(conversationsTable.userId, DEMO_USER_ID),
      isNull(conversationsTable.clearedAt),
    ))
    .returning();
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  res.json(UpdateConversationResponse.parse({
    ...conversation,
    createdAt: dateString(conversation.createdAt),
    updatedAt: dateString(conversation.updatedAt),
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
  let stored: Awaited<ReturnType<typeof saveConversationImage>>;
  try {
    stored = await saveConversationImage(req, attachmentId);
  } catch (error) {
    if (error instanceof ImageUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
  const attachment = {
    id: attachmentId,
    conversationId: params.data.conversationId,
    messageId: null,
    originalFilename: stored.originalFilename,
    mediaType: stored.mediaType,
    size: stored.size,
    storageKey: `${attachmentId}.${stored.storageKey.split(".").pop()}`,
  };
  try {
    await db.insert(messageAttachmentsTable).values(attachment);
  } catch (error) {
    await deleteConversationImage(attachment.id, stored.mediaType);
    throw error;
  }
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
    const mediaType = attachment.mediaType === "image/png" ? "image/png" : "image/jpeg";
    const data = await readConversationImage(attachment.id, mediaType);
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
  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));

  const supportContext = createSupportRequestContext(req, conversationId);
  const startedAt = Date.now();
  recordSupportEvent(req.log, { event: "support_request_started", context: supportContext });
  const history = await getConversationHistory(conversationId, userMessageId);
  const prepared = await prepareSupportRequest(supportContext, content, Boolean(attachment && !content), history, body.data.inputMode || "text", body.data.language || "en");
  recordSupportEvent(req.log, {
    event: "knowledge_retrieved",
    context: supportContext,
    evidenceCount: prepared.evidence.length,
    decision: prepared.decision,
  });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Expose-Headers", "X-Request-ID");
  res.setHeader("X-Request-ID", supportContext.requestId);
  res.flushHeaders();

  const abortController = new AbortController();
  let clientClosed = false;
  const onClientClosed = () => {
    if (!res.writableEnded) {
      clientClosed = true;
      abortController.abort();
    }
  };
  req.once("aborted", onClientClosed);
  res.once("close", onClientClosed);

  let fullResponse = "";
  let providerAnswerGenerated = false;
  let responseOutcome: AssistantResponseOutcome = "complete";

  try {
    if (attachment && !content) {
      fullResponse = IMAGE_NOT_SUPPORTED_RESPONSE;
      responseOutcome = "image_only";
    } else if (isPromptExtractionAttempt(content)) {
      fullResponse = PROMPT_EXTRACTION_RESPONSE;
      responseOutcome = "prompt_extraction";
    } else if (prepared.decision === "greeting") {
      fullResponse = "Hi! I'm KAMALO AI. How can I help you understand KAMALO?";
      responseOutcome = "greeting";
    } else if (prepared.retrieved.length === 0) {
      fullResponse = STAGE_ONE_FALLBACK;
      responseOutcome = prepared.decision === "fallback" ? "unknown" : "complete";
    } else {
      for await (const chunk of llmProvider.stream({
        messages: prepared.llmMessages,
        requestId: supportContext.requestId,
        signal: abortController.signal,
      })) {
        fullResponse += chunk;
      }
      providerAnswerGenerated = true;
    }
  } catch (error) {
    if (clientClosed) {
      req.log.info({ conversationId, requestId: supportContext.requestId }, "Client disconnected during response generation");
      req.removeListener("aborted", onClientClosed);
      res.removeListener("close", onClientClosed);
      return;
    }
    recordSupportEvent(req.log, {
      event: "provider_failure",
      context: supportContext,
      evidenceCount: prepared.evidence.length,
      outcome: "safe_fallback",
    });
    req.log.error({
      err: error,
      conversationId,
      requestId: supportContext.requestId,
      providerErrorKind: error instanceof OpenRouterError ? error.kind : "unknown",
      providerStatus: error instanceof OpenRouterError ? error.status : null,
      retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    }, "LLM request failed");
    fullResponse = SAFE_ASSISTANT_ERROR;
    responseOutcome = "provider_error";
  }

  const draftFallback = prepared.groundedFact || (/\b(?:mine|personal|current balance|my balance|my account|my coins|my silver|my gold|account balance|transaction reference|order history|order status)\b/i.test(content) ? STAGE_ONE_FALLBACK : SAFE_ASSISTANT_ERROR);
  const preferredResponse = containsProviderDrafting(fullResponse)
    ? draftFallback
    : preferGroundedFact(fullResponse || STAGE_ONE_FALLBACK, prepared.groundedFact);
  const condensedResponse = condenseAssistantOutput(sanitizeAssistantOutput(preferredResponse));
  const candidateResponse = keepCompleteAssistantOutput(condensedResponse);
  // Validate numeric claims against article content only. Article titles carry
  // internal sequence numbers that must never make an unsupported customer
  // number appear approved.
  const approvedSources = prepared.retrieved.map((article) => article.content);
  const outputIsGrounded = !providerAnswerGenerated
    || prepared.decision !== "knowledge_answer"
    || isGroundedAssistantOutput(candidateResponse, approvedSources, body.data.language || "en");
  const usedGroundingFallback = providerAnswerGenerated
    && prepared.decision === "knowledge_answer"
    && !outputIsGrounded;
  if (usedGroundingFallback) responseOutcome = "grounding_fallback";
  fullResponse = outputIsGrounded
    ? candidateResponse
    : keepCompleteAssistantOutput(prepared.groundedFact || STAGE_ONE_FALLBACK);
  if (!fullResponse) fullResponse = STAGE_ONE_FALLBACK;
  if (clientClosed) {
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  const assistantMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: fullResponse,
  };
  try {
    await db.insert(messagesTable).values(assistantMessage);
    await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));
  } catch (error) {
    req.log.error({ err: error, conversationId, requestId: supportContext.requestId }, "Assistant response could not be persisted");
    await writeSse(res, { error: "The response could not be saved. Please try again." });
    res.end();
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  recordSupportEvent(req.log, {
    event: "response_completed",
    context: supportContext,
    latencyMs: Date.now() - startedAt,
    evidenceCount: prepared.evidence.length,
    outcome: fullResponse === SAFE_ASSISTANT_ERROR
      ? "safe_error"
      : usedGroundingFallback
        ? "grounding_fallback"
        : "complete",
  });
  await writeSse(res, { content: fullResponse });
  req.log.info({
    conversationId,
    requestId: supportContext.requestId,
    model: OPENROUTER_MODEL,
    provider: "OpenRouterProvider",
    latency: Date.now() - startedAt,
    retrievalUsed: prepared.retrieved.length > 0,
    retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    groundingValidated: !providerAnswerGenerated || prepared.decision !== "knowledge_answer" || !usedGroundingFallback,
    responseStatus: "complete",
  }, "KAMALO AI response generated");
  await writeSse(res, { done: true, messageId: assistantMessage.id, finalContent: fullResponse, outcome: responseOutcome });
  res.end();
  req.removeListener("aborted", onClientClosed);
  res.removeListener("close", onClientClosed);
});

export default router;import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateConversationBody,
  CreateConversationResponse,
  DeleteConversationParams,
  DeleteAllConversationsResponse,
  GetConversationParams,
  GetConversationResponse,
  ListConversationsResponse,
  UpdateConversationBody,
  UpdateConversationResponse,
  StreamAssistantMessageBody,
  StreamAssistantMessageParams,
  UploadConversationImageResponse,
} from "@workspace/api-zod";
import { db, conversationsTable, messageAttachmentsTable, messagesTable } from "@workspace/db";
import { llmProvider, OPENROUTER_MODEL, OpenRouterError } from "../lib/llm";
import { condenseAssistantOutput, containsProviderDrafting, isGroundedAssistantOutput, isPromptExtractionAttempt, keepCompleteAssistantOutput, normalizeUserInput, PROMPT_EXTRACTION_RESPONSE, SAFE_ASSISTANT_ERROR, sanitizeAssistantOutput } from "../lib/safety";
import { ImageUploadError, deleteConversationImage, readConversationImage, saveConversationImage } from "../lib/image-attachments";
import { createSupportRequestContext, DEMO_USER_ID } from "../lib/context";
import { prepareSupportRequest, preferGroundedFact, type ConversationHistoryMessage } from "../lib/orchestrator";
import { recordSupportEvent } from "../lib/observability";

const router: IRouter = Router();
const STAGE_ONE_FALLBACK = "I don't have confirmed information about that in the KAMALO information available to me.";
const IMAGE_NOT_SUPPORTED_RESPONSE = "Images are saved with your message, but this chat cannot interpret image content yet.";
type AssistantResponseOutcome = "complete" | "unknown" | "provider_error" | "grounding_fallback" | "image_only" | "prompt_extraction" | "greeting";
function dateString(value: Date): string {
  return value.toISOString();
}

async function writeSse(res: import("express").Response, payload: Record<string, unknown>): Promise<boolean> {
  if (res.destroyed || res.writableEnded) return false;
  const writable = res.write(`data: ${JSON.stringify(payload)}\n\n`);
  if (!writable && !res.destroyed && !res.writableEnded) {
    await new Promise<void>((resolve) => res.once("drain", resolve));
  }
  return !res.destroyed && !res.writableEnded;
}

async function conversationExists(id: string): Promise<boolean> {
  const [conversation] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .limit(1);
  return Boolean(conversation);
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

async function getConversationHistory(conversationId: string, currentMessageId: string): Promise<ConversationHistoryMessage[]> {
  const rows = await db
    .select({
      id: messagesTable.id,
      role: messagesTable.role,
      content: messagesTable.content,
    })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(12);

  return rows
    .filter((message) => message.id !== currentMessageId)
    .reverse()
    .filter((message): message is { id: string; role: "user" | "assistant"; content: string } => message.role === "user" || message.role === "assistant")
    .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
}

router.get("/conversations", async (req, res): Promise<void> => {
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

router.delete("/conversations", async (req, res): Promise<void> => {
  const clearedAt = new Date();
  const cleared = await db.update(conversationsTable)
    .set({ clearedAt, updatedAt: clearedAt })
    .where(and(eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .returning({ id: conversationsTable.id });
  req.log.info({ clearedAt: clearedAt.toISOString(), count: cleared.length }, "All conversations removed from user history");
  res.status(204).send();
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

router.patch("/conversations/:conversationId", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  const body = UpdateConversationBody.safeParse(req.body ?? {});
  if (!params.success || !body.success || !body.data.title.trim()) {
    res.status(400).json({ error: "Enter a conversation title." });
    return;
  }
  const title = body.data.title.trim();
  const updatedAt = new Date();
  const [conversation] = await db.update(conversationsTable)
    .set({ title, updatedAt })
    .where(and(
      eq(conversationsTable.id, params.data.conversationId),
      eq(conversationsTable.userId, DEMO_USER_ID),
      isNull(conversationsTable.clearedAt),
    ))
    .returning();
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  res.json(UpdateConversationResponse.parse({
    ...conversation,
    createdAt: dateString(conversation.createdAt),
    updatedAt: dateString(conversation.updatedAt),
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
  let stored: Awaited<ReturnType<typeof saveConversationImage>>;
  try {
    stored = await saveConversationImage(req, attachmentId);
  } catch (error) {
    if (error instanceof ImageUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
  const attachment = {
    id: attachmentId,
    conversationId: params.data.conversationId,
    messageId: null,
    originalFilename: stored.originalFilename,
    mediaType: stored.mediaType,
    size: stored.size,
    storageKey: `${attachmentId}.${stored.storageKey.split(".").pop()}`,
  };
  try {
    await db.insert(messageAttachmentsTable).values(attachment);
  } catch (error) {
    await deleteConversationImage(attachment.id, stored.mediaType);
    throw error;
  }
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
    const mediaType = attachment.mediaType === "image/png" ? "image/png" : "image/jpeg";
    const data = await readConversationImage(attachment.id, mediaType);
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
  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));

  const supportContext = createSupportRequestContext(req, conversationId);
  const startedAt = Date.now();
  recordSupportEvent(req.log, { event: "support_request_started", context: supportContext });
  const history = await getConversationHistory(conversationId, userMessageId);
  const prepared = await prepareSupportRequest(supportContext, content, Boolean(attachment && !content), history, body.data.inputMode || "text", body.data.language || "en");
  recordSupportEvent(req.log, {
    event: "knowledge_retrieved",
    context: supportContext,
    evidenceCount: prepared.evidence.length,
    decision: prepared.decision,
  });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Expose-Headers", "X-Request-ID");
  res.setHeader("X-Request-ID", supportContext.requestId);
  res.flushHeaders();

  const abortController = new AbortController();
  let clientClosed = false;
  const onClientClosed = () => {
    if (!res.writableEnded) {
      clientClosed = true;
      abortController.abort();
    }
  };
  req.once("aborted", onClientClosed);
  res.once("close", onClientClosed);

  let fullResponse = "";
  let providerAnswerGenerated = false;
  let responseOutcome: AssistantResponseOutcome = "complete";

  try {
    if (attachment && !content) {
      fullResponse = IMAGE_NOT_SUPPORTED_RESPONSE;
      responseOutcome = "image_only";
    } else if (isPromptExtractionAttempt(content)) {
      fullResponse = PROMPT_EXTRACTION_RESPONSE;
      responseOutcome = "prompt_extraction";
    } else if (prepared.decision === "greeting") {
      fullResponse = "Hi! I'm KAMALO AI. How can I help you understand KAMALO?";
      responseOutcome = "greeting";
    } else if (prepared.retrieved.length === 0) {
      fullResponse = STAGE_ONE_FALLBACK;
      responseOutcome = prepared.decision === "fallback" ? "unknown" : "complete";
    } else {
      for await (const chunk of llmProvider.stream({
        messages: prepared.llmMessages,
        requestId: supportContext.requestId,
        signal: abortController.signal,
      })) {
        fullResponse += chunk;
      }
      providerAnswerGenerated = true;
    }
  } catch (error) {
    if (clientClosed) {
      req.log.info({ conversationId, requestId: supportContext.requestId }, "Client disconnected during response generation");
      req.removeListener("aborted", onClientClosed);
      res.removeListener("close", onClientClosed);
      return;
    }
    recordSupportEvent(req.log, {
      event: "provider_failure",
      context: supportContext,
      evidenceCount: prepared.evidence.length,
      outcome: "safe_fallback",
    });
    req.log.error({
      err: error,
      conversationId,
      requestId: supportContext.requestId,
      providerErrorKind: error instanceof OpenRouterError ? error.kind : "unknown",
      providerStatus: error instanceof OpenRouterError ? error.status : null,
      retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    }, "LLM request failed");
    fullResponse = SAFE_ASSISTANT_ERROR;
    responseOutcome = "provider_error";
  }

  const draftFallback = prepared.groundedFact || (/\b(?:mine|personal|current balance|my balance|my account|my coins|my silver|my gold|account balance|transaction reference|order history|order status)\b/i.test(content) ? STAGE_ONE_FALLBACK : SAFE_ASSISTANT_ERROR);
  const preferredResponse = containsProviderDrafting(fullResponse)
    ? draftFallback
    : preferGroundedFact(fullResponse || STAGE_ONE_FALLBACK, prepared.groundedFact);
  const condensedResponse = condenseAssistantOutput(sanitizeAssistantOutput(preferredResponse));
  const candidateResponse = keepCompleteAssistantOutput(condensedResponse);
  // Validate numeric claims against article content only. Article titles carry
  // internal sequence numbers that must never make an unsupported customer
  // number appear approved.
  const approvedSources = prepared.retrieved.map((article) => article.content);
  const outputIsGrounded = !providerAnswerGenerated
    || prepared.decision !== "knowledge_answer"
    || isGroundedAssistantOutput(candidateResponse, approvedSources, body.data.language || "en");
  const usedGroundingFallback = providerAnswerGenerated
    && prepared.decision === "knowledge_answer"
    && !outputIsGrounded;
  if (usedGroundingFallback) responseOutcome = "grounding_fallback";
  fullResponse = outputIsGrounded
    ? candidateResponse
    : keepCompleteAssistantOutput(prepared.groundedFact || STAGE_ONE_FALLBACK);
  if (!fullResponse) fullResponse = STAGE_ONE_FALLBACK;
  if (clientClosed) {
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  const assistantMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: fullResponse,
  };
  try {
    await db.insert(messagesTable).values(assistantMessage);
    await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));
  } catch (error) {
    req.log.error({ err: error, conversationId, requestId: supportContext.requestId }, "Assistant response could not be persisted");
    await writeSse(res, { error: "The response could not be saved. Please try again." });
    res.end();
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  recordSupportEvent(req.log, {
    event: "response_completed",
    context: supportContext,
    latencyMs: Date.now() - startedAt,
    evidenceCount: prepared.evidence.length,
    outcome: fullResponse === SAFE_ASSISTANT_ERROR
      ? "safe_error"
      : usedGroundingFallback
        ? "grounding_fallback"
        : "complete",
  });
  await writeSse(res, { content: fullResponse });
  req.log.info({
    conversationId,
    requestId: supportContext.requestId,
    model: OPENROUTER_MODEL,
    provider: "OpenRouterProvider",
    latency: Date.now() - startedAt,
    retrievalUsed: prepared.retrieved.length > 0,
    retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    groundingValidated: !providerAnswerGenerated || prepared.decision !== "knowledge_answer" || !usedGroundingFallback,
    responseStatus: "complete",
  }, "KAMALO AI response generated");
  await writeSse(res, { done: true, messageId: assistantMessage.id, finalContent: fullResponse, outcome: responseOutcome });
  res.end();
  req.removeListener("aborted", onClientClosed);
  res.removeListener("close", onClientClosed);
});

export default router;import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateConversationBody,
  CreateConversationResponse,
  DeleteConversationParams,
  DeleteAllConversationsResponse,
  GetConversationParams,
  GetConversationResponse,
  ListConversationsResponse,
  UpdateConversationBody,
  UpdateConversationResponse,
  StreamAssistantMessageBody,
  StreamAssistantMessageParams,
  UploadConversationImageResponse,
} from "@workspace/api-zod";
import { db, conversationsTable, messageAttachmentsTable, messagesTable } from "@workspace/db";
import { llmProvider, OPENROUTER_MODEL, OpenRouterError } from "../lib/llm";
import { condenseAssistantOutput, containsProviderDrafting, isGroundedAssistantOutput, isPromptExtractionAttempt, keepCompleteAssistantOutput, normalizeUserInput, PROMPT_EXTRACTION_RESPONSE, SAFE_ASSISTANT_ERROR, sanitizeAssistantOutput } from "../lib/safety";
import { ImageUploadError, deleteConversationImage, readConversationImage, saveConversationImage } from "../lib/image-attachments";
import { createSupportRequestContext, DEMO_USER_ID } from "../lib/context";
import { prepareSupportRequest, preferGroundedFact, type ConversationHistoryMessage } from "../lib/orchestrator";
import { recordSupportEvent } from "../lib/observability";

const router: IRouter = Router();
const STAGE_ONE_FALLBACK = "I don't have confirmed information about that in the KAMALO information available to me.";
const IMAGE_NOT_SUPPORTED_RESPONSE = "Images are saved with your message, but this chat cannot interpret image content yet.";
type AssistantResponseOutcome = "complete" | "unknown" | "provider_error" | "grounding_fallback" | "image_only" | "prompt_extraction" | "greeting";
function dateString(value: Date): string {
  return value.toISOString();
}

async function writeSse(res: import("express").Response, payload: Record<string, unknown>): Promise<boolean> {
  if (res.destroyed || res.writableEnded) return false;
  const writable = res.write(`data: ${JSON.stringify(payload)}\n\n`);
  if (!writable && !res.destroyed && !res.writableEnded) {
    await new Promise<void>((resolve) => res.once("drain", resolve));
  }
  return !res.destroyed && !res.writableEnded;
}

async function conversationExists(id: string): Promise<boolean> {
  const [conversation] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .limit(1);
  return Boolean(conversation);
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

async function getConversationHistory(conversationId: string, currentMessageId: string): Promise<ConversationHistoryMessage[]> {
  const rows = await db
    .select({
      id: messagesTable.id,
      role: messagesTable.role,
      content: messagesTable.content,
    })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(12);

  return rows
    .filter((message) => message.id !== currentMessageId)
    .reverse()
    .filter((message): message is { id: string; role: "user" | "assistant"; content: string } => message.role === "user" || message.role === "assistant")
    .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
}

router.get("/conversations", async (req, res): Promise<void> => {
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

router.delete("/conversations", async (req, res): Promise<void> => {
  const clearedAt = new Date();
  const cleared = await db.update(conversationsTable)
    .set({ clearedAt, updatedAt: clearedAt })
    .where(and(eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .returning({ id: conversationsTable.id });
  req.log.info({ clearedAt: clearedAt.toISOString(), count: cleared.length }, "All conversations removed from user history");
  res.status(204).send();
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

router.patch("/conversations/:conversationId", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  const body = UpdateConversationBody.safeParse(req.body ?? {});
  if (!params.success || !body.success || !body.data.title.trim()) {
    res.status(400).json({ error: "Enter a conversation title." });
    return;
  }
  const title = body.data.title.trim();
  const updatedAt = new Date();
  const [conversation] = await db.update(conversationsTable)
    .set({ title, updatedAt })
    .where(and(
      eq(conversationsTable.id, params.data.conversationId),
      eq(conversationsTable.userId, DEMO_USER_ID),
      isNull(conversationsTable.clearedAt),
    ))
    .returning();
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  res.json(UpdateConversationResponse.parse({
    ...conversation,
    createdAt: dateString(conversation.createdAt),
    updatedAt: dateString(conversation.updatedAt),
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
  let stored: Awaited<ReturnType<typeof saveConversationImage>>;
  try {
    stored = await saveConversationImage(req, attachmentId);
  } catch (error) {
    if (error instanceof ImageUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
  const attachment = {
    id: attachmentId,
    conversationId: params.data.conversationId,
    messageId: null,
    originalFilename: stored.originalFilename,
    mediaType: stored.mediaType,
    size: stored.size,
    storageKey: `${attachmentId}.${stored.storageKey.split(".").pop()}`,
  };
  try {
    await db.insert(messageAttachmentsTable).values(attachment);
  } catch (error) {
    await deleteConversationImage(attachment.id, stored.mediaType);
    throw error;
  }
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
    const mediaType = attachment.mediaType === "image/png" ? "image/png" : "image/jpeg";
    const data = await readConversationImage(attachment.id, mediaType);
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
  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));

  const supportContext = createSupportRequestContext(req, conversationId);
  const startedAt = Date.now();
  recordSupportEvent(req.log, { event: "support_request_started", context: supportContext });
  const history = await getConversationHistory(conversationId, userMessageId);
  const prepared = await prepareSupportRequest(supportContext, content, Boolean(attachment && !content), history, body.data.inputMode || "text", body.data.language || "en");
  recordSupportEvent(req.log, {
    event: "knowledge_retrieved",
    context: supportContext,
    evidenceCount: prepared.evidence.length,
    decision: prepared.decision,
  });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Expose-Headers", "X-Request-ID");
  res.setHeader("X-Request-ID", supportContext.requestId);
  res.flushHeaders();

  const abortController = new AbortController();
  let clientClosed = false;
  const onClientClosed = () => {
    if (!res.writableEnded) {
      clientClosed = true;
      abortController.abort();
    }
  };
  req.once("aborted", onClientClosed);
  res.once("close", onClientClosed);

  let fullResponse = "";
  let providerAnswerGenerated = false;
  let responseOutcome: AssistantResponseOutcome = "complete";

  try {
    if (attachment && !content) {
      fullResponse = IMAGE_NOT_SUPPORTED_RESPONSE;
      responseOutcome = "image_only";
    } else if (isPromptExtractionAttempt(content)) {
      fullResponse = PROMPT_EXTRACTION_RESPONSE;
      responseOutcome = "prompt_extraction";
    } else if (prepared.decision === "greeting") {
      fullResponse = "Hi! I'm KAMALO AI. How can I help you understand KAMALO?";
      responseOutcome = "greeting";
    } else if (prepared.retrieved.length === 0) {
      fullResponse = STAGE_ONE_FALLBACK;
      responseOutcome = prepared.decision === "fallback" ? "unknown" : "complete";
    } else {
      for await (const chunk of llmProvider.stream({
        messages: prepared.llmMessages,
        requestId: supportContext.requestId,
        signal: abortController.signal,
      })) {
        fullResponse += chunk;
      }
      providerAnswerGenerated = true;
    }
  } catch (error) {
    if (clientClosed) {
      req.log.info({ conversationId, requestId: supportContext.requestId }, "Client disconnected during response generation");
      req.removeListener("aborted", onClientClosed);
      res.removeListener("close", onClientClosed);
      return;
    }
    recordSupportEvent(req.log, {
      event: "provider_failure",
      context: supportContext,
      evidenceCount: prepared.evidence.length,
      outcome: "safe_fallback",
    });
    req.log.error({
      err: error,
      conversationId,
      requestId: supportContext.requestId,
      providerErrorKind: error instanceof OpenRouterError ? error.kind : "unknown",
      providerStatus: error instanceof OpenRouterError ? error.status : null,
      retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    }, "LLM request failed");
    fullResponse = SAFE_ASSISTANT_ERROR;
    responseOutcome = "provider_error";
  }

  const draftFallback = prepared.groundedFact || (/\b(?:mine|personal|current balance|my balance|my account|my coins|my silver|my gold|account balance|transaction reference|order history|order status)\b/i.test(content) ? STAGE_ONE_FALLBACK : SAFE_ASSISTANT_ERROR);
  const preferredResponse = containsProviderDrafting(fullResponse)
    ? draftFallback
    : preferGroundedFact(fullResponse || STAGE_ONE_FALLBACK, prepared.groundedFact);
  const condensedResponse = condenseAssistantOutput(sanitizeAssistantOutput(preferredResponse));
  const candidateResponse = keepCompleteAssistantOutput(condensedResponse);
  // Validate numeric claims against article content only. Article titles carry
  // internal sequence numbers that must never make an unsupported customer
  // number appear approved.
  const approvedSources = prepared.retrieved.map((article) => article.content);
  const outputIsGrounded = !providerAnswerGenerated
    || prepared.decision !== "knowledge_answer"
    || isGroundedAssistantOutput(candidateResponse, approvedSources, body.data.language || "en");
  const usedGroundingFallback = providerAnswerGenerated
    && prepared.decision === "knowledge_answer"
    && !outputIsGrounded;
  if (usedGroundingFallback) responseOutcome = "grounding_fallback";
  fullResponse = outputIsGrounded
    ? candidateResponse
    : keepCompleteAssistantOutput(prepared.groundedFact || STAGE_ONE_FALLBACK);
  if (!fullResponse) fullResponse = STAGE_ONE_FALLBACK;
  if (clientClosed) {
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  const assistantMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: fullResponse,
  };
  try {
    await db.insert(messagesTable).values(assistantMessage);
    await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));
  } catch (error) {
    req.log.error({ err: error, conversationId, requestId: supportContext.requestId }, "Assistant response could not be persisted");
    await writeSse(res, { error: "The response could not be saved. Please try again." });
    res.end();
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  recordSupportEvent(req.log, {
    event: "response_completed",
    context: supportContext,
    latencyMs: Date.now() - startedAt,
    evidenceCount: prepared.evidence.length,
    outcome: fullResponse === SAFE_ASSISTANT_ERROR
      ? "safe_error"
      : usedGroundingFallback
        ? "grounding_fallback"
        : "complete",
  });
  await writeSse(res, { content: fullResponse });
  req.log.info({
    conversationId,
    requestId: supportContext.requestId,
    model: OPENROUTER_MODEL,
    provider: "OpenRouterProvider",
    latency: Date.now() - startedAt,
    retrievalUsed: prepared.retrieved.length > 0,
    retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    groundingValidated: !providerAnswerGenerated || prepared.decision !== "knowledge_answer" || !usedGroundingFallback,
    responseStatus: "complete",
  }, "KAMALO AI response generated");
  await writeSse(res, { done: true, messageId: assistantMessage.id, finalContent: fullResponse, outcome: responseOutcome });
  res.end();
  req.removeListener("aborted", onClientClosed);
  res.removeListener("close", onClientClosed);
});

export default router;import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateConversationBody,
  CreateConversationResponse,
  DeleteConversationParams,
  DeleteAllConversationsResponse,
  GetConversationParams,
  GetConversationResponse,
  ListConversationsResponse,
  UpdateConversationBody,
  UpdateConversationResponse,
  StreamAssistantMessageBody,
  StreamAssistantMessageParams,
  UploadConversationImageResponse,
} from "@workspace/api-zod";
import { db, conversationsTable, messageAttachmentsTable, messagesTable } from "@workspace/db";
import { llmProvider, OPENROUTER_MODEL, OpenRouterError } from "../lib/llm";
import { condenseAssistantOutput, containsProviderDrafting, isGroundedAssistantOutput, isPromptExtractionAttempt, keepCompleteAssistantOutput, normalizeUserInput, PROMPT_EXTRACTION_RESPONSE, SAFE_ASSISTANT_ERROR, sanitizeAssistantOutput } from "../lib/safety";
import { ImageUploadError, deleteConversationImage, readConversationImage, saveConversationImage } from "../lib/image-attachments";
import { createSupportRequestContext, DEMO_USER_ID } from "../lib/context";
import { prepareSupportRequest, preferGroundedFact, type ConversationHistoryMessage } from "../lib/orchestrator";
import { recordSupportEvent } from "../lib/observability";

const router: IRouter = Router();
const STAGE_ONE_FALLBACK = "I don't have confirmed information about that in the KAMALO information available to me.";
const IMAGE_NOT_SUPPORTED_RESPONSE = "Images are saved with your message, but this chat cannot interpret image content yet.";
type AssistantResponseOutcome = "complete" | "unknown" | "provider_error" | "grounding_fallback" | "image_only" | "prompt_extraction" | "greeting";
function dateString(value: Date): string {
  return value.toISOString();
}

async function writeSse(res: import("express").Response, payload: Record<string, unknown>): Promise<boolean> {
  if (res.destroyed || res.writableEnded) return false;
  const writable = res.write(`data: ${JSON.stringify(payload)}\n\n`);
  if (!writable && !res.destroyed && !res.writableEnded) {
    await new Promise<void>((resolve) => res.once("drain", resolve));
  }
  return !res.destroyed && !res.writableEnded;
}

async function conversationExists(id: string): Promise<boolean> {
  const [conversation] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .limit(1);
  return Boolean(conversation);
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

async function getConversationHistory(conversationId: string, currentMessageId: string): Promise<ConversationHistoryMessage[]> {
  const rows = await db
    .select({
      id: messagesTable.id,
      role: messagesTable.role,
      content: messagesTable.content,
    })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(12);

  return rows
    .filter((message) => message.id !== currentMessageId)
    .reverse()
    .filter((message): message is { id: string; role: "user" | "assistant"; content: string } => message.role === "user" || message.role === "assistant")
    .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
}

router.get("/conversations", async (req, res): Promise<void> => {
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

router.delete("/conversations", async (req, res): Promise<void> => {
  const clearedAt = new Date();
  const cleared = await db.update(conversationsTable)
    .set({ clearedAt, updatedAt: clearedAt })
    .where(and(eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .returning({ id: conversationsTable.id });
  req.log.info({ clearedAt: clearedAt.toISOString(), count: cleared.length }, "All conversations removed from user history");
  res.status(204).send();
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

router.patch("/conversations/:conversationId", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  const body = UpdateConversationBody.safeParse(req.body ?? {});
  if (!params.success || !body.success || !body.data.title.trim()) {
    res.status(400).json({ error: "Enter a conversation title." });
    return;
  }
  const title = body.data.title.trim();
  const updatedAt = new Date();
  const [conversation] = await db.update(conversationsTable)
    .set({ title, updatedAt })
    .where(and(
      eq(conversationsTable.id, params.data.conversationId),
      eq(conversationsTable.userId, DEMO_USER_ID),
      isNull(conversationsTable.clearedAt),
    ))
    .returning();
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  res.json(UpdateConversationResponse.parse({
    ...conversation,
    createdAt: dateString(conversation.createdAt),
    updatedAt: dateString(conversation.updatedAt),
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
  let stored: Awaited<ReturnType<typeof saveConversationImage>>;
  try {
    stored = await saveConversationImage(req, attachmentId);
  } catch (error) {
    if (error instanceof ImageUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
  const attachment = {
    id: attachmentId,
    conversationId: params.data.conversationId,
    messageId: null,
    originalFilename: stored.originalFilename,
    mediaType: stored.mediaType,
    size: stored.size,
    storageKey: `${attachmentId}.${stored.storageKey.split(".").pop()}`,
  };
  try {
    await db.insert(messageAttachmentsTable).values(attachment);
  } catch (error) {
    await deleteConversationImage(attachment.id, stored.mediaType);
    throw error;
  }
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
    const mediaType = attachment.mediaType === "image/png" ? "image/png" : "image/jpeg";
    const data = await readConversationImage(attachment.id, mediaType);
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
  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));

  const supportContext = createSupportRequestContext(req, conversationId);
  const startedAt = Date.now();
  recordSupportEvent(req.log, { event: "support_request_started", context: supportContext });
  const history = await getConversationHistory(conversationId, userMessageId);
  const prepared = await prepareSupportRequest(supportContext, content, Boolean(attachment && !content), history, body.data.inputMode || "text", body.data.language || "en");
  recordSupportEvent(req.log, {
    event: "knowledge_retrieved",
    context: supportContext,
    evidenceCount: prepared.evidence.length,
    decision: prepared.decision,
  });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Expose-Headers", "X-Request-ID");
  res.setHeader("X-Request-ID", supportContext.requestId);
  res.flushHeaders();

  const abortController = new AbortController();
  let clientClosed = false;
  const onClientClosed = () => {
    if (!res.writableEnded) {
      clientClosed = true;
      abortController.abort();
    }
  };
  req.once("aborted", onClientClosed);
  res.once("close", onClientClosed);

  let fullResponse = "";
  let providerAnswerGenerated = false;
  let responseOutcome: AssistantResponseOutcome = "complete";

  try {
    if (attachment && !content) {
      fullResponse = IMAGE_NOT_SUPPORTED_RESPONSE;
      responseOutcome = "image_only";
    } else if (isPromptExtractionAttempt(content)) {
      fullResponse = PROMPT_EXTRACTION_RESPONSE;
      responseOutcome = "prompt_extraction";
    } else if (prepared.decision === "greeting") {
      fullResponse = "Hi! I'm KAMALO AI. How can I help you understand KAMALO?";
      responseOutcome = "greeting";
    } else if (prepared.retrieved.length === 0) {
      fullResponse = STAGE_ONE_FALLBACK;
      responseOutcome = prepared.decision === "fallback" ? "unknown" : "complete";
    } else {
      for await (const chunk of llmProvider.stream({
        messages: prepared.llmMessages,
        requestId: supportContext.requestId,
        signal: abortController.signal,
      })) {
        fullResponse += chunk;
      }
      providerAnswerGenerated = true;
    }
  } catch (error) {
    if (clientClosed) {
      req.log.info({ conversationId, requestId: supportContext.requestId }, "Client disconnected during response generation");
      req.removeListener("aborted", onClientClosed);
      res.removeListener("close", onClientClosed);
      return;
    }
    recordSupportEvent(req.log, {
      event: "provider_failure",
      context: supportContext,
      evidenceCount: prepared.evidence.length,
      outcome: "safe_fallback",
    });
    req.log.error({
      err: error,
      conversationId,
      requestId: supportContext.requestId,
      providerErrorKind: error instanceof OpenRouterError ? error.kind : "unknown",
      providerStatus: error instanceof OpenRouterError ? error.status : null,
      retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    }, "LLM request failed");
    fullResponse = SAFE_ASSISTANT_ERROR;
    responseOutcome = "provider_error";
  }

  const draftFallback = prepared.groundedFact || (/\b(?:mine|personal|current balance|my balance|my account|my coins|my silver|my gold|account balance|transaction reference|order history|order status)\b/i.test(content) ? STAGE_ONE_FALLBACK : SAFE_ASSISTANT_ERROR);
  const preferredResponse = containsProviderDrafting(fullResponse)
    ? draftFallback
    : preferGroundedFact(fullResponse || STAGE_ONE_FALLBACK, prepared.groundedFact);
  const condensedResponse = condenseAssistantOutput(sanitizeAssistantOutput(preferredResponse));
  const candidateResponse = keepCompleteAssistantOutput(condensedResponse);
  // Validate numeric claims against article content only. Article titles carry
  // internal sequence numbers that must never make an unsupported customer
  // number appear approved.
  const approvedSources = prepared.retrieved.map((article) => article.content);
  const outputIsGrounded = !providerAnswerGenerated
    || prepared.decision !== "knowledge_answer"
    || isGroundedAssistantOutput(candidateResponse, approvedSources, body.data.language || "en");
  const usedGroundingFallback = providerAnswerGenerated
    && prepared.decision === "knowledge_answer"
    && !outputIsGrounded;
  if (usedGroundingFallback) responseOutcome = "grounding_fallback";
  fullResponse = outputIsGrounded
    ? candidateResponse
    : keepCompleteAssistantOutput(prepared.groundedFact || STAGE_ONE_FALLBACK);
  if (!fullResponse) fullResponse = STAGE_ONE_FALLBACK;
  if (clientClosed) {
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  const assistantMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: fullResponse,
  };
  try {
    await db.insert(messagesTable).values(assistantMessage);
    await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, conversationId));
  } catch (error) {
    req.log.error({ err: error, conversationId, requestId: supportContext.requestId }, "Assistant response could not be persisted");
    await writeSse(res, { error: "The response could not be saved. Please try again." });
    res.end();
    req.removeListener("aborted", onClientClosed);
    res.removeListener("close", onClientClosed);
    return;
  }
  recordSupportEvent(req.log, {
    event: "response_completed",
    context: supportContext,
    latencyMs: Date.now() - startedAt,
    evidenceCount: prepared.evidence.length,
    outcome: fullResponse === SAFE_ASSISTANT_ERROR
      ? "safe_error"
      : usedGroundingFallback
        ? "grounding_fallback"
        : "complete",
  });
  await writeSse(res, { content: fullResponse });
  req.log.info({
    conversationId,
    requestId: supportContext.requestId,
    model: OPENROUTER_MODEL,
    provider: "OpenRouterProvider",
    latency: Date.now() - startedAt,
    retrievalUsed: prepared.retrieved.length > 0,
    retrievedArticleIds: prepared.retrieved.map((article) => article.id),
    groundingValidated: !providerAnswerGenerated || prepared.decision !== "knowledge_answer" || !usedGroundingFallback,
    responseStatus: "complete",
  }, "KAMALO AI response generated");
  await writeSse(res, { done: true, messageId: assistantMessage.id, finalContent: fullResponse, outcome: responseOutcome });
  res.end();
  req.removeListener("aborted", onClientClosed);
  res.removeListener("close", onClientClosed);
});

export default router;