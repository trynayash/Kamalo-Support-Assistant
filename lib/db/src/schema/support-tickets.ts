import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { conversationsTable } from "./conversations";
import { messagesTable } from "./messages";

export const supportTicketsTable = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  userId: text("user_id").notNull(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversationsTable.id, { onDelete: "cascade" }),
  messageId: text("message_id").references(() => messagesTable.id, { onDelete: "set null" }),
  category: text("category").notNull(),
  summary: text("summary").notNull(),
  details: text("details").notNull(),
  contactEmail: text("contact_email"),
  feedbackRating: text("feedback_rating"),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("normal"),
  assignedTo: text("assigned_to"),
  resolution: text("resolution"),
  resolutionSource: text("resolution_source"),
  emailStatus: text("email_status").notNull().default("not_sent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertSupportTicketSchema = createInsertSchema(supportTicketsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTicketsTable.$inferSelect;