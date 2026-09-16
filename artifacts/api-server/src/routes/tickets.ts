import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AnalyzeSupportTicketBody,
  AnalyzeSupportTicketResponse,
  CreateSupportTicketBody,
  CreateSupportTicketResponse,
  GetSupportTicketParams,
  GetSupportTicketResponse,
  ListSupportTicketsResponse,
  UpdateSupportTicketBody,
  UpdateSupportTicketResponse,
} from "@workspace/api-zod";
import {
  db,
  conversationsTable,
  messageAttachmentsTable,
  messagesTable,
  supportTicketAttachmentsTable,
  supportTicketsTable,
} from "@workspace/db";
import { sendTicketEmail } from "../lib/ticket-email";
import { llmProvider } from "../lib/llm";
import { capAssistantOutput, sanitizeAssistantOutput } from "../lib/safety";
import { retrieveKnowledge } from "../lib/knowledge";

const router: IRouter = Router();
const DEMO_USER_ID = "demo-user";

type TicketRow = typeof supportTicketsTable.$inferSelect;

function dateString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

async function ticketResponse(ticket: TicketRow) {
  const attachments = await db
    .select({ attachmentId: supportTicketAttachmentsTable.attachmentId })
    .from(supportTicketAttachmentsTable)
    .where(eq(supportTicketAttachmentsTable.ticketId, ticket.id));
  return {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: dateString(ticket.resolvedAt),
    attachmentIds: attachments.map((attachment) => attachment.attachmentId),
  };
}

async function ticketResponses(tickets: TicketRow[]) {
  if (tickets.length === 0) return [];
  const attachments = await db
    .select({ ticketId: supportTicketAttachmentsTable.ticketId, attachmentId: supportTicketAttachmentsTable.attachmentId })
    .from(supportTicketAttachmentsTable)
    .where(inArray(supportTicketAttachmentsTable.ticketId, tickets.map((ticket) => ticket.id)));
  const attachmentMap = new Map<string, string[]>();
  for (const attachment of attachments) {
    const current = attachmentMap.get(attachment.ticketId) || [];
    current.push(attachment.attachmentId);
    attachmentMap.set(attachment.ticketId, current);
  }
  return tickets.map((ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: dateString(ticket.resolvedAt),
    attachmentIds: attachmentMap.get(ticket.id) || [],
  }));
}

async function ticketById(id: string): Promise<TicketRow | null> {
  const [ticket] = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.id, id)).limit(1);
  return ticket || null;
}

router.get("/tickets", async (_req, res): Promise<void> => {
  const tickets = await db.select().from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, DEMO_USER_ID))
    .orderBy(desc(supportTicketsTable.createdAt));
  res.json(ListSupportTicketsResponse.parse(await ticketResponses(tickets)));
});

router.get("/tickets/admin", async (_req, res): Promise<void> => {
  const tickets = await db.select().from(supportTicketsTable).orderBy(desc(supportTicketsTable.createdAt));
  res.json(ListSupportTicketsResponse.parse(await ticketResponses(tickets)));
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateSupportTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a category, short summary, and ticket details." });
    return;
  }
  const input = parsed.data;
  const [conversation] = await db.select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, input.conversationId), eq(conversationsTable.userId, DEMO_USER_ID), isNull(conversationsTable.clearedAt)))
    .limit(1);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  if (input.messageId) {
    const [message] = await db.select({ id: messagesTable.id }).from(messagesTable)
      .where(and(eq(messagesTable.id, input.messageId), eq(messagesTable.conversationId, input.conversationId)))
      .limit(1);
    if (!message) {
      res.status(404).json({ error: "The referenced answer was not found." });
      return;
    }
  }
  const requestedAttachmentIds = Array.from(new Set(input.attachmentIds || []));
  if (requestedAttachmentIds.length > 0) {
    const attachments = await db.select({ id: messageAttachmentsTable.id }).from(messageAttachmentsTable)
      .where(and(eq(messageAttachmentsTable.conversationId, input.conversationId), inArray(messageAttachmentsTable.id, requestedAttachmentIds)));
    if (attachments.length !== requestedAttachmentIds.length) {
      res.status(400).json({ error: "One or more ticket images are not part of this conversation." });
      return;
    }
  }

  const now = new Date();
  const ticket = {
    id: crypto.randomUUID(),
    ticketNumber: `KAM-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    userId: DEMO_USER_ID,
    conversationId: input.conversationId,
    messageId: input.messageId || null,
    category: input.category.trim(),
    summary: input.summary.trim(),
    details: input.details.trim(),
    contactEmail: input.contactEmail || null,
    feedbackRating: input.feedbackRating || null,
    status: "open",
    priority: "normal",
    assignedTo: null,
    resolution: null,
    resolutionSource: null,
    emailStatus: input.contactEmail ? "not_sent" : "skipped",
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  } satisfies typeof supportTicketsTable.$inferInsert;

  await db.transaction(async (transaction) => {
    await transaction.insert(supportTicketsTable).values(ticket);
    if (requestedAttachmentIds.length > 0) {
      await transaction.insert(supportTicketAttachmentsTable).values(requestedAttachmentIds.map((attachmentId) => ({
        id: crypto.randomUUID(),
        ticketId: ticket.id,
        attachmentId,
      })));
    }
  });

  if (ticket.contactEmail) {
    try {
      await sendTicketEmail({
        to: ticket.contactEmail,
        subject: `KAMALO support ticket ${ticket.ticketNumber} received`,
        ticketNumber: ticket.ticketNumber,
        title: "We received your support request",
        body: "Your request is now in the KAMALO support queue. A specialist will review the conversation and follow up with a resolution.",
      });
      await db.update(supportTicketsTable).set({ emailStatus: "sent", updatedAt: new Date() }).where(eq(supportTicketsTable.id, ticket.id));
      ticket.emailStatus = "sent";
    } catch (error) {
      req.log.warn({ err: error, ticketNumber: ticket.ticketNumber }, "Ticket creation email failed");
      await db.update(supportTicketsTable).set({ emailStatus: "failed", updatedAt: new Date() }).where(eq(supportTicketsTable.id, ticket.id));
      ticket.emailStatus = "failed";
    }
  }

  res.status(201).json(CreateSupportTicketResponse.parse(await ticketResponse(ticket)));
});

router.get("/tickets/:ticketId", async (req, res): Promise<void> => {
  const params = GetSupportTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  const ticket = await ticketById(params.data.ticketId);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  res.json(GetSupportTicketResponse.parse(await ticketResponse(ticket)));
});

router.post("/tickets/:ticketId/analyze", async (req, res): Promise<void> => {
  const params = GetSupportTicketParams.safeParse(req.params);
  const parsed = AnalyzeSupportTicketBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Choose AI or human analysis." });
    return;
  }
  const ticket = await ticketById(params.data.ticketId);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  await db.update(supportTicketsTable).set({
    status: "in_review",
    assignedTo: parsed.data.mode === "ai" ? "KAMALO AI" : "Human specialist",
    updatedAt: new Date(),
  }).where(eq(supportTicketsTable.id, ticket.id));

  if (parsed.data.mode === "human") {
    res.json(AnalyzeSupportTicketResponse.parse({
      mode: "human",
      draftResolution: "Human specialist review requested. Confirm the account-safe resolution and add it below before marking this ticket resolved.",
    }));
    return;
  }

  const articles = await retrieveKnowledge(`${ticket.category} ${ticket.summary} ${ticket.details}`);
  const context = articles.map((article) => `[${article.category}] ${article.title}\n${article.content}`).join("\n\n");
  const prompt = `Review this KAMALO support ticket and write a concise, safe draft resolution for a human specialist to verify.

Ticket category: ${ticket.category}
Issue brief: ${ticket.summary}
Customer details: ${ticket.details}

Approved knowledge:
${context || "No approved knowledge matched this ticket."}

Do not claim account access, transaction checks, balances, refunds, completed actions, or facts absent from the approved knowledge. If the information is insufficient, say what the specialist must verify. Use plain English, short paragraphs, and no bullet characters.`;
  let draftResolution = "";
  try {
    draftResolution = await llmProvider.generate({
      messages: [
        { role: "system", content: "You are a support ticket analysis assistant. Produce a draft only; a human must verify it before sending." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });
  } catch (error) {
    req.log.warn({ err: error, ticketNumber: ticket.ticketNumber }, "AI ticket analysis failed");
  }
  draftResolution = capAssistantOutput(sanitizeAssistantOutput(draftResolution || "AI analysis could not produce a verified draft. Please review this ticket manually."));
  res.json(AnalyzeSupportTicketResponse.parse({ mode: "ai", draftResolution }));
});

router.patch("/tickets/:ticketId", async (req, res): Promise<void> => {
  const params = GetSupportTicketParams.safeParse(req.params);
  const parsed = UpdateSupportTicketBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid ticket update." });
    return;
  }
  const ticket = await ticketById(params.data.ticketId);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  const nextResolution = parsed.data.resolution === undefined ? ticket.resolution : parsed.data.resolution;
  if (parsed.data.status === "resolved" && !nextResolution?.trim()) {
    res.status(400).json({ error: "Add a resolution before closing this ticket as resolved." });
    return;
  }
  const now = new Date();
  const updatedValues = {
    status: parsed.data.status,
    assignedTo: parsed.data.assignedTo === undefined ? ticket.assignedTo : parsed.data.assignedTo,
    resolution: nextResolution || null,
    resolutionSource: parsed.data.resolutionSource === undefined ? ticket.resolutionSource : parsed.data.resolutionSource,
    resolvedAt: parsed.data.status === "resolved" ? (ticket.resolvedAt || now) : null,
    updatedAt: now,
  };
  await db.update(supportTicketsTable).set(updatedValues).where(eq(supportTicketsTable.id, ticket.id));

  let emailStatus = ticket.emailStatus;
  const shouldNotifyResolution = parsed.data.status === "resolved" && Boolean(ticket.contactEmail) && Boolean(nextResolution);
  if (shouldNotifyResolution && ticket.contactEmail) {
    try {
      await sendTicketEmail({
        to: ticket.contactEmail,
        subject: `KAMALO support ticket ${ticket.ticketNumber} resolved`,
        ticketNumber: ticket.ticketNumber,
        title: "Your support request has been resolved",
        body: "A KAMALO specialist reviewed your request and added the resolution below.",
        resolution: nextResolution || undefined,
      });
      emailStatus = "sent";
    } catch (error) {
      req.log.warn({ err: error, ticketNumber: ticket.ticketNumber }, "Ticket resolution email failed");
      emailStatus = "failed";
    }
    await db.update(supportTicketsTable).set({ emailStatus, updatedAt: new Date() }).where(eq(supportTicketsTable.id, ticket.id));
  }

  const refreshed = await ticketById(ticket.id);
  res.json(UpdateSupportTicketResponse.parse(await ticketResponse(refreshed || ticket)));
});

export default router;